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
import { Component, Vue } from "vue-property-decorator";
import { MsgHello } from "./shared/protocols/MsgHello";
import { client } from "./main";
import { WsClientStatus } from "tsrpc-browser";

@Component
export default class App extends Vue {
  name = "";
  isConnected = false;
  reply = "";
  serverMsgs: MsgHello[] = [];

  mounted() {
    client.listenMsg("Hello", (msg) => {
      this.serverMsgs.unshift(msg);
    });
    client.on("StatusChange", (e) => {
      this.isConnected = e.newStatus === WsClientStatus.Opened;
    });
  }

  async onBtnSendClick() {
    // Call API
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
  }
}
</script>

<style lang="less">
* {
  margin: 0;
  padding: 0;
}

body {
  background: #f7f7f7;
}

.App {
  padding: 20px 0;
  display: flex;
  flex-direction: column;
  height: 100vh;
  box-sizing: border-box;
  align-items: center;
  text-align: center;
  line-height: 1.5em;
  font-size: 16px;

  > .conn-status {
    margin-top: 15px;
    font-size: 14px;
    color: #999;
  }

  > .say-hello,
  > .server-pushed-msg {
    max-width: 400px;
    width: 100%;
    margin-top: 20px;
    padding: 20px;
    box-sizing: border-box;
    border-radius: 5px;
    background: #f2f2f2;
    border: solid #ccc 1px;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  > .say-hello {
    flex: 0 0 auto;

    > .say {
      display: flex;
      border-radius: 99px;
      overflow: hidden;
      border: solid 1px #ccc;

      > .name {
        padding: 10px;
        flex: 1;
        border: none;
        padding: 10px 20px;
        outline: none;
        font-size: 1rem;
      }

      > .btn-send {
        background: darkgreen;
        color: #fff;
        border: none;
        flex: 0 0 auto;
        padding: 10px 20px;
        font-size: 1rem;
        outline: none;
        cursor: pointer;

        &:hover {
          background: green;
        }
      }
    }

    > .reply {
      margin-top: 20px;
      padding-top: 20px;
      border-top: 1px dashed #ccc;

      > .title {
        background: green;
        color: white;
        display: inline-block;
        margin-bottom: 10px;
        padding: 2px 15px;
        border-radius: 99px;
        font-size: 14px;
      }
    }
  }

  > .server-pushed-msg {
    flex: 1;

    > .title {
      font-size: 20px;
      font-weight: bold;
    }

    > .hint {
      font-size: 12px;
      color: #999;
    }

    > ul {
      list-style: none;
      overflow: auto;
      margin-top: 10px;

      > li {
        margin-bottom: 10px;
        background: #fff;
        border-radius: 4px;
        padding: 20px;

        > .name {
          color: green;
        }

        > .time {
          color: #ccc;
          font-size: 14px;
        }
      }
    }
  }
}
</style>
