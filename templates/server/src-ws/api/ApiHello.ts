import { ApiCall } from "tsrpc";
import { sendSystemNotice } from '../index';
import { ReqHello, ResHello } from "../shared/protocols/PtlHello";

export async function ApiHello(call: ApiCall<ReqHello, ResHello>) {
    if (call.req.name.indexOf(' ') > -1) {
        call.error('Space is not allowed in the name');
        return;
    }

    call.succ({
        reply: 'Hello, ' + call.req.name
    });

    sendSystemNotice(`[${call.req.name}] said hello to you.`);
}