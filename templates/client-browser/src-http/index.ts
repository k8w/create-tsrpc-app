import { HttpClient } from 'tsrpc-browser';
import { serviceProto } from './shared/protocols/serviceProto';

const $ = document.querySelector.bind(document) as (k: string) => HTMLElement;

// Create Client
let client = new HttpClient(serviceProto, {
    server: 'http://127.0.0.1:3000'
});

// Call API
async function sayHello() {
    $('.reply').style.display = 'none';
    let input = $('input.name') as HTMLInputElement;

    // ========== TSRPC Client -> callApi ==========
    let ret = await client.callApi('Hello', {
        name: input.value
    });

    // Error
    if (!ret.isSucc) {
        alert('= ERROR =\n' + ret.err.message);
        return;
    }

    // Success
    input.value = '';
    $('.reply .content').innerText = ret.res.reply;
    $('.reply').style.display = 'block';
}

// Bind Events
$('button.btn-send').onclick = sayHello;
$('input').onkeypress = e => {
    if (e.key === 'Enter') {
        sayHello();
    }
}