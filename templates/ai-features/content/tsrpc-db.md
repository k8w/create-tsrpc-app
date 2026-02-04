# TSRPC Database Usage Guide

This skill helps you set up database connections, design type-safe data models, and create CRUD APIs in TSRPC projects.

## Database Choice

**Recommended: NoSQL (MongoDB)**
- JSON nested structures leverage TypeScript type features naturally
- Simplified data modeling compared to relational schemas
- Pure API calls — no SQL injection risk
- Official TypeScript-friendly Node.js driver

## MongoDB Setup

### Install

```bash
npm i mongodb
```

### Global Database Instance

Create a shared `Db` instance using the `Global` class pattern. MongoDB driver auto-manages connection pools — no manual close needed:

```typescript
// models/Global.ts
import { Db, MongoClient } from "mongodb";

export class Global {
    static db: Db;

    static async initDb() {
        const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/mydb';
        const client = await new MongoClient(uri).connect();
        this.db = client.db();
    }
}
```

### Initialize Before Server Start

Connect to the database before starting the server in `index.ts`:

```typescript
// index.ts
import path from "path";
import { HttpServer } from "tsrpc";
import { serviceProto } from "./shared/protocols/serviceProto";
import { Global } from "./models/Global";

async function init() {
    await Global.initDb();
    await server.autoImplementApi(path.resolve(__dirname, 'api'));
}

async function main() {
    const server = new HttpServer(serviceProto, { port: 3000 });
    await init();
    await server.start();
}
main();
```

## Type-Safe Collection Mapping

Avoid typos and mismatched types by creating a centralized collection type map:

### Define collection types

```typescript
// models/Global.ts
import { Collection, Db, MongoClient, OptionalId } from "mongodb";
import { DbPost } from "../shared/types/DbPost";
import { DbUser } from "../shared/types/DbUser";
import { DbComment } from "../shared/types/DbComment";

// Map collection names to their document types
export interface DbCollectionType {
    Post: DbPost;
    User: DbUser;
    Comment: DbComment;
}

export class Global {
    static db: Db;

    static async initDb() {
        const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/mydb';
        const client = await new MongoClient(uri).connect();
        this.db = client.db();
    }

    // Type-safe collection accessor
    static collection<T extends keyof DbCollectionType>(col: T): Collection<OptionalId<DbCollectionType[T]>> {
        return this.db.collection(col);
    }
}
```

### Benefits

```typescript
// Type-safe — compiler catches errors
Global.collection('Post')    // Returns Collection<DbPost>
Global.collection('User')    // Returns Collection<DbUser>
Global.collection('Postt')   // COMPILE ERROR: typo caught!

// Without this pattern — runtime errors only
Global.db.collection<DbPost>('Postt')  // No compile error, bug in production!
```

## ObjectId Cross-Platform Handling

### The Problem

`ObjectId` comes from the `mongodb` npm package, which is backend-only. But protocols are shared between frontend and backend.

### The Solution

TSRPC projects created via `create-tsrpc-app` include a frontend `env.d.ts` that declares `ObjectId` as `string`:

```typescript
// frontend/src/env.d.ts
declare module 'mongodb' {
    export type ObjectId = string;
    export type ObjectID = string;
}
declare module 'bson' {
    export type ObjectId = string;
    export type ObjectID = string;
}
```

**How it works:**
- Backend: `ObjectId` is the real MongoDB `ObjectId` class
- Frontend: `ObjectId` is resolved as `string`
- TSRPC automatically converts between them during transmission
- Protocols using `import { ObjectId } from 'mongodb'` work on both sides

## Date Type

Use `Date` directly in protocols — TSRPC auto-serializes/deserializes:

```typescript
export interface DbPost {
    _id: ObjectId;
    title: string;
    content: string;
    createdAt: Date;   // Use Date, not timestamp
    updatedAt?: Date;
}
```

**Prefer `Date` over timestamps:** Better readability in database tools and admin panels.

## CRUD Protocol Design Patterns

Use TypeScript utility types to minimize redundancy when defining CRUD protocols.

### Data Model (shared type)

```typescript
// shared/types/DbArticle.ts
import { ObjectId } from 'mongodb';

export interface DbArticle {
    _id: ObjectId;
    title: string;
    content: string;
    category: string;       // Immutable after creation

    // Server-maintained fields — never set by client
    create: {
        time: Date;
        uid: ObjectId;
    };
    update?: {
        time: Date;
        uid: ObjectId;
    };
}
```

