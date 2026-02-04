# TSRPC API Creation Guide

This skill helps you create new API endpoints in a TSRPC project following best practices.

## Quick Start

To create a new API, complete 3 steps:

1. **Define Protocol** — Create request/response types in `shared/protocols/`
2. **Implement API** — Create the API handler in `api/`
3. **Generate ServiceProto** — Run `cd backend && npm run proto`

## Step 1: Define Protocol

Create a new file `shared/protocols/Ptl{ApiName}.ts`:

```typescript
// shared/protocols/PtlHello.ts

// Request type — what the client sends
export interface ReqHello {
    name: string;
}

// Response type — what the server returns (success case only)
export interface ResHello {
    reply: string;
    time: Date;
}
```

### Naming and Routing Rules

**File naming:**
- File: `Ptl{ApiName}.ts` (e.g., `PtlHello.ts`, `PtlUserLogin.ts`)
- Request interface: `Req{ApiName}`
- Response interface: `Res{ApiName}`

**Subdirectory auto-routing:** Subdirectories automatically become API name prefixes. No manual route configuration needed.

| Protocol File Path | API Name | HTTP URL |
|---|---|---|
| `protocols/PtlHello.ts` | `Hello` | `POST /Hello` |
| `protocols/user/PtlLogin.ts` | `user/Login` | `POST /user/Login` |
| `protocols/admin/PtlGetUsers.ts` | `admin/GetUsers` | `POST /admin/GetUsers` |

### Protocol Extra Config

Add `export const conf` to embed configuration into ServiceProto, accessible at runtime in Flows:

```typescript
// protocols/order/PtlUpdateOrder.ts
export interface ReqUpdateOrder {
    orderId: string;
    status: string;
}
export interface ResUpdateOrder {
    success: boolean;
}

// This config is embedded into ServiceProto
export const conf = {
    needLogin: true,
    needRoles: ['admin', 'operator']
}
```

Access in server Flow: `call.service.conf?.needLogin`
Access in client Flow: `client.serviceMap.apiName2Service[v.apiName]!.conf`

### Response Type Design

Define response types for the **success case only**. Error handling is unified via `TsrpcError` — do NOT add `code`/`message`/`data` wrapper patterns:

```typescript
// WRONG — redundant error wrapper
export interface ResBad {
    code: number;
    message: string;
    data: { user: User };
}

// CORRECT — success case only
export interface ResGood {
    user: User;
}
```

### Supported Types

TSRPC supports all TypeScript types including:
- Primitives: `string`, `number`, `boolean`, `null`, `undefined`
- Objects, Arrays, Tuples
- Union Types: `string | number`
- Intersection Types: `A & B`
- Utility Types: `Pick<T>`, `Omit<T>`, `Partial<T>`
- Special types: `Date` (auto-serialized), `ArrayBuffer`, `Uint8Array`, `ObjectId` (MongoDB)

## Step 2: Implement API

Create a new file `api/Api{ApiName}.ts`. The file path must mirror the protocol path:
- `protocols/PtlHello.ts` → `api/ApiHello.ts`
- `protocols/user/PtlLogin.ts` → `api/user/ApiLogin.ts`

```typescript
// api/ApiHello.ts
import { ApiCall } from "tsrpc";
import { ReqHello, ResHello } from "../shared/protocols/PtlHello";

export async function ApiHello(call: ApiCall<ReqHello, ResHello>) {
    const { name } = call.req;  // Type-safe, validated by framework

    call.logger.log('Processing request for:', name);

    call.succ({
        reply: "Hello, " + name,
        time: new Date()
    });
}
```

### CRITICAL: call.succ() / call.error() are NOT return!

`call.succ()` and `call.error()` are function calls, **NOT** return statements. Code after them continues executing.

```typescript
// BUG — deliverGoods() executes even when balance is insufficient!
export async function ApiBuy(call: ApiCall<ReqBuy, ResBuy>) {
    if (insufficientBalance) {
        call.error('Insufficient balance');
        // Missing return! Code continues below...
    }

    deliverGoods();  // This runs even after call.error()!
    call.succ({ result: 'purchased' });
}
```

**Always return after call.error() or call.succ():**

```typescript
// CORRECT — two valid patterns:

// Pattern 1: return call.error/succ directly
if (insufficientBalance) {
    return call.error('Insufficient balance');
}

// Pattern 2: call.error/succ then return separately
call.succ({ result: 'purchased' });
return;
```

### Use call.logger, NOT console

A server handles many concurrent requests. `console.log` outputs are mixed together, making debugging difficult. `call.logger` auto-prefixes each log with `[ApiName #SN]` for easy filtering:

