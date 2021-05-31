import { HttpClient } from 'tsrpc-browser';
import { createApp } from 'vue';
import App from './App.vue';
import { serviceProto } from './shared/protocols/serviceProto';

// Create Client
export const client = new HttpClient(serviceProto, {
    server: 'http://127.0.0.1:3000'
});

createApp(App).mount('#app')
