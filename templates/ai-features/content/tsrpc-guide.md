# TSRPC Framework Reference Guide

TSRPC is an RPC framework designed specifically for TypeScript, enabling type-safe full-stack development with runtime validation. Battle-tested with tens of millions of users in production.

## Project Structure

```
project/
├── backend/
│   ├── src/
│   │   ├── api/                    # API implementations (Api*.ts)
│   │   ├── shared/                 # Shared code (symlinked to frontend)
│   │   │   └── protocols/
│   │   │       ├── PtlHello.ts     # Protocol definitions
│   │   │       └── serviceProto.ts # Auto-generated, NEVER edit manually
│   │   └── index.ts                # Server entry
│   └── package.json
│
└── frontend/
    ├── src/
    │   └── shared -> ../../backend/src/shared  # Symlink
    └── package.json
```

## Core Concepts

### 1. Protocol (Ptl*.ts)

Protocols define the contract between client and server:

```typescript
// PtlHello.ts
export interface ReqHello {
    name: string;
}

export interface ResHello {
    greeting: string;
}
```

**Naming Convention:**
- File: `Ptl{ApiName}.ts`
- Request: `Req{ApiName}`
- Response: `Res{ApiName}`

**Subdirectory Routing:** Subdirectories automatically map to API name prefixes.
- `protocols/user/PtlLogin.ts` -> API name: `user/Login`
- `protocols/admin/PtlGetUsers.ts` -> API name: `admin/GetUsers`
- HTTP URL: `POST /user/Login` (automatic routing, no manual configuration)

**Protocol Extra Config:** You can add `export const conf` in protocol files to embed custom configuration into ServiceProto:

```typescript
// PtlUpdateOrder.ts
export interface ReqUpdateOrder { /* ... */ }
export interface ResUpdateOrder { /* ... */ }

// Extra config - automatically embedded into ServiceProto
export const conf = {
    needLogin: true,
    needRoles: ['admin']
}
```

Access at runtime via `call.service.conf` (server) or `client.serviceMap.apiName2Service[apiName]!.conf` (client).

### 2. API Implementation (Api*.ts)

```typescript
// ApiHello.ts
import { ApiCall } from "tsrpc";

export async function ApiHello(call: ApiCall<ReqHello, ResHello>) {
    call.succ({ greeting: "Hello, " + call.req.name });
}
```

### 3. ServiceProto

Auto-generated file containing all protocol metadata including type definitions and `conf` values.

**Generation methods:**
- `npm run dev` — auto-watches protocol files and regenerates on changes
- `npm run build` — regenerates before production build
- `npm run proto` — manual regeneration

**Protocol change compatibility:** Adding new optional fields is backward-compatible. Removing fields or changing types requires simultaneous client update.

**NEVER edit `serviceProto.ts` manually** — always modify `Ptl*.ts` files and regenerate.

### 4. Server

```typescript
// HTTP Server
import { HttpServer } from "tsrpc";
const server = new HttpServer(serviceProto, { port: 3000 });

// WebSocket Server
import { WsServer } from "tsrpc";
const server = new WsServer(serviceProto, { port: 3001 });
```

### 5. Client

```typescript
// HTTP Client
import { HttpClient } from "tsrpc-browser";
const client = new HttpClient(serviceProto, {
    server: 'http://localhost:3000'
});

// WebSocket Client
import { WsClient } from "tsrpc-browser";
const client = new WsClient(serviceProto, {
    server: 'ws://localhost:3001'
});
```

## Runtime Type System

TSRPC implements a standalone, lightweight runtime type system that works beyond TypeScript's compile-time checks.

### Dual Validation

1. **Client-side validation** — invalid requests are caught locally before sending
2. **Server-side validation** — requests are validated again before entering the API handler

Invalid requests are automatically rejected with descriptive error messages. No manual validation code needed for type safety.

### Field Stripping (Security Feature)

TSRPC automatically removes fields not defined in the protocol, both on request input and response output.

**Security example:** If `ReqUpdate` only defines `{ id: number; update: { nickname?: string } }`, a malicious request containing `update.role: "admin"` will have the `role` field automatically stripped before reaching your API handler.

