import { WsClient } from 'tsrpc-browser';
import { createApp } from 'vue';
import App from './App.vue';
import { serviceProto } from './shared/protocols/serviceProto';

// Create WebSocket Client
export const client = new WsClient(serviceProto, {
    server: 'ws://127.0.0.1:3000'
});

// Connect to the server at startup
connect();

// Connect and auto retry
async function connect() {
    // Connect to the server
    const res = await client.connect();

    // Failed: retry after 1 second
    if (!res.isSucc) {
        await new Promise(rs => { setTimeout(rs, 1000) });
        await connect();
        return;
    }
}

// Auto reconnect when disconnected
client.flows.postDisconnectFlow.push(v => {
    connect();
    return v;
});

createApp(App).mount('#app')
