# TSRPC Flow (Middleware) Guide

This skill helps you add Flow middleware to your TSRPC project for cross-cutting concerns like authentication, logging, and encryption.

## What is Flow?

Flow is TSRPC's middleware system that allows you to intercept and process requests/responses at various stages:

```
Client Request
     |
  [Pre Flows]     <- Before API execution
     |
  API Handler
     |
  [Post Flows]    <- After API execution
     |
Client Response
```

## Quick Start

Add flows to your server initialization:

```typescript
// index.ts
import { HttpServer } from "tsrpc";
import { serviceProto } from "./shared/protocols/serviceProto";

const server = new HttpServer(serviceProto, {
    // ... other options
});

// Add pre-flow (runs before API)
server.flows.preApiCallFlow.push(async call => {
    console.log(`[${new Date().toISOString()}] ${call.service.name} called`);
    return call;  // Must return call to continue
});

// Add post-flow (runs after API)
server.flows.postApiCallFlow.push(async call => {
    console.log(`[${new Date().toISOString()}] ${call.service.name} completed`);
    return call;
});
```

## Common Flow Types

### 1. Authentication Flow

Verify user tokens and attach user info to the connection:

```typescript
// flows/authFlow.ts
import { ApiCall } from "tsrpc";

// APIs that don't require authentication
const PUBLIC_APIS = ['Login', 'Register', 'GetPublicData'];

export async function authFlow(call: ApiCall<any, any>) {
    // Skip auth for public APIs
    if (PUBLIC_APIS.includes(call.service.name)) {
        return call;
    }

    // Get token from request header or body
    const token = call.req.__token || call.conn.httpReq?.headers['authorization'];

    if (!token) {
        call.error('Please login first', { code: 'NEED_LOGIN' });
        return undefined;  // Stop the flow
    }

    // Verify token and get user
    const user = await verifyToken(token);
    if (!user) {
        call.error('Invalid or expired token', { code: 'INVALID_TOKEN' });
        return undefined;
    }

    // Attach user to connection for later use
    call.conn.currentUser = user;

    return call;  // Continue to API
}

async function verifyToken(token: string) {
    // Implement your token verification logic
    try {
        const payload = JSON.parse(Buffer.from(token, 'base64').toString());
        if (payload.exp < Date.now()) {
            return null;  // Token expired
        }
        // Fetch user from database
        return await db.collection('users').findOne({ _id: payload.userId });
    } catch {
        return null;
    }
}
```

**Usage:**
```typescript
server.flows.preApiCallFlow.push(authFlow);
```

### 2. Logging Flow

Log all API calls with timing information:

```typescript
// flows/loggingFlow.ts
import { ApiCall } from "tsrpc";

export async function preLoggingFlow(call: ApiCall<any, any>) {
    // Store start time
    call.conn.__startTime = Date.now();
    call.logger.log(`-> ${call.service.name}`, JSON.stringify(call.req));
    return call;
}

export async function postLoggingFlow(call: ApiCall<any, any>) {
    const duration = Date.now() - (call.conn.__startTime || 0);
    const status = call.return?.isSucc ? 'SUCCESS' : 'ERROR';
    call.logger.log(`<- ${call.service.name} [${status}] ${duration}ms`);
    return call;
}
```

**Usage:**
```typescript
server.flows.preApiCallFlow.push(preLoggingFlow);
server.flows.postApiCallFlow.push(postLoggingFlow);
```

### 3. Rate Limiting Flow

Prevent abuse by limiting request frequency:

```typescript
// flows/rateLimitFlow.ts
import { ApiCall } from "tsrpc";

const requestCounts = new Map<string, { count: number; resetTime: number }>();
const LIMIT = 100;  // requests
const WINDOW = 60000;  // 1 minute

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
        call.error('Too many requests, please try again later', { code: 'RATE_LIMITED' });
        return undefined;
    }

    return call;
}
```