This prevents privilege escalation attacks — extra fields are silently removed, not errored.

**Opt-out:** If you need dynamic fields, use TypeScript index signatures: `[key: string]: any`.

### Supported Types

TSRPC supports all TypeScript types:

| Type | Example |
|------|---------|
| Primitives | `string`, `number`, `boolean`, `null`, `undefined` |
| Literal | `'active' \| 'inactive'`, `1 \| 2 \| 3` |
| Array | `string[]`, `Array<number>` |
| Tuple | `[string, number]` |
| Object | `{ name: string; age: number }` |
| Union | `string \| number` |
| Intersection | `User & { token: string }` |
| Utility | `Pick<T>`, `Omit<T>`, `Partial<T>`, `Required<T>` |
| Date | `Date` (auto-serialized in JSON) |
| Binary | `ArrayBuffer`, `Uint8Array` |
| MongoDB | `ObjectId` (with tsbuffer-plugin-mongodb) |

### Enhanced JSON Types

Even when using JSON transport (not binary), TSRPC supports types beyond standard JSON:

- **`Date`** — automatically serialized/deserialized during JSON transmission
- **`ArrayBuffer` / `Uint8Array`** — binary data can be sent directly, no base64 conversion needed
- **`ObjectId`** — MongoDB ObjectId support via tsbuffer-plugin-mongodb

### Binary Serialization

TSRPC can encode TypeScript types directly to binary without Protobuf:

- Smaller payload, ideal for weak networks and mobile
- Natural anti-tampering (binary is not human-readable)
- Switch by toggling `json: true` option on client/server
- Server supports both JSON and binary simultaneously when `json: true` is enabled

## TsrpcError Error System

All errors returned from server to client are `TsrpcError` instances:

```typescript
class TsrpcError {
    message: string;           // Human-readable error message (required)
    type: TsrpcErrorType;      // Error category
    code?: string | number;    // Optional error code
    [key: string]: any;        // Arbitrary extra fields
}
```

### Error Types

```typescript
enum TsrpcErrorType {
    NetworkError = "NetworkError",   // Network failure
    ServerError = "ServerError",     // Server internal error (uncaught exception)
    ClientError = "ClientError",     // Client internal error
    ApiError = "ApiError"            // Business logic error (default for call.error)
}
```

- `call.error()` defaults to `type: ApiError`
- Uncaught exceptions in API handlers become `ServerError` with message "Server Internal Error"

### throw TsrpcError Pattern

For code split across multiple layers, use `throw new TsrpcError()` to propagate errors directly to the client without passing `call` around:

```typescript
import { TsrpcError } from 'tsrpc';

// Business logic module — no dependency on call
function checkBalance(balance: number, amount: number) {
    if (balance < amount) {
        throw new TsrpcError('Insufficient balance', { code: 'NOT_ENOUGH' });
    }
}

// API handler — thrown TsrpcError is automatically caught and returned as call.error
export async function ApiBuy(call: ApiCall<ReqBuy, ResBuy>) {
    checkBalance(user.balance, call.req.amount); // Throws if insufficient
    // ... proceed with purchase
    call.succ({ result: 'success' });
}
```

- `TsrpcError` thrown → returned to client as-is (business error)
- Other errors thrown → returned as `ServerError` with generic message

## API Call Patterns

### Server-side

**Success Response:**
```typescript
call.succ({ data: result });
```

**Error Response:**
```typescript
call.error('Error message');
call.error('Error message', { code: 'ERROR_CODE' });
```

**CRITICAL: `call.succ()` / `call.error()` are NOT return statements!**
Code continues executing after them. Always `return` explicitly:
```typescript
// CORRECT
return call.error('Not found');

// WRONG — code after this line still executes!
call.error('Not found');
deliverGoods(); // This runs even though error was sent!
```

**Access Request Data:**
```typescript
const { name, page } = call.req;
```