```typescript
export async function ApiOrder(call: ApiCall<ReqOrder, ResOrder>) {
    // Output: [ApiOrder #15] Processing order 12345
    call.logger.log('Processing order', call.req.orderId);

    // Add custom prefix for tracing
    call.logger.prefixs.push(`UserID=${call.conn.currentUser?.userId}`);
    // Output: [ApiOrder #15] [UserID=abc123] Deducting balance

    call.logger.warn('Low stock warning');
    call.logger.error('Payment failed', error);
}
```

### throw TsrpcError for Code Layering

When business logic is split into separate modules, use `throw new TsrpcError()` to propagate errors without passing `call` around:

```typescript
import { TsrpcError } from 'tsrpc';

// Shared business module — no TSRPC dependency
function checkPermission(user: User, requiredRole: string) {
    if (!user.roles.includes(requiredRole)) {
        throw new TsrpcError('Permission denied', { code: 'FORBIDDEN' });
    }
}

function validateOrder(order: Order) {
    if (order.amount <= 0) {
        throw new TsrpcError('Invalid order amount', { code: 'INVALID_INPUT' });
    }
}

// API handler — thrown TsrpcError is auto-caught and returned to client
export async function ApiUpdateOrder(call: ApiCall<ReqUpdateOrder, ResUpdateOrder>) {
    checkPermission(call.conn.currentUser, 'operator');  // Throws if no permission
    validateOrder(call.req.order);                        // Throws if invalid

    // If we reach here, all checks passed
    await processOrder(call.req.order);
    call.succ({ success: true });
}
```

- `TsrpcError` thrown → returned to client as business error (`ApiError` type)
- Other errors thrown → returned as `ServerError` with generic message "Server Internal Error"

### Error Response Patterns

```typescript
// Simple error
return call.error('User not found');

// Error with code (for client-side programmatic handling)
return call.error('Please login first', { code: 'NEED_LOGIN' });

// Error with additional data
return call.error('Rate limited', { code: 'RATE_LIMITED', retryAfter: 60 });
```

### Access Connection Info

```typescript
export async function ApiGetProfile(call: ApiCall<ReqGetProfile, ResGetProfile>) {
    const ip = call.conn.ip;                           // Client IP
    const user = call.conn.currentUser;                // Set by auth flow
    const headers = call.conn.httpReq?.headers;        // HTTP headers (HTTP only)
    const service = call.service;                      // Service metadata
    const conf = call.service.conf;                    // Protocol conf
}
```

## Step 3: Generate ServiceProto

After creating protocol and API files, regenerate the service protocol:

```bash
cd backend && npm run proto
# Or: npx tsrpc-cli proto --input ./src/shared/protocols --output ./src/shared/protocols/serviceProto.ts
```

**During development:** `npm run dev` auto-watches protocol files and regenerates on changes — no need to run manually.

**IMPORTANT:** `serviceProto.ts` is auto-generated. **NEVER edit it manually.**

## API Registration (Mounting)

### Auto-mount (recommended)

```typescript
// index.ts — scans api/ directory and registers all Api*.ts files
await server.autoImplementApi(path.resolve(__dirname, 'api'));
```

Rules:
- Scans all `PtlXXX.ts` in protocols, looks for matching `ApiXXX.ts` in api directory
- `protocols/a/b/PtlXXX.ts` matches `api/a/b/ApiXXX.ts`
- Looks for exported function `ApiXXX`, falls back to `default` export
- Pass `true` as 2nd argument for lazy mounting (faster cold start)

### Manual mount

```typescript
server.implementApi('user/Login', async call => {
    // API implementation
});
```

Register all APIs before calling `server.start()`.

## Client-Side Usage

**callApi never throws exceptions.** All errors (network, server, business) are returned via `ret.err`:

```typescript
const ret = await client.callApi('Hello', { name: 'World' });

if (ret.isSucc) {
    // TypeScript knows ret.res exists here
    console.log(ret.res.reply);
    console.log(ret.res.time);   // Date object, auto-deserialized
} else {
    // TypeScript knows ret.err exists here
    console.error(ret.err.message);
    console.error(ret.err.code);  // e.g., 'NEED_LOGIN'
}

// TypeScript FORCES error checking — this won't compile:
// console.log(ret.res.reply);  // ERROR: ret.res might be undefined
```

### Request Cancellation

```typescript
// Cancel by SN
client.callApi('SlowSearch', { ... });
client.abort(client.lastSN);

// Cancel by key (useful for component unmount)
client.callApi('Search', { ... }, { abortKey: 'searchPage' });
client.abortByKey('searchPage');

// Cancel all
client.abortAll();
```

## See Also

- Run `/tsrpc-flow` to add middleware (authentication, logging, etc.)
- Run `/tsrpc-msg` to implement real-time messaging
- Run `/tsrpc-db` to set up database operations
