import 'k8w-extend-native';
import { WsClient } from 'tsrpc-browser';
import { serviceProto } from './shared/protocols/serviceProto';

// Create the WebSocket Client
const client = new WsClient(serviceProto, {
    server: 'ws://127.0.0.1:3000',
    onStatusChange: v => {
        output('say', `Connection status: <b>${v}</b>`);
    },
    onLostConnection: () => {
        output('say', 'Connection is lost, start reconnecting...');
        connect();
    }
});

// Connect to the server
async function connect() {
    output('say', `Connecting to the server...`);
    let resConnect = await client.connect();
    if (resConnect.isSucc) {
        output('say', `✅ Connected successfully`, 'green');
    }
    else {
        output('say', `❌ Connected failed: ${resConnect.errMsg}`, 'red');
    }
}
connect();

// Call API
document.getElementById('btn-say')!.onclick = async () => {
    const inputName = document.getElementById('input-name') as HTMLInputElement;
    output('say', `Say: "${inputName.value}"`);

    let ret = await client.callApi('Hello', {
        name: inputName.value
    });

    // Handle Error
    if (!ret.isSucc) {
        output('say', `❌ ${ret.err.message}`, 'red');
        return;
    }

    output('say', `✅ Reply: ${ret.res.reply}`, 'green');
};

// Listen server pushed message
client.listenMsg('Public', msg => {
    output('public', `<span style="color: gray;">${msg.time.format()}</span><br />${msg.content}`)
});

function output(to: 'say' | 'public', content: string, color?: string) {
    const container = document.getElementById(to === 'say' ? 'say-output' : 'public-msg') as HTMLDivElement;
    container.innerHTML += `<p${color ? ` style="color:${color}"` : ''}>` + content + '</p>';
    container.scrollTo(0, container.scrollHeight);
}