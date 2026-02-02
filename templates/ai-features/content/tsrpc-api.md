# TSRPC API Creation Guide

This skill helps you create new API endpoints in a TSRPC project following best practices.

## Quick Start

To create a new API, you need to complete 3 steps:

1. **Define Protocol** - Create request/response types in `shared/protocols/`
2. **Implement API** - Create the API handler in `api/`
3. **Generate ServiceProto** - Run `npx tsrpc-cli proto --input ./src/shared/protocols --output ./src/shared/protocols/serviceProto.ts`

## Step 1: Define Protocol

Create a new file `shared/protocols/Pt{ApiName}.ts`:

```typescript
// shared/protocols/PtHello.ts

// Request type - what the client sends
export interface ReqHello {
    name: string;
}

// Response type - what the server returns
export interface ResHello {
    reply: string;
    time: Date;
}
```

### Protocol Naming Convention

- File name: `Pt{ApiName}.ts` (e.g., `PtHello.ts`, `PtUserLogin.ts`)
- Request interface: `Req{ApiName}`
- Response interface: `Res{ApiName}`

### Supported Types

TSRPC supports all TypeScript types including:
- Primitives: `string`, `number`, `boolean`, `null`, `undefined`
- Objects and Arrays
- Union Types: `string | number`
- Intersection Types: `A & B`
- Utility Types: `Pick<T>`, `Omit<T>`, `Partial<T>`
- Special types: `Date`, `ArrayBuffer`, `ObjectId` (MongoDB)

## Step 2: Implement API

Create a new file `api/Api{ApiName}.ts`:

```typescript
// api/ApiHello.ts
import { ApiCall } from "tsrpc";
import { ReqHello, ResHello } from "../shared/protocols/PtHello";

export async function ApiHello(call: ApiCall<ReqHello, ResHello>) {
    // Access request data via call.req
    const { name } = call.req;

    // Return success response
    call.succ({
        reply: "Hello, " + name,
        time: new Date()
    });
}
```

### API Implementation Patterns

**Success Response:**
```typescript
call.succ({ /* response data */ });
```

**Error Response:**
```typescript
call.error('Error message');
// or with error code
call.error('Error message', { code: 'INVALID_INPUT' });
```

**Access Connection Info (WebSocket):**
```typescript
// Get client connection
const conn = call.conn;
// Get current user from session
const currentUser = call.conn.currentUser;
```

## Step 3: Generate ServiceProto

After creating the protocol and API files, regenerate the service protocol:

```bash
npx tsrpc-cli proto --input ./src/shared/protocols --output ./src/shared/protocols/serviceProto.ts
```

Or if you have npm scripts configured:
```bash
npm run proto
```

## Client-Side Usage

```typescript
// Call the API from client
const result = await client.callApi('Hello', {
    name: 'World'
});

if (result.isSucc) {
    console.log(result.res.reply);  // "Hello, World!"
    console.log(result.res.time);   // Date object
} else {
    console.error(result.err.message);
}
```

## Best Practices

1. **Type Safety**: Always define explicit types for request and response
2. **Validation**: TSRPC automatically validates incoming requests against the protocol types
3. **Error Handling**: Use `call.error()` for business logic errors
4. **Async Operations**: API handlers are async functions, use `await` for database operations
5. **Logging**: Use `call.logger` for request-scoped logging

## Common Patterns

### API with Database
```typescript
export async function ApiGetUser(call: ApiCall<ReqGetUser, ResGetUser>) {
    const user = await db.collection('users').findOne({
        _id: new ObjectId(call.req.userId)
    });

    if (!user) {
        return call.error('User not found');
    }

    call.succ({ user });
}
```

### API with Authentication Check
```typescript
export async function ApiUpdateProfile(call: ApiCall<ReqUpdateProfile, ResUpdateProfile>) {
    // Check if user is logged in (requires auth flow)
    if (!call.conn.currentUser) {
        return call.error('Please login first', { code: 'NEED_LOGIN' });
    }

    // Proceed with update...
    call.succ({ success: true });
}
```

## See Also

- Run `/tsrpc-flow` to add middleware (authentication, logging, etc.)
