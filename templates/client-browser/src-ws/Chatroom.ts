import { WsClient } from "tsrpc-browser";
import { MsgChat } from "../src-ws/shared/protocols/MsgChat";
import { serviceProto } from './shared/protocols/serviceProto';


export class Chatroom {

    elem: HTMLDivElement;

    input: HTMLInputElement;
    list: HTMLUListElement;

    client = new WsClient(serviceProto, {
        server: 'ws://127.0.0.1:3000'
    })

    constructor(elem: HTMLDivElement) {
        this.elem = elem;
        this.input = this.elem.querySelector('.send>input')!;
        this.list = this.elem.querySelector('ul.list')!;

        // Connect at startup
        this.client.connect().then(v => {
            if (!v.isSucc) {
                alert('= Client Connect Error =\n' + v.errMsg);
            }
        });

        // Listen Msg
        this.client.listenMsg('Chat', v => { this.onChatMsg(v) })

        // Bind Event
        this.elem.querySelector('button')!.onclick = () => { this.send() };
        this.input.onkeypress = e => {
            if (e.key === 'Enter') {
                this.send();
            }
        }
    }

    async send() {
        let ret = await this.client.callApi('Send', {
            content: this.input.value
        });

        // Error
        if (!ret.isSucc) {
            alert(ret.err.message);
            return;
        }

        // Success
        this.input.value = '';
        console.log('Send successfully, time=', ret.res.time)
    }

    onChatMsg(msg: MsgChat) {
        let li = document.createElement('li');
        li.innerHTML = `<div class="content"></div><div class="time"></div>`;
        (li.querySelector('.content') as HTMLDivElement).innerText = msg.content;
        (li.querySelector('.time') as HTMLDivElement).innerText = msg.time.toLocaleTimeString();

        this.list.appendChild(li);
        this.list.scrollTo(0, this.list.scrollHeight);
    }
}