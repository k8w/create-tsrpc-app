import { ApiCall } from "tsrpc";
import { ReqHello, ResHello } from "../shared/protocols/PtlHello";

export async function ApiHello(call: ApiCall<ReqHello, ResHello>) {
    if (Math.random() > 0.5) {
        call.succ({
            reply: 'Hello, ' + call.req.name
        })
    }
    else {
        call.error('Simulated Error');
    }
}