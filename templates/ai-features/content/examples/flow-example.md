# Complete Authentication Flow Example

This example shows a production-ready authentication system using TSRPC flows.

## Project Structure

```
src/
├── flows/
│   ├── index.ts          # Flow registration
│   ├── authFlow.ts       # Authentication
│   └── loggingFlow.ts    # Request logging
├── models/
│   └── Auth.ts           # Auth utilities
└── index.ts              # Server entry
```

## 1. Auth Utilities

```typescript
// models/Auth.ts
import * as jwt from 'jsonwebtoken';
import { ObjectId } from 'mongodb';
import { Global } from './Global';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const TOKEN_EXPIRY = '7d';

export interface TokenPayload {
    userId: string;
    exp: number;
}

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

    static verifyToken(token: string): TokenPayload | null {
        try {
            return jwt.verify(token, JWT_SECRET) as TokenPayload;
        } catch {
            return null;
        }
    }

    static async getUserById(userId: string): Promise<CurrentUser | null> {
        const user = await Global.db.collection('users').findOne(
            { _id: new ObjectId(userId) },
            { projection: { password: 0, salt: 0 } }  // Exclude sensitive fields
        );
        return user as CurrentUser | null;
    }

    static extractToken(authHeader?: string): string | null {
        if (!authHeader) return null;
        // Support "Bearer <token>" format
        const parts = authHeader.split(' ');
        if (parts.length === 2 && parts[0] === 'Bearer') {
            return parts[1];
        }
        return authHeader;
    }
}
```

## 2. Authentication Flow

```typescript
// flows/authFlow.ts
import { ApiCall, BaseConnection } from "tsrpc";
import { Auth, CurrentUser } from "../models/Auth";

// Extend connection type to include currentUser
declare module 'tsrpc' {
    interface BaseConnection {
        currentUser?: CurrentUser;
    }
}

// APIs that don't require authentication
const PUBLIC_APIS = new Set([
    'Login',
    'Register',
    'ForgotPassword',
    'ResetPassword',
    'GetPublicConfig'
]);

// APIs that require admin role
const ADMIN_APIS = new Set([
    'AdminGetUsers',
    'AdminDeleteUser',
    'AdminUpdateSettings'
]);

export async function authFlow(call: ApiCall<any, any>) {
    const apiName = call.service.name;

    // Skip auth for public APIs
    if (PUBLIC_APIS.has(apiName)) {
        return call;
    }

    // Get token from Authorization header
    const authHeader = call.conn.httpReq?.headers['authorization'] as string | undefined;
    const token = Auth.extractToken(authHeader) || call.req.__token;

    if (!token) {
        call.error('Authentication required', {
            code: 'NEED_LOGIN',
            httpCode: 401
        });
        return undefined;
    }

    // Verify token
    const payload = Auth.verifyToken(token);
    if (!payload) {
        call.error('Invalid or expired token', {
            code: 'INVALID_TOKEN',
            httpCode: 401
        });
        return undefined;
    }

    // Get user from database
    const user = await Auth.getUserById(payload.userId);
    if (!user) {
        call.error('User not found', {
            code: 'USER_NOT_FOUND',
            httpCode: 401
        });
        return undefined;
    }

    // Check admin permission for admin APIs
    if (ADMIN_APIS.has(apiName) && !user.roles.includes('admin')) {
        call.error('Admin permission required', {
            code: 'FORBIDDEN',
            httpCode: 403
        });
        return undefined;
    }

    // Attach user to connection
    call.conn.currentUser = user;

    return call;
}
```

## 3. Logging Flow

```typescript
// flows/loggingFlow.ts
import { ApiCall, BaseConnection } from "tsrpc";

declare module 'tsrpc' {
    interface BaseConnection {
        __requestId?: string;
        __startTime?: number;
    }
}

function generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export async function preLoggingFlow(call: ApiCall<any, any>) {
    call.conn.__requestId = generateRequestId();
    call.conn.__startTime = Date.now();

    // Log request (sanitize sensitive data)
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

    // Log errors with details
    if (call.return && !call.return.isSucc) {
        call.logger.warn(`[${call.conn.__requestId}] Error:`, call.return.err);
    }

    return call;
}
```

## 4. Flow Registration

```typescript
// flows/index.ts
import { HttpServer, WsServer } from "tsrpc";
import { authFlow } from "./authFlow";
import { preLoggingFlow, postLoggingFlow } from "./loggingFlow";

export function registerFlows(server: HttpServer<any> | WsServer<any>) {
    // Pre-API flows (order matters!)
    server.flows.preApiCallFlow.push(
        preLoggingFlow,  // Log first for debugging
        authFlow         // Then authenticate
    );

    // Post-API flows
    server.flows.postApiCallFlow.push(
        postLoggingFlow
    );
}
```

## 5. Server Entry

```typescript
// index.ts
import { HttpServer } from "tsrpc";
import { serviceProto } from "./shared/protocols/serviceProto";
import { registerFlows } from "./flows";
import { Global } from "./models/Global";

async function main() {
    // Initialize database
    await Global.initDb();

    // Create server
    const server = new HttpServer(serviceProto, {
        port: 3000,
        cors: '*'
    });

    // Register flows
    registerFlows(server);

    // Auto-implement APIs from ./api folder
    await server.autoImplementApi(path.resolve(__dirname, 'api'));

    // Start server
    await server.start();
    console.log('Server started on port 3000');
}

main();
```

## 6. Using in API

```typescript
// api/ApiGetProfile.ts
import { ApiCall } from "tsrpc";
import { ReqGetProfile, ResGetProfile } from "../shared/protocols/PtlGetProfile";

export async function ApiGetProfile(call: ApiCall<ReqGetProfile, ResGetProfile>) {
    // currentUser is guaranteed to exist (authFlow ran first)
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

1. **Type Extension**: Use `declare module` to extend connection types
2. **Flow Order**: Logging -> Auth -> Business logic
3. **Error Codes**: Use consistent error codes for client handling
4. **Sensitive Data**: Always sanitize passwords and tokens in logs
5. **Request ID**: Generate unique IDs for request tracing
