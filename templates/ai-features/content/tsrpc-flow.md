# TSRPC Flow (Middleware) Guide

This skill helps you add Flow middleware to your TSRPC project for cross-cutting concerns like authentication, logging, rate limiting, and data transformation.

## What is Flow?

Flow is TSRPC's middleware system — a pipeline of functions that intercept and process requests/responses at various stages.

**Key design principle:** Flow is **universal across server and client**. Both sides use the same programming model.

### FlowNode Definition

```typescript
type FlowNodeReturn<T> = T | null | undefined;
type FlowNode<T> = (item: T) => FlowNodeReturn<T> | Promise<FlowNodeReturn<T>>;
```

Each Flow is an array of `FlowNode` functions. Push your functions to extend behavior:

```typescript
server.flows.preApiCallFlow.push(async call => {
    // Process...
    return call;      // Continue to next node
    // return undefined;  // Abort flow
});
```

### Pre Flow vs Post Flow

- **Pre Flow** abort → **blocks** subsequent TSRPC workflow
  - e.g., `preApiCallFlow` abort prevents API execution
  - e.g., client `preCallApiFlow` abort prevents `callApi`
- **Post Flow** abort → does **NOT block** subsequent workflow (only stops remaining Post Flow nodes)
  - e.g., `postConnectFlow` abort does NOT prevent connection establishment

### Execution Order

Flows execute in push order. Add critical flows (rate limiting, auth) before others:

```typescript
server.flows.preApiCallFlow.push(flowA);  // Runs first
server.flows.preApiCallFlow.push(flowB);  // Runs second
server.flows.preApiCallFlow.push(flowC);  // Runs third
```

## Complete Server Flows

Access via `server.flows`:

| Name | Stage | Description |
|------|-------|-------------|
| `postConnectFlow` | Connection | After client connects |
| `postDisconnectFlow` | Connection | After client disconnects |
| `preRecvDataFlow` | Data | Before processing received data |
| `preSendDataFlow` | Data | Before sending data |
| `preApiCallFlow` | API | Before executing API handler |
| `preApiReturnFlow` | API | Before returning API result (`call.succ`/`call.error`) |
| `postApiReturnFlow` | API | After returning API result |
| `postApiCallFlow` | API | After API handler execution |
| `preMsgCallFlow` | Message | Before triggering Message listener |
| `postMsgCallFlow` | Message | After triggering Message listener |
| `preSendMsgFlow` | Message | Before sending Message |
| `postSendMsgFlow` | Message | After sending Message |

## Complete Client Flows

Access via `client.flows`:

| Name | Stage | Description |
|------|-------|-------------|
| `preCallApiFlow` | API | Before `callApi` |
| `preApiReturnFlow` | API | Before returning `callApi` result to caller |
| `postApiReturnFlow` | API | After returning `callApi` result to caller |
| `preSendMsgFlow` | Message | Before `sendMsg` |
| `postSendMsgFlow` | Message | After `sendMsg` |
| `preRecvMsgFlow` | Message | Before receiving Message |
| `postRecvMsgFlow` | Message | After receiving Message |
| `preSendDataFlow` | Data | Before sending any data |
| `preRecvDataFlow` | Data | Before processing any received data |
| `preConnectFlow` | Connection | Before connecting (WebSocket only) |
| `postConnectFlow` | Connection | After connecting (WebSocket only) |
| `postDisconnectFlow` | Connection | After disconnecting (WebSocket only) |

## Type Extension

Many Flows pass `Connection` or `Call` objects. To add custom fields, extend TSRPC types:

### Recommended: Extend tsrpc module types

Write this in any referenced `.ts` file (NOT `.d.ts`):

```typescript
// types/tsrpc-ext.ts (or directly in index.ts)
declare module 'tsrpc' {
    export interface BaseConnection {
        currentUser?: {
            userId: string;
            nickname: string;
            roles: string[];
        };
    }
}
```

After this, `call.conn.currentUser` is valid everywhere — in Flows and API handlers:

```typescript
// In Flow
server.flows.preApiCallFlow.push(call => {
    call.conn.currentUser = { userId: '123', nickname: 'test', roles: ['user'] };
    return call;
});

// In API
export async function ApiGetProfile(call: ApiCall<ReqGetProfile, ResGetProfile>) {
    call.logger.log(call.conn.currentUser!.nickname);  // Valid
}
```

### Alternative: Create new types (for multi-server scenarios)

```typescript
type MyCall<Req = any, Res = any> = ApiCall<Req, Res> & {
    currentUser: { userId: string; nickname: string };
}

export async function ApiXXX(call: MyCall<ReqXXX, ResXXX>) {
    call.currentUser.nickname;  // Valid
}
```

## Protocol Config-Driven Flow Control

Instead of hardcoding API name lists, use protocol `conf` to drive Flow behavior:

### Define conf in protocol

```typescript
// protocols/order/PtlUpdateOrder.ts
export interface ReqUpdateOrder { /* ... */ }
export interface ResUpdateOrder { /* ... */ }

export const conf = {
    needLogin: true,
    needRoles: ['admin', 'operator']
}
```

```typescript
// protocols/PtlGetPublicData.ts
export interface ReqGetPublicData { /* ... */ }
export interface ResGetPublicData { /* ... */ }

// No conf or needLogin: false → public API
```

### Server-side: Read conf in Flow

