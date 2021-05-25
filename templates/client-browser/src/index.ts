import { HttpClient } from 'tsrpc-browser';
import { serviceProto } from './shared/protocols/serviceProto';

let client = new HttpClient(serviceProto, {
    server: 'http://127.0.0.1:3000'
});

async function hello() {
    let ret = await client.callApi('Hello', {
        name: 'World'
    });

    console.log('AAA', ret.res?.reply);
    console.log('BBB', ret.res ?? 'NO_RES');

    let list = document.getElementById('list')!;
    if (ret.isSucc) {
        list.innerHTML += `<li class="succ">${ret.res.reply}</li>`;
    }
    else {
        list.innerHTML += `<li class="error">${ret.err.message}</li>`;
    }
}

setInterval(hello, 1000);