import { ApiCall } from "tsrpc";
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
}