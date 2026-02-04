# Complete API Example: User Registration

This example demonstrates creating a complete user registration API with proper error handling patterns.

## 1. Protocol Definition

```typescript
// shared/protocols/user/PtlRegister.ts
import { ObjectId } from 'mongodb';

export interface ReqRegister {
    username: string;
    password: string;
    email: string;
    nickname?: string;  // Optional field
}

export interface ResRegister {
    user: {
        _id: ObjectId;
        username: string;
        email: string;
        nickname: string;
        createdAt: Date;
    };
    token: string;
}

// Protocol config: this API is public (no login required)
// No conf export = no special requirements
```

## 2. API Implementation

```typescript
// api/user/ApiRegister.ts
import { ApiCall } from "tsrpc";
import { ReqRegister, ResRegister } from "../../shared/protocols/user/PtlRegister";
import { Global } from "../../models/Global";
import { ObjectId } from "mongodb";
import * as crypto from "crypto";

export async function ApiRegister(call: ApiCall<ReqRegister, ResRegister>) {
    const { username, password, email, nickname } = call.req;

    // Use call.logger for request-scoped logging (auto-prefixed with [user/Register #SN])
    call.logger.log('Registration attempt for:', username);

    // === Business validation (type validation is automatic) ===

    if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
        // IMPORTANT: use "return call.error()" — without return, code below continues!
        return call.error('Username must be 3-20 characters, alphanumeric and underscore only');
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return call.error('Invalid email format');
    }

    if (password.length < 6) {
        return call.error('Password must be at least 6 characters');
    }

    // Check uniqueness
    const existing = await Global.collection('User').findOne({
        $or: [{ username }, { email }]
    });

    if (existing) {
        if (existing.username === username) {
            return call.error('Username already taken', { code: 'DUPLICATE_USERNAME' });
        }
        return call.error('Email already registered', { code: 'DUPLICATE_EMAIL' });
    }

    // Hash password
    const salt = crypto.randomBytes(16).toString('hex');
    const hashedPassword = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');

    // Create user
    const now = new Date();
    const userId = new ObjectId();

    await Global.collection('User').insertOne({
        _id: userId,
        username,
        email,
        nickname: nickname || username,
        password: hashedPassword,
        salt,
        roles: ['user'],
        createdAt: now,
        updatedAt: now
    });

    call.logger.log('User created successfully:', userId);

    // Generate token
    const token = generateToken(userId.toString());

    // Return success — this is the last statement, return is optional but recommended
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
    const payload = {
        userId,
        exp: Date.now() + 7 * 24 * 60 * 60 * 1000
    };
    return Buffer.from(JSON.stringify(payload)).toString('base64');
}
```

## 3. Using throw TsrpcError for Shared Logic

When business logic is shared across multiple APIs, use `throw new TsrpcError()` instead of passing `call`:

```typescript
// models/UserUtil.ts
import { TsrpcError } from 'tsrpc';
import { Logger } from 'tsrpc-proto';
import { Global } from './Global';

export class UserUtil {
    // Pass logger for request-scoped logging in shared code
    static async ensureUsernameAvailable(username: string, logger?: Logger) {
        logger?.log('Checking username availability:', username);
        const existing = await Global.collection('User').findOne({ username });
        if (existing) {
            // TsrpcError thrown here will be auto-caught by TSRPC and returned to client
            throw new TsrpcError('Username already taken', { code: 'DUPLICATE_USERNAME' });
        }
    }

    static validatePassword(password: string) {
        if (password.length < 6) {
            throw new TsrpcError('Password must be at least 6 characters', {
                code: 'WEAK_PASSWORD'
            });
        }
        if (!/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
            throw new TsrpcError('Password must contain uppercase letter and number', {
                code: 'WEAK_PASSWORD'
            });
        }
    }
}

// Usage in API — thrown TsrpcError is auto-caught, no try/catch needed
export async function ApiRegister(call: ApiCall<ReqRegister, ResRegister>) {
    UserUtil.validatePassword(call.req.password);    // Throws if weak
    await UserUtil.ensureUsernameAvailable(           // Throws if taken
        call.req.username,
        call.logger  // Pass logger for scoped logging
    );

    // If we reach here, all validations passed
    // ... proceed with registration
}
```

## 4. Client Usage

```typescript
async function register(username: string, password: string, email: string) {
    // callApi never throws — all errors returned via ret.err
    const ret = await client.callApi('user/Register', {
        username,
        password,
        email
    });

    if (ret.isSucc) {
        // TypeScript knows ret.res exists
        localStorage.setItem('token', ret.res.token);
        console.log('Welcome,', ret.res.user.nickname);
        return ret.res.user;
    } else {
        // TypeScript knows ret.err exists
        // Handle specific error codes
        if (ret.err.code === 'DUPLICATE_USERNAME') {
            showError('This username is taken, please choose another');
        } else if (ret.err.code === 'NEED_LOGIN') {
            redirectToLogin();
        } else {
            showError(ret.err.message);
        }
        return null;
    }
}
```

## Key Points

1. **`return call.error()`**: Always use return to prevent subsequent code execution
2. **`call.logger`**: Use instead of console for request-scoped, prefixed logging
3. **`throw new TsrpcError()`**: For shared business logic — auto-caught by framework
4. **Pass `logger` to shared code**: Enables request-scoped logging in utility functions
5. **callApi never throws**: Check `ret.isSucc`, no try/catch needed on client
6. **Response = success only**: Don't wrap errors in response type, use `call.error()`
