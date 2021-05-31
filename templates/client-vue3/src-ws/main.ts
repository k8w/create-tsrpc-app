import { WsClient } from 'tsrpc-browser';
import { createApp } from 'vue';
import App from './App.vue';
import { serviceProto } from './shared/protocols/serviceProto';

// Create WebSocket Client
export const client = new WsClient(serviceProto, {
    server: 'ws://127.0.0.1:3000'
});

// Connect to the server at startup
client.connect().then(v => {
    if (!v.isSucc) {
        alert('Connect failed: ' + v.errMsg);
    }
});

// When disconnected
client.flows.postDisconnectFlow.push(v => {
    alert('Server disconnected');
    return v;
})

createApp(App).mount('#app')
