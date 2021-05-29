import { HttpClient } from 'tsrpc-browser';
import { serviceProto } from './shared/protocols/serviceProto';

const $ = document.querySelector.bind(document) as (k: string) => HTMLElement;

let client = new HttpClient(serviceProto, {
    server: 'http://127.0.0.1:3000'
});

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