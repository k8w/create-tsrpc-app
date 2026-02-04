# Complete Authentication Flow Example

This example shows a production-ready authentication system using TSRPC flows with **protocol config-driven** access control.

## Project Structure

```
src/
├── flows/
│   ├── index.ts          # Flow registration
│   ├── authFlow.ts       # Authentication (conf-driven)
│   └── loggingFlow.ts    # Request logging
├── models/
│   └── Auth.ts           # Auth utilities
└── index.ts              # Server entry
```

## 1. Type Extension

Extend TSRPC types to add custom fields to Connection. Write in any referenced `.ts` file (NOT `.d.ts`):

```typescript
// types/tsrpc-ext.ts
import { CurrentUser } from "../models/Auth";

// This is the TSRPC-recommended way to extend types
declare module 'tsrpc' {
    export interface BaseConnection {
        currentUser?: CurrentUser;
        __requestId?: string;
        __startTime?: number;
    }
}
```

## 2. Auth Utilities

```typescript
// models/Auth.ts
import * as jwt from 'jsonwebtoken';
import { ObjectId } from 'mongodb';
import { Global } from './Global';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const TOKEN_EXPIRY = '7d';

export interface CurrentUser {
    _id: ObjectId;
    username: string;
    email: string;
    roles: string[];
}

export class Auth {
    static generateToken(userId: string | ObjectId): string {
        return jwt.sign(
            { userId: userId.toString() },
            JWT_SECRET,
            { expiresIn: TOKEN_EXPIRY }
        );
    }

    static verifyToken(token: string): { userId: string } | null {
        try {
            return jwt.verify(token, JWT_SECRET) as { userId: string };
        } catch {
            return null;
        }
    }

    static async getUserById(userId: string): Promise<CurrentUser | null> {
        const user = await Global.collection('User').findOne(
            { _id: new ObjectId(userId) },
            { projection: { password: 0, salt: 0 } }
        );
        return user as CurrentUser | null;
    }

    static extractToken(authHeader?: string): string | null {
        if (!authHeader) return null;
        const parts = authHeader.split(' ');
        if (parts.length === 2 && parts[0] === 'Bearer') {
            return parts[1];
        }
        return authHeader;
    }
}
```

## 3. Authentication Flow (Config-Driven)

Instead of hardcoding public API lists, use protocol `conf` to control access:

```typescript
// flows/authFlow.ts
import { ApiCall } from "tsrpc";
import { Auth } from "../models/Auth";

export async function authFlow(call: ApiCall<any, any>) {
    // Read config from protocol definition (export const conf = { ... })
    const conf = call.service.conf;

    // If protocol has no conf or needLogin is not set, skip auth
    if (!conf?.needLogin) {
        return call;
    }

    // Get token from Authorization header or request body
    const authHeader = call.conn.httpReq?.headers['authorization'] as string | undefined;
    const token = Auth.extractToken(authHeader) || call.req.__token;

    if (!token) {
        call.error('Authentication required', { code: 'NEED_LOGIN' });
        return undefined;
    }

    // Verify token
    const payload = Auth.verifyToken(token);
    if (!payload) {
        call.error('Invalid or expired token', { code: 'INVALID_TOKEN' });
        return undefined;
    }

    // Get user from database
    const user = await Auth.getUserById(payload.userId);
    if (!user) {
        call.error('User not found', { code: 'USER_NOT_FOUND' });
        return undefined;
    }

    // Check role-based access from protocol conf
    if (conf.needRoles?.length) {
        const hasRole = conf.needRoles.some((r: string) => user.roles.includes(r));
        if (!hasRole) {
            call.error('Insufficient permissions', { code: 'FORBIDDEN' });
            return undefined;
        }
    }

    // Attach user to connection — available in API handler as call.conn.currentUser
    call.conn.currentUser = user;

    return call;
}
```

### Protocol examples with conf:

```typescript
// protocols/user/PtlGetProfile.ts — requires login
export interface ReqGetProfile { }
export interface ResGetProfile { profile: { /* ... */ } }
export const conf = { needLogin: true }

// protocols/admin/PtlDeleteUser.ts — requires admin role
export interface ReqDeleteUser { userId: string }
export interface ResDeleteUser { success: boolean }
export const conf = { needLogin: true, needRoles: ['admin'] }

// protocols/PtlGetPublicConfig.ts — public, no conf needed
export interface ReqGetPublicConfig { }
export interface ResGetPublicConfig { config: { /* ... */ } }
// No conf export → authFlow skips this API
```

