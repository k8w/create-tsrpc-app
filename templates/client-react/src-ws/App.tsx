import { Chatroom } from './Chatroom'

export function App() {
  return (
    <div className="app">
      <h1>TSRPC Chatroom</h1>
      <div className="chatrooms">
        <Chatroom title="Client #1" />
        <Chatroom title="Client #2" />
      </div>
    </div>
  )
}
