import { WsClient } from 'tsrpc-browser';
import { serviceProto } from './shared/protocols/serviceProto';

const $ = document.querySelector.bind(document) as (k: string) => HTMLElement;

// Create WebSocket Client
const client = new WsClient(serviceProto, {
    server: 'ws://127.0.0.1:3000'
});

async function connect() {
    $('.conn-status')!.innerHTML = '🟡 Server Connecting...';

    // Connect to the server
    let res = await client.connect();

    // Error: retry after 1 second
    if (!res.isSucc) {
        await new Promise(rs => { setTimeout(rs, 1000) });
        await connect();
        return;
    }

    // Success
    $('.conn-status')!.innerHTML = '🟢 Server Connected';
}

// Connect to the server at startup
connect();

// Auto reconnect when disconnected
client.flows.postDisconnectFlow.push(v => {
    connect();
    return v;
});

// on button "Say Hello click"
$('button.btn-send').onclick = async function () {
    let input = $('input.name') as HTMLInputElement;
    if (!input.value) {
        return;
    }

    // ========== TSRPC Client -> callApi ==========
    let ret = await client.callApi('Hello', {
        name: input.value
    });

    // Error
    if (!ret.isSucc) {
        $('.reply').style.display = 'none';
        alert('= ERROR =\n' + ret.err.message);
        return;
    }

    // Success
    input.value = '';
    $('.reply .content').innerText = ret.res.reply;
    $('.reply').style.display = 'block';
};

// ========== TSRPC Client -> listenMsg ==========
client.listenMsg('Hello', msg => {
    let ul = $('.server-pushed-msg ul') as HTMLUListElement;

    let li = document.createElement('li');
    li.innerHTML = `Welcome <b class="name"></b><p class="time"></p>`;
    (li.querySelector('.name') as HTMLElement).innerText = msg.name;
    (li.querySelector('.time') as HTMLElement).innerText = msg.time.toTimeString().substr(0, 8);

    ul.prepend(li);
});