## 4. Logging Flow

```typescript
// flows/loggingFlow.ts
import { ApiCall } from "tsrpc";

function generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export async function preLoggingFlow(call: ApiCall<any, any>) {
    call.conn.__requestId = generateRequestId();
    call.conn.__startTime = Date.now();

    // Sanitize sensitive data before logging
    const logData = { ...call.req };
    if (logData.password) logData.password = '***';
    if (logData.__token) logData.__token = '***';

    call.logger.log(`[${call.conn.__requestId}] -> ${call.service.name}`, {
        ip: call.conn.ip,
        user: call.conn.currentUser?.username || 'anonymous',
        data: logData
    });

    return call;
}

export async function postLoggingFlow(call: ApiCall<any, any>) {
    const duration = Date.now() - (call.conn.__startTime || 0);
    const status = call.return?.isSucc ? 'OK' : 'ERR';

    call.logger.log(
        `[${call.conn.__requestId}] <- ${call.service.name} [${status}] ${duration}ms`
    );

    if (call.return && !call.return.isSucc) {
        call.logger.warn(`[${call.conn.__requestId}] Error:`, call.return.err);
    }

    return call;
}
```

## 5. Flow Registration

```typescript
// flows/index.ts
import { HttpServer, WsServer } from "tsrpc";
import { authFlow } from "./authFlow";
import { preLoggingFlow, postLoggingFlow } from "./loggingFlow";

export function registerFlows(server: HttpServer<any> | WsServer<any>) {
    // Pre-API flows (order matters!)
    server.flows.preApiCallFlow.push(
        preLoggingFlow,  // Log first for debugging
        authFlow         // Then authenticate (conf-driven)
    );

    // Post-API flows
    server.flows.postApiCallFlow.push(
        postLoggingFlow
    );
}
```

## 6. Server Entry

```typescript
// index.ts
import path from "path";
import { HttpServer } from "tsrpc";
import { serviceProto } from "./shared/protocols/serviceProto";
import { registerFlows } from "./flows";
import { Global } from "./models/Global";

async function main() {
    await Global.initDb();

    const server = new HttpServer(serviceProto, {
        port: 3000,
        cors: '*'
    });

    registerFlows(server);

    await server.autoImplementApi(path.resolve(__dirname, 'api'));
    await server.start();
}

main();
```

## 7. Client-Side Flow: Pre-Login Check

Add a client-side flow to intercept API calls that require login:

```typescript
// client/flows.ts

// Auto-check login before calling APIs that need it
client.flows.preCallApiFlow.push(v => {
    // Read the same conf that server reads
    const conf = client.serviceMap.apiName2Service[v.apiName]!.conf;

    if (conf?.needLogin && !isLogined()) {
        // Redirect to login page
        window.location.href = '/login';
        return undefined;  // Abort the API call
    }

    // Auto-attach token to request
    if (isLogined()) {
        v.req.__token = getToken();
    }

    return v;
});
```

## 8. Using in API

```typescript
// api/user/ApiGetProfile.ts
import { ApiCall } from "tsrpc";
import { ReqGetProfile, ResGetProfile } from "../../shared/protocols/user/PtlGetProfile";

export async function ApiGetProfile(call: ApiCall<ReqGetProfile, ResGetProfile>) {
    // currentUser is guaranteed by authFlow (since conf.needLogin = true)
    const user = call.conn.currentUser!;

    call.succ({
        profile: {
            _id: user._id,
            username: user.username,
            email: user.email,
            roles: user.roles
        }
    });
}
```

## Key Takeaways

1. **Config-driven auth**: Use `export const conf = { needLogin: true }` in protocols instead of hardcoded API name lists
2. **Type extension**: Use `declare module 'tsrpc'` to add fields to `BaseConnection` — this is the TSRPC-recommended approach
3. **Flow order**: Rate limiting → Logging → Auth → Business logic
4. **Both sides**: Both server and client can read protocol `conf` for consistent behavior
5. **Sensitive data**: Always sanitize passwords and tokens in logs
6. **Pre vs Post**: Pre Flows abort blocks the API; Post Flow abort only stops remaining post nodes
