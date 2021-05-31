import { ApiCall } from "tsrpc";
import { server } from "..";
import { ReqHello, ResHello } from "../shared/protocols/PtlHello";

export async function ApiHello(call: ApiCall<ReqHello, ResHello>) {
    // Return Error
    if (call.req.name.length === 0) {
        call.error('Name can NOT be empty')
        return;
    }

    // Return Success
    call.succ({
        reply: 'Hello, ' + call.req.name
    });

    // Server pushed message)
    server.broadcastMsg('Hello', {
        name: call.req.name,
        time: new Date()
    })
}