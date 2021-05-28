import { ApiCall } from "tsrpc";
import { sendPublicMsg } from '../index';
import { ReqHello, ResHello } from "../shared/protocols/PtlHello";

export async function ApiHello(call: ApiCall<ReqHello, ResHello>) {
    if (call.req.name.length === 0) {
        call.error('Please input a name');
        return;
    }

    sendPublicMsg(`<b>${call.req.name}</b> said hello to you.`);

    call.succ({
        reply: 'Hello, ' + call.req.name
    });
}