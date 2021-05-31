import { HttpClient } from 'tsrpc-browser'
import Vue from 'vue'
import App from './App.vue'
import { serviceProto } from './shared/protocols/serviceProto'

Vue.config.productionTip = false

// Create Client
export const client = new HttpClient(serviceProto, {
  server: 'http://127.0.0.1:3000'
});

new Vue({
  render: h => h(App),
}).$mount('#app')
