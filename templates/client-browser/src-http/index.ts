import './index.css'
import { client } from './client'

// Reload message list
async function loadList() {
  const ret = await client.callApi('GetData', {})

  if (!ret.isSucc) {
    alert(ret.err.message)
    return
  }

  const list = document.querySelector('.list')!
  list.innerHTML = ''
  ret.res.data.forEach((v) => {
    const li = document.createElement('li')
    li.innerHTML = `<div class="content"></div><div class="time"></div>`
    ;(li.querySelector('.content') as HTMLDivElement).innerText = v.content
    ;(li.querySelector('.time') as HTMLDivElement).innerText =
      v.time.toLocaleTimeString()
    list.appendChild(li)
  })
}

// Send Message
async function send() {
  const textarea = document.querySelector(
    '.send>textarea'
  ) as HTMLTextAreaElement
  const ret = await client.callApi('AddData', {
    content: textarea.value,
  })

  if (!ret.isSucc) {
    alert(ret.err.message)
    return
  }

  textarea.value = ''
  loadList()
}

// Bind Events
;(document.querySelector('.send>button') as HTMLButtonElement).onclick = send

// Load list after page load
loadList()