### 4. Input Sanitization Flow

Clean and validate input data:

```typescript
// flows/sanitizeFlow.ts
import { ApiCall } from "tsrpc";

export async function sanitizeFlow(call: ApiCall<any, any>) {
    // Recursively trim all string values
    sanitizeObject(call.req);
    return call;
}

function sanitizeObject(obj: any) {
    if (!obj || typeof obj !== 'object') return;

    for (const key in obj) {
        if (typeof obj[key] === 'string') {
            obj[key] = obj[key].trim();
        } else if (typeof obj[key] === 'object') {
            sanitizeObject(obj[key]);
        }
    }
}
```

### 5. Error Transformation Flow

Standardize error responses:

```typescript
// flows/errorTransformFlow.ts
import { ApiCall } from "tsrpc";

export async function errorTransformFlow(call: ApiCall<any, any>) {
    if (call.return && !call.return.isSucc) {
        // Log detailed error internally
        call.logger.error('API Error:', call.return.err);

        // Sanitize error message for production
        if (process.env.NODE_ENV === 'production') {
            // Don't expose internal error details
            if (!call.return.err.code) {
                call.return.err.message = 'An unexpected error occurred';
            }
        }
    }
    return call;
}
```

## WebSocket-Specific Flows

For WebSocket servers, you have additional flows:

```typescript
// Connection established
server.flows.postConnectFlow.push(async conn => {
    console.log('Client connected:', conn.id);
    return conn;
});

// Connection closed
server.flows.postDisconnectFlow.push(async (conn, reason) => {
    console.log('Client disconnected:', conn.id, reason);
    return conn;
});

// Message received (before parsing)
server.flows.preRecvMsgFlow.push(async (conn, msg) => {
    // Decrypt or decompress message here
    return msg;
});

// Message sent (before sending)
server.flows.preSendMsgFlow.push(async (conn, msg) => {
    // Encrypt or compress message here
    return msg;
});
```

## Flow Execution Order

Flows are executed in the order they are added:

```typescript
// These execute in order: A -> B -> C
server.flows.preApiCallFlow.push(flowA);
server.flows.preApiCallFlow.push(flowB);
server.flows.preApiCallFlow.push(flowC);
```

## Stopping the Flow

Return `undefined` to stop processing and prevent the API from executing:

```typescript
async function checkMaintenanceFlow(call: ApiCall<any, any>) {
    if (isUnderMaintenance) {
        call.error('Server is under maintenance');
        return undefined;  // Stops here, API won't execute
    }
    return call;  // Continue to next flow/API
}
```

## Best Practices

1. **Order Matters**: Add authentication before business logic flows
2. **Early Return**: Check for errors early and return undefined to stop
3. **Don't Modify Response**: Use post flows only for logging/monitoring
4. **Performance**: Keep flows lightweight, avoid heavy operations
5. **Error Handling**: Always handle exceptions in flows

## Complete Example: Setting Up Multiple Flows

```typescript
// index.ts
import { HttpServer } from "tsrpc";
import { serviceProto } from "./shared/protocols/serviceProto";
import { authFlow } from "./flows/authFlow";
import { preLoggingFlow, postLoggingFlow } from "./flows/loggingFlow";
import { rateLimitFlow } from "./flows/rateLimitFlow";
import { sanitizeFlow } from "./flows/sanitizeFlow";

const server = new HttpServer(serviceProto, {
    port: 3000
});

// Pre-API flows (in order)
server.flows.preApiCallFlow.push(
    rateLimitFlow,      // 1. Check rate limit
    preLoggingFlow,     // 2. Log incoming request
    sanitizeFlow,       // 3. Clean input data
    authFlow            // 4. Verify authentication
);

// Post-API flows
server.flows.postApiCallFlow.push(
    postLoggingFlow     // Log response and timing
);

server.start();
```

## See Also

- Run `/tsrpc-api` to create new API endpoints
