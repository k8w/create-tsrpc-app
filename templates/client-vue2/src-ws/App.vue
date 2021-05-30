<template>
  <div class="App">
    <h1>Hello, TSRPC</h1>

    <div class="conn-status">
      {{ isConnected ? "🟢 Server Connected" : "🟡 Server Connecting..." }}
    </div>

    <div class="say-hello">
      <div class="say">
        <input
          type="text"
          class="name"
          v-model="name"
          placeholder="Input your name..."
        />
        <button class="btn-send" v-on:click="onBtnSendClick">Say Hello</button>
      </div>

      <div class="reply" v-if="reply">
        <div class="title">Server Reply</div>
        <div class="content">{{ reply }}</div>
      </div>
    </div>

    <div class="server-pushed-msg">
      <div class="title">Server Pushed Messages</div>
      <p class="hint">You can open multiple pages to see the effects</p>
      <ul>
        <li v-for="v in serverMsgs" v-bind:key="v.name">
          Welcome <b class="name">{{ v.name }}</b>
          <p class="time">{{ v.time.toTimeString().substr(0, 8) }}</p>
        </li>
      </ul>
    </div>
  </div>
</template>

<script lang="ts">
import { WsClientStatus } from "tsrpc-browser";
import { client } from "./main";
import { MsgHello } from "./shared/protocols/MsgHello";

export interface AppData {
  name: string;
  isConnected: boolean;
  reply: string;
  serverMsgs: MsgHello[];
}

export default {
  name: "App",
  data() {
    return {
      name: "",
      isConnected: false,
      reply: "",
      serverMsgs: [],
    } as AppData;
  },

  methods: {
    async onBtnSendClick() {
      // ========== TSRPC Client -> callApi ==========
      let ret = await client.callApi("Hello", {
        name: this.name,
      });

      // Error
      if (!ret.isSucc) {
        this.reply = "";
        alert("= ERROR =\n" + ret.err.message);
        return;
      }

      // Success
      this.name = "";
      this.reply = ret.res.reply;
    },
  },

  mounted(this: AppData) {
    // ========== TSRPC Client -> listenMsg ==========
    client.listenMsg("Hello", (msg) => {
      this.serverMsgs.unshift(msg);
    });
    // Client Event: connection status change
    client.on("StatusChange", (e) => {
      this.isConnected = e.newStatus === WsClientStatus.Opened;
    });
  },
};
</script>

<style lang="less">
@import "./App.less";
</style>
