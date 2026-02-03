<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'
import { getClient } from './getClient'
import type { MsgChat } from './shared/protocols/MsgChat'

defineProps<{
  title: string
}>()

const input = ref('')
const list = ref<MsgChat[]>([])
const ul = ref<HTMLElement | null>(null)
const client = getClient()

async function send() {
  const ret = await client.callApi('Send', {
    content: input.value,
  })

  if (!ret.isSucc) {
    alert(ret.err.message)
    return
  }

  input.value = ''
}

onMounted(() => {
  // Connect at startup
  client.connect().then((v) => {
    if (!v.isSucc) {
      alert('= Client Connect Error =\n' + v.errMsg)
    }
  })

  // Listen Msg
  client.listenMsg('Chat', (v) => {
    list.value.push(v)

    // Scroll the list to the bottom
    nextTick(() => {
      ul.value?.scrollTo(0, ul.value.scrollHeight)
    })
  })

  // When disconnected
  client.flows.postDisconnectFlow.push((v) => {
    alert('Server disconnected')
    return v
  })
})
</script>

<template>
  <div class="chatroom">
    <header>{{ title }}</header>
    <ul class="list" ref="ul">
      <li v-for="(v, i) in list" :key="i">
        <div class="content">{{ v.content }}</div>
        <div class="time">{{ v.time.toLocaleTimeString() }}</div>
      </li>
    </ul>
    <div class="send">
      <input
        placeholder="Say something..."
        v-model="input"
        @keydown.enter="send"
      />
      <button @click="send">Send</button>
    </div>
  </div>
</template>

<style scoped>
.chatroom {
  display: flex;
  flex-direction: column;
  width: 460px;
  height: 480px;
  margin: 20px;
  background: #f7f7f7;
  border: 1px solid #454545;
  border-radius: 5px;
  overflow: hidden;
}

.chatroom > header {
  background: #454545;
  color: white;
  text-align: center;
  padding: 10px;
}

.chatroom > .send {
  flex: 0 0 40px;
  display: flex;
  border-top: 1px solid #454545;
}

.chatroom > .send > * {
  border: none;
  outline: none;
  height: 100%;
  font-size: 16px;
}

.chatroom > .send > input {
  flex: 1;
  background: #fff;
  padding: 0 10px;
}

.chatroom > .send > button {
  flex: 0 0 100px;
  background: #215fa4;
  color: white;
  cursor: pointer;
}

.chatroom > .send > button:hover {
  background: #4b80bb;
}

.chatroom > .list {
  flex: 1;
  overflow-y: auto;
  list-style: none;
  border-radius: 5px;
  padding: 10px;
  padding-bottom: 20px;
  background: #f2f2f2;
}

.chatroom > .list > li {
  margin-bottom: 10px;
  padding: 10px;
  background: #fff;
  line-height: 1.5em;
  border-radius: 5px;
}

.chatroom > .list > li:last-child {
  border-bottom: none;
  margin-bottom: 0;
}

.chatroom > .list > li > .content {
  font-size: 14px;
  text-align: left;
  white-space: pre-wrap;
  word-wrap: break-word;
}

.chatroom > .list > li > .time {
  font-size: 12px;
  color: #4b80bb;
  text-align: right;
}
</style>