```typescript
server.flows.preApiCallFlow.push(async call => {
    const conf = call.service.conf;

    // Skip auth for APIs without needLogin
    if (!conf?.needLogin) {
        return call;
    }

    // Verify token and get user
    const token = call.req.__token;
    const user = await verifyToken(token);
    if (!user) {
        call.error('Please login first', { code: 'NEED_LOGIN' });
        return undefined;
    }

    // Check role permissions
    if (conf.needRoles?.length) {
        const hasRole = conf.needRoles.some((r: string) => user.roles.includes(r));
        if (!hasRole) {
            call.error('Permission denied', { code: 'FORBIDDEN' });
            return undefined;
        }
    }

    call.conn.currentUser = user;
    return call;
});
```

### Client-side: Read conf in Flow

```typescript
client.flows.preCallApiFlow.push(v => {
    const conf = client.serviceMap.apiName2Service[v.apiName]!.conf;

    if (conf?.needLogin && !isLogined()) {
        // Redirect to login page
        window.location.href = '/login';
        return undefined;  // Abort API call
    }

    return v;
});
```

## Common Flow Patterns

### 1. Authentication Flow (Config-Driven)

```typescript
// flows/authFlow.ts
import { ApiCall } from "tsrpc";

export async function authFlow(call: ApiCall<any, any>) {
    const conf = call.service.conf;

    // Skip auth for APIs without needLogin conf
    if (!conf?.needLogin) {
        return call;
    }

    const token = call.req.__token || call.conn.httpReq?.headers['authorization'];
    if (!token) {
        call.error('Authentication required', { code: 'NEED_LOGIN' });
        return undefined;
    }

    const user = await verifyToken(token);
    if (!user) {
        call.error('Invalid or expired token', { code: 'INVALID_TOKEN' });
        return undefined;
    }

    // Check role-based access
    if (conf.needRoles?.length) {
        const hasRole = conf.needRoles.some((r: string) => user.roles.includes(r));
        if (!hasRole) {
            call.error('Insufficient permissions', { code: 'FORBIDDEN' });
            return undefined;
        }
    }

    call.conn.currentUser = user;
    return call;
}
```

### 2. Logging Flow

```typescript
// flows/loggingFlow.ts
import { ApiCall } from "tsrpc";

export async function preLoggingFlow(call: ApiCall<any, any>) {
    (call as any).__startTime = Date.now();
    call.logger.log(`-> ${call.service.name}`, JSON.stringify(call.req));
    return call;
}

export async function postLoggingFlow(call: ApiCall<any, any>) {
    const duration = Date.now() - ((call as any).__startTime || 0);
    const status = call.return?.isSucc ? 'SUCCESS' : 'ERROR';
    call.logger.log(`<- ${call.service.name} [${status}] ${duration}ms`);
    return call;
}
```

### 3. Rate Limiting Flow

```typescript
// flows/rateLimitFlow.ts
import { ApiCall } from "tsrpc";

const requestCounts = new Map<string, { count: number; resetTime: number }>();
const LIMIT = 100;
const WINDOW = 60000; // 1 minute

export async function rateLimitFlow(call: ApiCall<any, any>) {
    const clientId = call.conn.ip;
    const now = Date.now();

    let record = requestCounts.get(clientId);
    if (!record || now > record.resetTime) {
        record = { count: 0, resetTime: now + WINDOW };
        requestCounts.set(clientId, record);
    }

    record.count++;

    if (record.count > LIMIT) {
        call.error('Too many requests', { code: 'RATE_LIMITED' });
        return undefined;
    }

    return call;
}
```

### 4. Session / Cookie Pattern

TSRPC is transport-agnostic and doesn't use HTTP cookies directly. Implement cross-platform sessions via `BaseRequest`/`BaseResponse`:

```typescript
// shared/protocols/base.ts
export interface BaseRequest {
    __cookie?: { sessionId?: string; [key: string]: any };
}
export interface BaseResponse {
    __cookie?: { sessionId?: string; [key: string]: any };
}
```

**Client Flow — auto-attach cookie:**
```typescript
client.flows.preCallApiFlow.push(v => {
    const cookieStr = localStorage.getItem('tsrpc_cookie');
    v.req.__cookie = cookieStr ? JSON.parse(cookieStr) : undefined;
    return v;
});

client.flows.preApiReturnFlow.push(v => {
    if (v.return.isSucc && v.return.res.__cookie) {
        localStorage.setItem('tsrpc_cookie', JSON.stringify(v.return.res.__cookie));
    }
    return v;
});
```

### 5. Client Pre-Login Check Flow

```typescript
client.flows.preCallApiFlow.push(v => {
    const conf = client.serviceMap.apiName2Service[v.apiName]!.conf;

    if (conf?.needLogin && !isLogined()) {
        // Option 1: Redirect to login
        window.location.href = '/login';
        return undefined;

        // Option 2: Show login dialog, resume after login
        // showLoginDialog().then(() => client.callApi(v.apiName, v.req));
        // return undefined;
    }

    return v;
});
```

## Complete Setup Example

```typescript
// index.ts
import { HttpServer } from "tsrpc";
import { serviceProto } from "./shared/protocols/serviceProto";
import { authFlow } from "./flows/authFlow";
import { preLoggingFlow, postLoggingFlow } from "./flows/loggingFlow";
import { rateLimitFlow } from "./flows/rateLimitFlow";

const server = new HttpServer(serviceProto, { port: 3000 });

// Pre-API flows (order matters!)
server.flows.preApiCallFlow.push(
    rateLimitFlow,      // 1. Check rate limit
    preLoggingFlow,     // 2. Log incoming request
    authFlow            // 3. Verify authentication (conf-driven)
);

// Post-API flows
server.flows.postApiCallFlow.push(
    postLoggingFlow     // Log response and timing
);

await server.autoImplementApi(path.resolve(__dirname, 'api'));
await server.start();
```

## See Also

- Run `/tsrpc-api` to create new API endpoints
- Run `/tsrpc-msg` to implement real-time messaging
