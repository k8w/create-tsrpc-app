<template>
  <div class="App">
    <h1>Hello, TSRPC</h1>

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
import { defineComponent } from "vue";
import { client } from "./main";
import { MsgHello } from "./shared/protocols/MsgHello";

export interface AppData {
  name: string;
  isConnected: boolean;
  reply: string;
  serverMsgs: MsgHello[];
}

export default defineComponent({
  name: "App",
  data() {
    return {
      name: "",
      reply: "",
      serverMsgs: [] as MsgHello[],
    };
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

  mounted() {
    // ========== TSRPC Client -> listenMsg ==========
    client.listenMsg("Hello", (msg) => {
      this.serverMsgs.unshift(msg);
    });
  },
});
</script>

<style lang="less">
@import "./App.less";
</style>
