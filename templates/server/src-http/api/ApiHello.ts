import { ApiCall } from "tsrpc";
import { ReqHello, ResHello } from "../shared/protocols/PtlHello";

const existNames = new Set();

export async function ApiHello(call: ApiCall<ReqHello, ResHello>) {
    if (existNames.has(call.req.name)) {
        call.error('This name is existed already')
        return;
    }
    existNames.add(call.req.name);

    call.succ({
        reply: 'Hello, ' + call.req.name
    });
}