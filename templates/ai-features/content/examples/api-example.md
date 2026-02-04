# Complete API Example: User Registration

This example demonstrates creating a complete user registration API.

## 1. Protocol Definition

```typescript
// shared/protocols/PtlUserRegister.ts
import { ObjectId } from 'mongodb';

export interface ReqUserRegister {
    username: string;
    password: string;
    email: string;
    nickname?: string;  // Optional field
}

export interface ResUserRegister {
    user: {
        _id: ObjectId;
        username: string;
        email: string;
        nickname: string;
        createdAt: Date;
    };
    token: string;
}
```

## 2. API Implementation

```typescript
// api/ApiUserRegister.ts
import { ApiCall } from "tsrpc";
import { ReqUserRegister, ResUserRegister } from "../shared/protocols/PtlUserRegister";
import { Global } from "../models/Global";
import { ObjectId } from "mongodb";
import * as crypto from "crypto";

export async function ApiUserRegister(call: ApiCall<ReqUserRegister, ResUserRegister>) {
    const { username, password, email, nickname } = call.req;

    // Validate username format
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
        return call.error('Username must be 3-20 characters, alphanumeric and underscore only');
    }

    // Validate email format
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return call.error('Invalid email format');
    }

    // Validate password strength
    if (password.length < 6) {
        return call.error('Password must be at least 6 characters');
    }

    // Check if username already exists
    const existingUser = await Global.db.collection('users').findOne({
        $or: [{ username }, { email }]
    });

    if (existingUser) {
        if (existingUser.username === username) {
            return call.error('Username already taken');
        }
        return call.error('Email already registered');
    }

    // Hash password
    const salt = crypto.randomBytes(16).toString('hex');
    const hashedPassword = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');

    // Create user
    const now = new Date();
    const userId = new ObjectId();

    await Global.db.collection('users').insertOne({
        _id: userId,
        username,
        email,
        nickname: nickname || username,
        password: hashedPassword,
        salt,
        createdAt: now,
        updatedAt: now
    });

    // Generate JWT token
    const token = generateToken(userId.toString());

    // Return success
    call.succ({
        user: {
            _id: userId,
            username,
            email,
            nickname: nickname || username,
            createdAt: now
        },
        token
    });
}

function generateToken(userId: string): string {
    // Simplified token generation - use proper JWT in production
    const payload = {
        userId,
        exp: Date.now() + 7 * 24 * 60 * 60 * 1000  // 7 days
    };
    return Buffer.from(JSON.stringify(payload)).toString('base64');
}
```

## 3. Client Usage

```typescript
// In your frontend code
async function register(username: string, password: string, email: string) {
    const result = await client.callApi('UserRegister', {
        username,
        password,
        email
    });

    if (result.isSucc) {
        // Save token for future requests
        localStorage.setItem('token', result.res.token);
        console.log('Welcome,', result.res.user.nickname);
        return result.res.user;
    } else {
        // Show error to user
        alert(result.err.message);
        return null;
    }
}
```

## Key Points

1. **Input Validation**: Always validate user input even though TSRPC validates types
2. **Security**: Never store plain text passwords, always hash with salt
3. **Error Messages**: Provide clear, user-friendly error messages
4. **Response Design**: Only return necessary data, avoid exposing sensitive fields