### Create — Omit server-maintained fields

```typescript
// PtlAddArticle.ts
import { ObjectId } from 'mongodb';
import { DbArticle } from '../types/DbArticle';

export interface ReqAddArticle {
    // Remove _id and server-maintained fields
    article: Omit<DbArticle, '_id' | 'create' | 'update'>;
}

export interface ResAddArticle {
    _id: ObjectId;
}
```

### Read — Simple ID lookup

```typescript
// PtlGetArticle.ts
import { ObjectId } from 'mongodb';
import { DbArticle } from '../types/DbArticle';

export interface ReqGetArticle {
    _id: ObjectId;
}

export interface ResGetArticle {
    article: DbArticle;
}
```

### Update — Pick allowed fields only

```typescript
// PtlUpdateArticle.ts
import { ObjectId } from 'mongodb';
import { DbArticle } from '../types/DbArticle';

export interface ReqUpdateArticle {
    // _id required, only title and content are modifiable
    update: Pick<DbArticle, '_id'> & Partial<Pick<DbArticle, 'title' | 'content'>>;
}

export interface ResUpdateArticle {
    matchedCount: number;
    modifiedCount: number;
}
```

**Field stripping safety:** Even if the client sends extra fields (e.g., `category`), TSRPC automatically strips them before they reach your API handler.

### Delete — Simple ID

```typescript
// PtlDelArticle.ts
import { ObjectId } from 'mongodb';

export interface ReqDelArticle {
    _id: ObjectId;
}

export interface ResDelArticle {
    deletedCount: number;
}
```

## API Implementation Examples

### Create

```typescript
export async function ApiAddArticle(call: ApiCall<ReqAddArticle, ResAddArticle>) {
    const now = new Date();

    const result = await Global.collection('Article').insertOne({
        ...call.req.article,
        create: {
            time: now,
            uid: call.conn.currentUser!._id
        }
    });

    call.logger.log('Article created:', result.insertedId);
    call.succ({ _id: result.insertedId });
}
```

### Read

```typescript
export async function ApiGetArticle(call: ApiCall<ReqGetArticle, ResGetArticle>) {
    const article = await Global.collection('Article').findOne({
        _id: call.req._id
    });

    if (!article) {
        return call.error('Article not found', { code: 'NOT_FOUND' });
    }

    call.succ({ article: article as DbArticle });
}
```

### Update

```typescript
export async function ApiUpdateArticle(call: ApiCall<ReqUpdateArticle, ResUpdateArticle>) {
    const { _id, ...updateFields } = call.req.update;

    const result = await Global.collection('Article').updateOne(
        { _id },
        {
            $set: {
                ...updateFields,
                update: {
                    time: new Date(),
                    uid: call.conn.currentUser!._id
                }
            }
        }
    );

    if (result.matchedCount === 0) {
        return call.error('Article not found', { code: 'NOT_FOUND' });
    }

    call.succ({
        matchedCount: result.matchedCount,
        modifiedCount: result.modifiedCount
    });
}
```

### Delete

```typescript
export async function ApiDelArticle(call: ApiCall<ReqDelArticle, ResDelArticle>) {
    const result = await Global.collection('Article').deleteOne({
        _id: call.req._id
    });

    call.succ({ deletedCount: result.deletedCount });
}
```

## Best Practices

1. **Use `Global.collection()` wrapper** — Type-safe collection access with compile-time checks
2. **Use `Date` over timestamps** — Better database readability, TSRPC handles serialization
3. **Use `ObjectId` in protocols** — Framework handles cross-platform conversion
4. **Use utility types for CRUD** — `Omit`, `Pick`, `Partial` to minimize protocol redundancy
5. **Trust field stripping** — TSRPC removes extra fields automatically
6. **Server-maintain sensitive fields** — `_id`, `createdAt`, `updatedAt` should be set server-side only
7. **Keep database long connection** — No need to manually close, faster response times
8. **Use `call.logger`** — Request-scoped logging for all database operations

## See Also

- Run `/tsrpc-api` to create new API endpoints
- Run `/tsrpc-flow` to add authentication middleware
