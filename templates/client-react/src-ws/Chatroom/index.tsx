import { useEffect, useRef, useState } from 'react'
import { getClient } from '../getClient'
import type { MsgChat } from '../shared/protocols/MsgChat'
import './index.css'

export function Chatroom(props: { title: string }) {
  const [input, setInput] = useState('')
  const [list, setList] = useState<MsgChat[]>([])
  const [client] = useState(getClient)

  // Send input message
  async function send() {
    const ret = await client.callApi('Send', {
      content: input,
    })

    if (!ret.isSucc) {
      alert(ret.err.message)
      return
    }

    setInput('')
  }

  // on mounted
  useEffect(() => {
    // Connect at startup
    client.connect().then((v) => {
      if (!v.isSucc) {
        alert('= Client Connect Error =\n' + v.errMsg)
      }
    })

    // Listen Msg
    client.listenMsg('Chat', (v) => {
      setList((oldList) => [...oldList, v])
    })

    // When disconnected
    client.flows.postDisconnectFlow.push((v) => {
      alert('Server disconnected')
      return v
    })
  }, [client])

  // Scroll to bottom when new message come
  const ul = useRef<HTMLUListElement>(null)
  useEffect(() => {
    ul.current?.scrollTo(0, ul.current.scrollHeight)
  }, [list.length])

  return (
    <div className="chatroom">
      <header>{props.title}</header>
      <ul className="list" ref={ul}>
        {list.map((v, i) => (
          <li key={i}>
            <div className="content">{v.content}</div>
            <div className="time">{v.time.toLocaleTimeString()}</div>
          </li>
        ))}
      </ul>
      <div className="send">
        <input
          placeholder="Say something..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send()}
        />
        <button onClick={send}>Send</button>
      </div>
    </div>
  )
}