**Request-scoped Logging:**
```typescript
// Use call.logger instead of console — auto-prefixed with [ApiName #SN]
call.logger.log('Processing request');
call.logger.warn('Something unexpected');
call.logger.error('Failed', errorObject);

// Add custom prefix
call.logger.prefixs.push('UserID=123');
```

**Access Connection:**
```typescript
const ip = call.conn.ip;
const user = call.conn.currentUser;             // Custom data set in flows
const headers = call.conn.httpReq?.headers;      // HTTP only
```

### Client-side

**callApi never throws exceptions.** All errors are returned via `ret.err`:

```typescript
const ret = await client.callApi('Hello', { name: 'World' });

if (ret.isSucc) {
    console.log(ret.res.greeting);  // TypeScript knows ret.res exists
} else {
    console.error(ret.err.message); // TypeScript knows ret.err exists
    console.error(ret.err.code);    // Optional error code
}

// TypeScript FORCES error checking:
// ret.res.greeting  // ERROR: ret.res might be undefined
```

### Request Cancellation

```typescript
// Cancel single request by SN
client.callApi('Slow', { ... });
const sn = client.lastSN;
client.abort(sn);

// Cancel multiple requests by key
client.callApi('Search', { ... }, { abortKey: 'searchPage' });
client.callApi('List', { ... }, { abortKey: 'searchPage' });
client.abortByKey('searchPage'); // Cancels both

// Cancel all pending requests
client.abortAll();
```

Cancelled requests neither resolve nor reject — their callbacks are simply discarded.

## WebSocket Messages

### Define Message Protocol
```typescript
// MsgChat.ts
export interface MsgChat {
    content: string;
    fromUserId: string;
    time: Date;
}
```

### Server: Listen and Send
```typescript
// Listen for messages
server.listenMsg('Chat', call => {
    call.msg;   // MsgChat data
    call.conn;  // Sender's connection
});

// Send to specific connection
conn.sendMsg('Chat', { content: 'Hello', fromUserId: 'system', time: new Date() });

// Broadcast to all connections
server.broadcastMsg('Chat', { content: 'Hello', fromUserId: 'system', time: new Date() });

// Broadcast to filtered connections
server.broadcastMsg('Chat', msg, conns.filter(c => c.roomId === targetRoom));
```

### Client: Send/Listen
```typescript
client.sendMsg('Chat', { content: 'Hello', fromUserId: 'me', time: new Date() });

const handler = client.listenMsg('Chat', msg => {
    console.log('Received:', msg.content);
});

client.unlistenMsg('Chat', handler);
```

## Flow (Middleware)

```typescript
// Pre-API flow — return undefined to block API execution
server.flows.preApiCallFlow.push(async call => {
    return call;     // Continue
    // return undefined;  // Block
});

// Post-API flow — runs after API, cannot block API execution
server.flows.postApiCallFlow.push(async call => {
    return call;
});
```

Flows are universal — both server and client have their own flow sets with the same programming model. See `/tsrpc-flow` skill for complete details.

## API Registration

```typescript
// Auto-register all APIs from directory (recommended)
await server.autoImplementApi(path.resolve(__dirname, 'api'));

// Manual registration
server.implementApi('user/Login', async call => { /* ... */ });
```

## Common Commands

```bash
# Development (auto-watches protocols, auto-regenerates serviceProto)
cd backend && npm run dev

# Generate serviceProto manually
cd backend && npm run proto
# Or: npx tsrpc-cli proto --input ./src/shared/protocols --output ./src/shared/protocols/serviceProto.ts

# Build for production
cd backend && npm run build

# Sync shared code to frontend
cd backend && npm run sync
```

## Best Practices

1. **Keep protocols pure**: Only type definitions and `conf`, no logic
2. **Use `return call.error()`**: Always return after `call.succ()` / `call.error()` unless it's the last line
3. **Use `call.logger`**: Never use `console.log` in API handlers
4. **Use `throw new TsrpcError()`**: For error propagation in shared business logic
5. **Design response for success only**: Error handling is unified via TsrpcError
6. **Leverage field stripping**: Trust that extra fields are automatically removed
7. **Use TypeScript utility types**: `Pick`, `Omit`, `Partial` to reduce protocol redundancy
