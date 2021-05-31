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
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { client } from "./main";

export interface AppData {
  name: string;
  reply: string;
}

export default defineComponent({
  name: "App",
  data() {
    return {
      name: "",
      reply: "",
    };
  },

  methods: {
    async onBtnSendClick() {
      this.reply = "";

      // ========== TSRPC Client -> callApi ==========
      let ret = await client.callApi("Hello", {
        name: this.name,
      });

      // Error
      if (!ret.isSucc) {
        alert("= ERROR =\n" + ret.err.message);
        return;
      }

      // Success
      this.reply = ret.res.reply;
      this.name = "";
    },
  },
});
</script>

<style lang="less">
@import "./App.less";
</style>
