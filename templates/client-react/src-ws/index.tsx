import React from 'react';
import ReactDOM from 'react-dom';
import { WsClient, WsClientStatus } from 'tsrpc-browser';
import './index.less';
import { MsgHello } from './shared/protocols/MsgHello';
import { serviceProto } from './shared/protocols/serviceProto';

export interface AppState {
    name: string,
    isConnected: boolean,
    reply?: string,
    serverMsgs: MsgHello[]
}

export class App extends React.Component {

    state: AppState = {
        name: '',
        isConnected: false,
        serverMsgs: []
    }

    client = new WsClient(serviceProto, {
        server: 'ws://127.0.0.1:3000',
        onStatusChange: v => {
            this.setState({
                isConnected: v === WsClientStatus.Opened
            });
        },
        onLostConnection: () => {
            // Auto reconnect
            this.client.connect();
        }
    });

    componentDidMount() {
        this.client.connect();
        this.client.listenMsg('Hello', msg => {
            this.state.serverMsgs.unshift(msg);
            this.forceUpdate();
        })
    }

    render() {
        return <div className="App">
            <h1>Hello, TSRPC</h1>

            <div className="conn-status">
                {this.state.isConnected ? '🟢 Server Connected' : '🟡 Server Connecting...'}
            </div>

            <div className="say-hello">
                <div className="say">
                    <input type="text" className="name" placeholder="Input your name..."
                        value={this.state.name} onChange={e => { this.setState({ name: e.target.value }) }}
                    />
                    <button className="btn-send" onClick={() => { this.onBtnSend() }}>Say Hello</button>
                </div>

                <div className="reply" style={{ display: this.state.reply ? 'block' : 'none' }}>
                    <div className="title">Server Reply</div>
                    <div className="content">Hello, King</div>
                </div>
            </div>

            <div className="server-pushed-msg">
                <div className="title">Server Pushed Messages</div>
                <p className="hint">You can open multiple pages to see the effects</p>
                <ul>
                    {this.state.serverMsgs.map(v =>
                        <li key={v.name}>
                            Welcome <b className="name">{v.name}</b>
                            <p className="time">{v.time.toTimeString().substr(0, 8)}</p>
                        </li>
                    )}
                </ul>
            </div>
        </div>
    }

    async onBtnSend() {
        this.setState({ reply: undefined });

        let ret = await this.client.callApi('Hello', {
            name: this.state.name
        });

        // Handle Error
        if (!ret.isSucc) {
            alert('= ERROR =\n' + ret.err.message);
            return;
        }

        this.setState({
            name: '',
            reply: ret.res.reply
        })
    }

    componentWillUnmount() {
        this.client.disconnect();
    }
}

ReactDOM.render(<App />, document.getElementById('app'));