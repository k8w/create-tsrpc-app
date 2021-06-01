import { WsClient } from 'tsrpc-browser';
import { serviceProto } from './shared/protocols/serviceProto';

const $ = document.querySelector.bind(document) as (k: string) => HTMLElement;

// Create WebSocket Client
const client = new WsClient(serviceProto, {
    server: 'ws://127.0.0.1:3000'
});

// Connect to the server at startup
client.connect().then(v => {
    if (!v.isSucc) {
        alert('[ERROR] ' + v.errMsg);
    }
});

// When disconnected
client.flows.postDisconnectFlow.push(v => {
    alert('Server disconnected');
    return v;
})

// Button Event
$('button.btn-send').onclick = async function () {
    let input = $('input.name') as HTMLInputElement;

    debugger;
    // ========== TSRPC Client -> callApi ==========
    let ret = await client.callApi('Hello', {
        name: input.value
    });

    // Error
    if (!ret.isSucc) {
        $('.reply').style.display = 'none';
        alert('[ERROR] ' + ret.err.message);
        return;
    }

    // Success
    $('.reply .content').innerText = ret.res.reply;
    $('.reply').style.display = 'block';
    input.value = '';
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