# TSRPC Framework Reference Guide

TSRPC is an RPC framework designed specifically for TypeScript, enabling type-safe full-stack development with runtime validation.

## Project Structure

```
project/
├── backend/
│   ├── src/
│   │   ├── api/                    # API implementations
│   │   │   └── ApiHello.ts
│   │   ├── shared/                 # Shared code (symlinked to frontend)
│   │   │   └── protocols/
│   │   │       ├── PtlHello.ts      # Protocol definitions
│   │   │       └── serviceProto.ts # ⚠️ Auto-generated, NEVER edit manually
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

### 2. API Implementation (Api*.ts)

```typescript
// ApiHello.ts
import { ApiCall } from "tsrpc";

export async function ApiHello(call: ApiCall<ReqHello, ResHello>) {
    call.succ({ greeting: "Hello, " + call.req.name });
}
```

### 3. ServiceProto

Auto-generated file containing all protocol metadata. Regenerate after protocol changes:

```bash
cd backend && npm run proto
# Or: npx tsrpc-cli proto --input ./src/shared/protocols --output ./src/shared/protocols/serviceProto.ts
```

⚠️ **NEVER edit `serviceProto.ts` manually** - always modify `Ptl*.ts` files and regenerate.

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

## Type System

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
| Date | `Date` (auto-serialized) |
| Binary | `ArrayBuffer`, `Uint8Array` |
| MongoDB | `ObjectId` (with tsbuffer-plugin-mongodb) |

## API Call Patterns

### Success Response

```typescript
call.succ({ data: result });
```

### Error Response

```typescript
call.error('Error message');
call.error('Error message', { code: 'ERROR_CODE' });
```

### Access Request Data

```typescript
const { name, page } = call.req;
```

### Access Connection

```typescript
// IP address
const ip = call.conn.ip;

// Custom data (set in flows)
const user = call.conn.currentUser;

// HTTP request object (HTTP server only)
const headers = call.conn.httpReq?.headers;
```

### Logging

```typescript
call.logger.log('Info message');
call.logger.warn('Warning');
call.logger.error('Error', errorObject);
```

## Client API Call

```typescript
const result = await client.callApi('ApiName', { param: 'value' });

if (result.isSucc) {
    // Success: result.res contains response
    console.log(result.res);
} else {
    // Error: result.err contains error info
    console.error(result.err.message);
    console.error(result.err.code);  // Optional error code
}
```

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

### Server: Send Message

```typescript
// To specific connection
conn.sendMsg('Chat', { content: 'Hello', ... });

// Broadcast to all
server.broadcastMsg('Chat', { content: 'Hello', ... });
```

### Server: Listen for Messages

```typescript
server.listenMsg('Chat', async (msg, conn) => {
    console.log('Received:', msg.content);
});
```

### Client: Send/Listen

```typescript
// Send
client.sendMsg('Chat', { content: 'Hello', ... });

// Listen
client.listenMsg('Chat', msg => {
    console.log('Received:', msg.content);
});
```

## Flow (Middleware)

```typescript
// Pre-API flow
server.flows.preApiCallFlow.push(async call => {
    // Return call to continue, undefined to stop
    return call;
});

// Post-API flow
server.flows.postApiCallFlow.push(async call => {
    return call;
});
```

## Common Commands

```bash
# Generate serviceProto
npx tsrpc-cli proto --input ./src/shared/protocols --output ./src/shared/protocols/serviceProto.ts

# Generate API documentation
npx tsrpc-cli doc --input ./src/shared/protocols --output ./docs/api.md

# Sync protocol to client (if not using symlink)
npx tsrpc-cli sync --from ./backend/src/shared --to ./frontend/src/shared
```

## Best Practices

1. **Keep protocols pure**: Only type definitions, no logic
2. **Use strict TypeScript**: Enable `strict` mode in tsconfig
3. **Validate beyond types**: Add business validation in APIs
4. **Use flows for cross-cutting**: Auth, logging, rate limiting
5. **Handle errors gracefully**: Always check `result.isSucc`
6. **Use consistent error codes**: Define error code constants

## Resources

- Documentation: <https://tsrpc.cn/>
- GitHub: <https://github.com/k8w/tsrpc>
- Examples: <https://github.com/k8w/tsrpc-examples>
