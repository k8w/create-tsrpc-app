<script setup lang="ts">
import Chatroom from './Chatroom.vue'
</script>

<template>
  <div class="app">
    <h1>TSRPC Chatroom</h1>

    <div class="chatrooms">
      <Chatroom title="Client #1" />
      <Chatroom title="Client #2" />
    </div>
  </div>
</template>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.app > h1 {
  text-align: center;
  margin-top: 20px;
}

.app > .chatrooms {
  display: flex;
  justify-content: center;
}
</style>
