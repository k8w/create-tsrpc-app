import { useEffect, useState } from 'react'
import { client } from './client'
import type { ResGetData } from './shared/protocols/PtlGetData'

export function App() {
  const [input, setInput] = useState('')
  const [list, setList] = useState<ResGetData['data']>([])

  // Reload message list
  async function loadList() {
    const ret = await client.callApi('GetData', {})

    if (!ret.isSucc) {
      alert(ret.err.message)
      return
    }

    setList(ret.res.data)
  }

  // Send Message
  async function send() {
    const ret = await client.callApi('AddData', {
      content: input,
    })

    if (!ret.isSucc) {
      alert(ret.err.message)
      return
    }

    setInput('')
    loadList()
  }

  // Load list at first
  useEffect(() => {
    loadList()
  }, [])

  return (
    <div className="app">
      <h1>TSRPC Guestbook</h1>
      <div className="send">
        <textarea
          placeholder="Say something..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button onClick={send}>Send</button>
      </div>
      <ul className="list">
        {list.map((v, i) => (
          <li key={i}>
            <div className="content">{v.content}</div>
            <div className="time">{v.time.toLocaleTimeString()}</div>
          </li>
        ))}
      </ul>
    </div>
  )
}
