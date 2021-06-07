<template>
  <div class="App">
    <h1>Hello, TSRPC</h1>

    <div>
      <Chatroom />
      <Chatroom />
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import Chatroom from "./components/Chatroom.vue";

@Component
export default class App extends Vue {}
</script>

<style lang="less">
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.App {
  > h1 {
    text-align: center;
    margin-top: 20px;
  }

  > div {
    display: flex;
    justify-content: center;
  }
}
</style>
