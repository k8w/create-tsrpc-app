# TSRPC Message Service Guide

This skill helps you implement real-time messaging with TSRPC using the publish/subscribe (Pub/Sub) pattern.

## What is Message Service?

Message Service is TSRPC's real-time communication model based on **publish/subscribe**. Unlike API Service (request/response), messages are fire-and-forget — no response is expected.

- Messages can be sent **bidirectionally** between server and client
- Best suited for **WebSocket** long connections (real-time games, chat, notifications)
- On HTTP short connections, only client-to-server messages are possible
- Messages share the same runtime type validation and binary serialization as API Service
- Message delivery order follows the transport protocol (TCP-based HTTP/WebSocket = ordered delivery)

## Define Message Protocol

Create `Msg{Name}.ts` in the protocols directory:

```typescript
// shared/protocols/MsgChat.ts
export interface MsgChat {
    content: string;
    fromUserId: string;
    nickname: string;
    time: Date;
}
```

**Naming rules:**
- File: `Msg{Name}.ts`
- Type: `Msg{Name}` (must be exported)
- Optional config: `export const conf = { ... }`

Subdirectories work the same as API protocols:
- `protocols/room/MsgChat.ts` → Message name: `room/Chat`

After defining, regenerate ServiceProto: `cd backend && npm run proto`

## Client: Send Messages

```typescript
client.sendMsg('Chat', {
    content: 'Hello everyone!',
    fromUserId: 'user123',
    nickname: 'Alice',
    time: new Date()
});
```

## Client: Listen for Messages

```typescript
// Start listening
const handler = client.listenMsg('Chat', msg => {
    console.log(`${msg.nickname}: ${msg.content}`);
});

// Stop listening
client.unlistenMsg('Chat', handler);
```

## Server: Listen for Messages

Server receives a `MsgCall` object containing:
- `call.msg` — the message data (`MsgChat`)
- `call.conn` — the sender's connection
- `call.service` — service metadata and conf

### Listen for single message type

```typescript
const handler = server.listenMsg('Chat', call => {
    console.log(`${call.conn.currentUser?.nickname}: ${call.msg.content}`);
    // call.conn is the sender's connection
});

// Stop listening
server.unlistenMsg('Chat', handler);
```

### Listen for multiple message types (regex)

```typescript
// Listen to all messages under game/ prefix
server.listenMsg(/^game\//, (call, msgName) => {
    console.log(`Received ${msgName}:`, call.msg);
});
```

## Server: Send Messages

### Send to a specific connection

```typescript
// Find the connection first (from ApiCall, MsgCall, or server.conns)
conn.sendMsg('Chat', {
    content: 'Welcome!',
    fromUserId: 'system',
    nickname: 'System',
    time: new Date()
});
```

### Broadcast to all connections

```typescript
// Broadcast to ALL active connections (no 3rd argument)
server.broadcastMsg('Chat', {
    content: 'Server announcement',
    fromUserId: 'system',
    nickname: 'System',
    time: new Date()
});
```

### Broadcast to filtered connections

```typescript
// Broadcast to specific connections only
server.broadcastMsg('Chat', msg, [conn1, conn2, conn3]);

// Filter by custom criteria
server.broadcastMsg('Chat', msg,
    server.conns.filter(c => c.roomId === targetRoomId)
);
```

`broadcastMsg` serializes the message only **once** regardless of recipient count, reducing CPU overhead compared to sending individually.

## Common Patterns

### 1. Chat Room / Broadcast

Simple chat: receive message from one client, broadcast to all:

```typescript
server.listenMsg('Chat', call => {
    // Broadcast to everyone (including sender)
    server.broadcastMsg('Chat', {
        ...call.msg,
        fromUserId: call.conn.currentUser!.userId,
        nickname: call.conn.currentUser!.nickname,
        time: new Date()
    });
});
```

### 2. Room-based Messaging

Maintain rooms with connection lists, broadcast only within a room:

```typescript
// Room class
export class Room {
    static rooms: Map<string, Room> = new Map();

    roomId: string;
    conns: BaseConnection[] = [];

    constructor(roomId: string) {
        this.roomId = roomId;
        Room.rooms.set(roomId, this);
    }

    join(conn: BaseConnection) {
        this.conns.push(conn);
        conn.roomId = this.roomId;
    }

    leave(conn: BaseConnection) {
        this.conns = this.conns.filter(c => c !== conn);
    }

    broadcast(msgName: string, msg: any) {
        server.broadcastMsg(msgName, msg, this.conns);
    }
}

// Extend connection type
declare module 'tsrpc' {
    export interface BaseConnection {
        roomId?: string;
    }
}

// Handle room messages
server.listenMsg('Chat', call => {
    const roomId = call.conn.roomId;
    if (roomId) {
        const room = Room.rooms.get(roomId);
        room?.broadcast('Chat', call.msg);
    }
});

// Clean up on disconnect
server.flows.postDisconnectFlow.push(conn => {
    if (conn.roomId) {
        const room = Room.rooms.get(conn.roomId);
        room?.leave(conn);
    }
    return conn;
});
```

### 3. Private Messaging (DM)

Maintain a userId-to-connection map for direct messaging:

```typescript
// Connection map
const userConnMap = new Map<string, BaseConnection>();

// Register on login
server.flows.preApiCallFlow.push(call => {
    if (call.conn.currentUser) {
        userConnMap.set(call.conn.currentUser.userId, call.conn);
    }
    return call;
});

// Clean up on disconnect
server.flows.postDisconnectFlow.push(conn => {
    if (conn.currentUser) {
        userConnMap.delete(conn.currentUser.userId);
    }
    return conn;
});

// Send private message
function sendPrivateMsg(targetUserId: string, msg: MsgChat) {
    const conn = userConnMap.get(targetUserId);
    if (conn) {
        conn.sendMsg('Chat', msg);
    }
}
```

### 4. Server Push Notifications

Server proactively pushes messages to clients (no client request needed):

```typescript
// System announcement
function announceServerMaintenance(time: Date) {
    server.broadcastMsg('SystemNotice', {
        type: 'maintenance',
        message: `Server maintenance at ${time.toISOString()}`,
        time: new Date()
    });
}

// Targeted notification
function notifyUser(userId: string, notification: MsgNotification) {
    const conn = userConnMap.get(userId);
    if (conn) {
        conn.sendMsg('Notification', notification);
    }
}
```

## Message vs API: When to Use Which

| Scenario | Use API | Use Message |
|----------|---------|------------|
| Request data from server | Yes | No |
| Submit form / CRUD | Yes | No |
| Need guaranteed response | Yes | No |
| Real-time chat | No | Yes |
| Server push notifications | No | Yes |
| Game state sync | No | Yes |
| Live data feeds | No | Yes |

## See Also

- Run `/tsrpc-api` to create request/response API endpoints
- Run `/tsrpc-flow` to add middleware (auth, logging)
