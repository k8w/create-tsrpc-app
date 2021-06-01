import assert from 'assert';
import { HttpClient, TsrpcError } from 'tsrpc';
import { serviceProto } from '../../src/shared/protocols/serviceProto';

// 1. EXECUTE `npm run dev` TO START A LOCAL DEV SERVER
// 2. EXECUTE `npm test` TO START UNIT TEST

describe('ApiHello', function () {
    let client = new HttpClient(serviceProto, {
        server: 'http://127.0.0.1:3000'
    });

    it('Success', async function () {
        let ret = await client.callApi('Hello', {
            name: 'World'
        });
        assert.deepStrictEqual(ret, {
            isSucc: true,
            res: {
                reply: 'Hello, World'
            }
        })
    });

    it('Error', async function () {
        let ret = await client.callApi('Hello', {
            name: ''
        });
        assert.strictEqual(ret.isSucc, false);
        assert.strictEqual(ret.err?.type, TsrpcError.Type.ApiError);
    })
})