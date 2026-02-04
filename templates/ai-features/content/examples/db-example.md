# Complete CRUD Example: Article Management

This example demonstrates a full article management system with type-safe database operations, covering Create, Read, Update, and Delete.

## 1. Data Model

```typescript
// shared/types/DbArticle.ts
import { ObjectId } from 'mongodb';

// Database table structure for 'Article'
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

## 2. DbCollectionType Configuration

```typescript
// models/Global.ts
import { Collection, Db, MongoClient, OptionalId } from "mongodb";
import { DbArticle } from "../shared/types/DbArticle";
import { DbUser } from "../shared/types/DbUser";

export interface DbCollectionType {
    Article: DbArticle;
    User: DbUser;
}

export class Global {
    static db: Db;

    static async initDb() {
        const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/mydb';
        const client = await new MongoClient(uri).connect();
        this.db = client.db();
    }

    // Type-safe: Global.collection('Article') returns Collection<DbArticle>
    static collection<T extends keyof DbCollectionType>(col: T): Collection<OptionalId<DbCollectionType[T]>> {
        return this.db.collection(col);
    }
}
```

## 3. Protocol Definitions

### Create Article

```typescript
// shared/protocols/article/PtlAddArticle.ts
import { ObjectId } from 'mongodb';
import { DbArticle } from '../../types/DbArticle';

export interface ReqAddArticle {
    // Omit _id and server-maintained fields
    article: Omit<DbArticle, '_id' | 'create' | 'update'>;
}

export interface ResAddArticle {
    _id: ObjectId;
}

export const conf = {
    needLogin: true
}
```

### Get Article

```typescript
// shared/protocols/article/PtlGetArticle.ts
import { ObjectId } from 'mongodb';
import { DbArticle } from '../../types/DbArticle';

export interface ReqGetArticle {
    _id: ObjectId;
}

export interface ResGetArticle {
    article: DbArticle;
}

// No conf — public API, no login required
```

### Update Article

```typescript
// shared/protocols/article/PtlUpdateArticle.ts
import { ObjectId } from 'mongodb';
import { DbArticle } from '../../types/DbArticle';

export interface ReqUpdateArticle {
    // _id is required; only title and content are modifiable
    // category is excluded — immutable after creation
    // Even if client sends category, TSRPC field stripping removes it
    update: Pick<DbArticle, '_id'> & Partial<Pick<DbArticle, 'title' | 'content'>>;
}

export interface ResUpdateArticle {
    matchedCount: number;
    modifiedCount: number;
}

export const conf = {
    needLogin: true
}
```

### Delete Article

```typescript
// shared/protocols/article/PtlDelArticle.ts
import { ObjectId } from 'mongodb';

export interface ReqDelArticle {
    _id: ObjectId;
}

export interface ResDelArticle {
    deletedCount: number;
}

export const conf = {
    needLogin: true,
    needRoles: ['admin']    // Only admins can delete
}
```

## 4. API Implementations

### Create

```typescript
// api/article/ApiAddArticle.ts
import { ApiCall } from "tsrpc";
import { ReqAddArticle, ResAddArticle } from "../../shared/protocols/article/PtlAddArticle";
import { Global } from "../../models/Global";

export async function ApiAddArticle(call: ApiCall<ReqAddArticle, ResAddArticle>) {
    const now = new Date();
    const currentUser = call.conn.currentUser!;  // Guaranteed by authFlow (conf.needLogin)

    // Validate business rules
    if (!call.req.article.title.trim()) {
        return call.error('Title cannot be empty');
    }

    // Insert with server-maintained fields
    const result = await Global.collection('Article').insertOne({
        ...call.req.article,    // title, content, category only (field stripping)
        create: {
            time: now,
            uid: currentUser._id
        }
    });

    call.logger.log('Article created:', result.insertedId);
    call.succ({ _id: result.insertedId });
}
```

### Read

```typescript
// api/article/ApiGetArticle.ts
import { ApiCall } from "tsrpc";
import { ReqGetArticle, ResGetArticle } from "../../shared/protocols/article/PtlGetArticle";
import { Global } from "../../models/Global";
import { DbArticle } from "../../shared/types/DbArticle";

