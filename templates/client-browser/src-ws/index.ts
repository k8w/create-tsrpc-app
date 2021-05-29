import { WsClient, WsClientStatus } from 'tsrpc-browser';
import { serviceProto } from './shared/protocols/serviceProto';

const $ = document.querySelector.bind(document) as (k: string) => HTMLElement;

// Create the WebSocket Client
const client = new WsClient(serviceProto, {
    server: 'ws://127.0.0.1:3000',
    onStatusChange: v => {
        $('.conn-status')!.innerHTML = v === WsClientStatus.Opened ? '🟢 Server Connected' : '🟡 Server Connecting...';
    },
    onLostConnection: () => {
        // Auto reconnect
        client.connect();
    }
});
client.connect();

// CallAPI: Hello
async function sayHello() {
    let input = $('input.name') as HTMLInputElement;
    if (!input.value) {
        return;
    }

    $('.reply').style.display = 'none';

    let ret = await client.callApi('Hello', {
        name: input.value
    });

    // Handle Error
    if (!ret.isSucc) {
        alert('= ERROR =\n' + ret.err.message);
        return;
    }

    input.value = '';
    $('.reply .content').innerText = ret.res.reply;
    $('.reply').style.display = 'block';
}
// on button "Say Hello click"
$('button.btn-send').onclick = sayHello;
// on enter key pressed when input
$('input').onkeypress = e => {
    if (e.key === 'Enter') {
        sayHello();
    }
}

// Listen server pushed message
client.listenMsg('Hello', msg => {
    let ul = $('.server-pushed-msg ul') as HTMLUListElement;

    let li = document.createElement('li');
    li.innerHTML = `Welcome <b class="name"></b><p class="time"></p>`;
    (li.querySelector('.name') as HTMLElement).innerText = msg.name;
    (li.querySelector('.time') as HTMLElement).innerText = msg.time.toTimeString().substr(0, 8);

    ul.prepend(li);
});