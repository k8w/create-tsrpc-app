import { WsClient, WsClientStatus } from 'tsrpc-browser'
import Vue from 'vue'
import App from './App.vue'
import { serviceProto } from './shared/protocols/serviceProto'

Vue.config.productionTip = false

// Create WebSocket Client
export const client = new WsClient(serviceProto, {
  server: 'ws://127.0.0.1:3000'
});

// Connect to the server at startup
client.connect();

// Auto reconnect after 1 second
client.on('StatusChange', e => {
  if (e.newStatus === WsClientStatus.Closed) {
    setTimeout(() => { client.connect() }, 1000)
  }
})

new Vue({
  render: h => h(App),
}).$mount('#app')
