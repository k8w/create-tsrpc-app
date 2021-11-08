<template>
  <div class="App">
    <h1>TSRPC Guestbook</h1>

    <div class="send">
      <textarea placeholder="Say something..." v-model="input" />
      <button v-on:click="send">Send</button>
    </div>

    <ul class="list">
      <li v-for="(v, i) in list" v-bind:key="i">
        <div class="content">{{ v.content }}</div>
        <div class="time">{{ v.time.toLocaleTimeString() }}</div>
      </li>
    </ul>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import { client } from "./client";
import { ResGetData } from "./shared/protocols/PtlGetData";

export interface AppData {
  input: string;
  list: ResGetData["data"];
}

export default Vue.extend({
  name: "App",
  data() {
    return {
      input: "",
      list: [],
    } as AppData;
  },

  methods: {
    async loadList() {
      let ret = await client.callApi("GetData", {});

      // Error
      if (!ret.isSucc) {
        alert(ret.err.message);
        return;
      }

      // Success
      this.list = ret.res.data;
    },

    async send() {
      let ret = await client.callApi("AddData", {
        content: this.input,
      });

      // Error
      if (!ret.isSucc) {
        alert(ret.err.message);
        return;
      }

      // Success
      this.input = "";
      this.loadList();
    },
  },

  mounted() {
    this.loadList();
  },
});
// @Component
// export default class App extends Vue {
//   input = "";
//   list: ResGetData["data"] = [];

//   async loadList(): Promise<void> {
//     let ret = await client.callApi("GetData", {});

//     // Error
//     if (!ret.isSucc) {
//       alert(ret.err.message);
//       return;
//     }

//     // Success
//     this.list = ret.res.data;
//   }

//   async send(): Promise<void> {
//     let ret = await client.callApi("AddData", {
//       content: this.input,
//     });

//     // Error
//     if (!ret.isSucc) {
//       alert(ret.err.message);
//       return;
//     }

//     // Success
//     this.input = "";
//     this.loadList();
//   }

//   mounted(): void {
//     this.loadList();
//   }
// }
</script>

<style lang="less">
@import "./App.less";
</style>
