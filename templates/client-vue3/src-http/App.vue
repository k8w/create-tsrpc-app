<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { client } from './client'
import type { ResGetData } from './shared/protocols/PtlGetData'

const input = ref('')
const list = ref<ResGetData['data']>([])

async function loadList() {
  const ret = await client.callApi('GetData', {})

  if (!ret.isSucc) {
    alert(ret.err.message)
    return
  }

  list.value = ret.res.data
}

async function send() {
  const ret = await client.callApi('AddData', {
    content: input.value,
  })

  if (!ret.isSucc) {
    alert(ret.err.message)
    return
  }

  input.value = ''
  loadList()
}

onMounted(() => {
  loadList()
})
</script>

<template>
  <div class="app">
    <h1>TSRPC Guestbook</h1>

    <div class="send">
      <textarea placeholder="Say something..." v-model="input" />
      <button @click="send">Send</button>
    </div>

    <ul class="list">
      <li v-for="(v, i) in list" :key="i">
        <div class="content">{{ v.content }}</div>
        <div class="time">{{ v.time.toLocaleTimeString() }}</div>
      </li>
    </ul>
  </div>
</template>

<style>
@import './index.css';
</style>
