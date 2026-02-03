import assert from 'assert'
import { TsrpcError, WsClient } from 'tsrpc'
import { serviceProto } from '../../src/shared/protocols/serviceProto'
import { describe, it, beforeAll, afterAll } from 'vitest'

// 1. EXECUTE `npm run dev` TO START A LOCAL DEV SERVER
// 2. EXECUTE `npm test` TO START UNIT TEST

describe('ApiSend', () => {
  const client = new WsClient(serviceProto, {
    server: 'ws://127.0.0.1:3000',
    json: true,
    logger: console,
  })

  beforeAll(async () => {
    const res = await client.connect()
    assert.strictEqual(
      res.isSucc,
      true,
      'Failed to connect to server, have you executed `npm run dev` already?'
    )
  })

  it('Success', async () => {
    const ret = await client.callApi('Send', {
      content: 'Test',
    })
    assert.ok(ret.isSucc)
  })

  it('Check content is empty', async () => {
    const ret = await client.callApi('Send', {
      content: '',
    })
    assert.deepStrictEqual(ret, {
      isSucc: false,
      err: new TsrpcError('Content is empty'),
    })
  })

  afterAll(async () => {
    await client.disconnect()
  })
})