export async function ApiGetArticle(call: ApiCall<ReqGetArticle, ResGetArticle>) {
    const article = await Global.collection('Article').findOne({
        _id: call.req._id
    });

    if (!article) {
        // return call.error() — always return to stop execution
        return call.error('Article not found', { code: 'NOT_FOUND' });
    }

    call.logger.log('Article retrieved:', article._id);
    call.succ({ article: article as DbArticle });
}
```

### Update

```typescript
// api/article/ApiUpdateArticle.ts
import { ApiCall } from "tsrpc";
import { ReqUpdateArticle, ResUpdateArticle } from "../../shared/protocols/article/PtlUpdateArticle";
import { Global } from "../../models/Global";

export async function ApiUpdateArticle(call: ApiCall<ReqUpdateArticle, ResUpdateArticle>) {
    const { _id, ...updateFields } = call.req.update;
    const currentUser = call.conn.currentUser!;

    // Check if there's anything to update
    if (Object.keys(updateFields).length === 0) {
        return call.error('No fields to update');
    }

    const result = await Global.collection('Article').updateOne(
        { _id },
        {
            $set: {
                ...updateFields,
                update: {
                    time: new Date(),
                    uid: currentUser._id
                }
            }
        }
    );

    if (result.matchedCount === 0) {
        return call.error('Article not found', { code: 'NOT_FOUND' });
    }

    call.logger.log('Article updated:', _id, 'fields:', Object.keys(updateFields));
    call.succ({
        matchedCount: result.matchedCount,
        modifiedCount: result.modifiedCount
    });
}
```

### Delete

```typescript
// api/article/ApiDelArticle.ts
import { ApiCall } from "tsrpc";
import { ReqDelArticle, ResDelArticle } from "../../shared/protocols/article/PtlDelArticle";
import { Global } from "../../models/Global";

export async function ApiDelArticle(call: ApiCall<ReqDelArticle, ResDelArticle>) {
    call.logger.log('Deleting article:', call.req._id,
        'by admin:', call.conn.currentUser!.username);

    const result = await Global.collection('Article').deleteOne({
        _id: call.req._id
    });

    if (result.deletedCount === 0) {
        return call.error('Article not found', { code: 'NOT_FOUND' });
    }

    call.succ({ deletedCount: result.deletedCount });
}
```

## 5. Client Usage

```typescript
// Create
const addRet = await client.callApi('article/AddArticle', {
    article: {
        title: 'My First Post',
        content: 'Hello World',
        category: 'tech'
    }
});
if (addRet.isSucc) {
    console.log('Created:', addRet.res._id);
}

// Read
const getRet = await client.callApi('article/GetArticle', {
    _id: articleId   // ObjectId on backend, string on frontend (auto-converted)
});
if (getRet.isSucc) {
    console.log('Title:', getRet.res.article.title);
    console.log('Created:', getRet.res.article.create.time);  // Date object
}

// Update
const updateRet = await client.callApi('article/UpdateArticle', {
    update: {
        _id: articleId,
        title: 'Updated Title'
        // Even if you send category here, field stripping removes it
    }
});

// Delete (admin only)
const delRet = await client.callApi('article/DelArticle', {
    _id: articleId
});
```

## Key Patterns Demonstrated

1. **`Global.collection('Article')`** — Type-safe collection access, compiler catches typos
2. **`Omit<DbArticle, '_id' | 'create' | 'update'>`** — Client only sends allowed fields
3. **`Pick` + `Partial`** — Fine-grained control over updatable fields
4. **Field stripping** — Extra fields in request are automatically removed by TSRPC
5. **`return call.error()`** — Always return after error to prevent continued execution
6. **`call.logger.log()`** — Request-scoped logging with auto `[ApiName #SN]` prefix
7. **`export const conf`** — Protocol-level auth config (needLogin, needRoles)
8. **Server-maintained fields** — `create`, `update` timestamps set server-side only
