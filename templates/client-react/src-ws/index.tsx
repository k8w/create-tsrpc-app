import { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import { WsClient, WsClientStatus } from 'tsrpc-browser';
import './index.less';
import { MsgHello } from './shared/protocols/MsgHello';
import { serviceProto } from './shared/protocols/serviceProto';

// Create WebSocket Client
const client = new WsClient(serviceProto, {
    server: 'ws://127.0.0.1:3000'
});

// Connect to the server at startup
connect();

// Connect and auto retry
async function connect() {
    // Connect to the server
    let res = await client.connect();

    // Failed: retry after 1 second
    if (!res.isSucc) {
        await new Promise(rs => { setTimeout(rs, 1000) });
        await connect();
        return;
    }
}

// Auto reconnect when disconnected
client.flows.postDisconnectFlow.push(v => {
    connect();
    return v;
});

const App = () => {
    // States
    const [name, setName] = useState('');
    const [isConnected, setIsConnected] = useState(client.status === WsClientStatus.Opened);
    const [reply, setReply] = useState<string | undefined>();
    const [serverMsgs, setServerMsgs] = useState<MsgHello[]>([]);

    async function onBtnSendClick() {
        // Call API
        let ret = await client.callApi('Hello', {
            name: name
        });

        // Error
        if (!ret.isSucc) {
            setReply('');
            alert('= ERROR =\n' + ret.err.message);
            return;
        }

        // Success
        setName('');
        setReply(ret.res.reply);
    }

    // Handle connection status changed
    useEffect(() => {
        let connectFlow = client.flows.postConnectFlow.push(v => {
            setIsConnected(true);
            return v;
        });
        let disconnectFlow = client.flows.postDisconnectFlow.push(v => {
            setIsConnected(false);
            return v;
        });
        // Clear when unmounted
        return () => {
            client.flows.postConnectFlow.remove(connectFlow);
            client.flows.postDisconnectFlow.remove(disconnectFlow);
        }
    }, [0]);

    // Listen server pushed messages
    useEffect(() => {
        let handler = client.listenMsg('Hello', msg => {
            // Prepend to the head
            setServerMsgs(oldMsgs => [msg, ...oldMsgs]);
        });
        return () => { client.unlistenMsg('Hello', handler) }
    }, [0]);

    return <div className="App">
        <h1>Hello, TSRPC</h1>

        <div className="conn-status">
            {isConnected ? '🟢 Server Connected' : '🟡 Server Connecting...'}
        </div>

        <div className="say-hello">
            <div className="say">
                <input type="text" className="name" placeholder="Input your name..."
                    value={name} onChange={e => { setName(e.target.value) }}
                />
                <button className="btn-send" onClick={onBtnSendClick}>Say Hello</button>
            </div>

            <div className="reply" style={{ display: reply ? 'block' : 'none' }}>
                <div className="title">Server Reply</div>
                <div className="content">{reply}</div>
            </div>
        </div>

        <div className="server-pushed-msg">
            <div className="title">Server Pushed Messages</div>
            <p className="hint">You can open multiple pages to see the effects</p>
            <ul>
                {serverMsgs.map(v =>
                    <li key={v.name}>
                        Welcome <b className="name">{v.name}</b>
                        <p className="time">{v.time.toTimeString().substr(0, 8)}</p>
                    </li>
                )}
            </ul>
        </div>
    </div>
}

ReactDOM.render(<App />, document.getElementById('app'));