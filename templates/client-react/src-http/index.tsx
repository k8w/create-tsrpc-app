import { useState } from 'react';
import ReactDOM from 'react-dom';
import { HttpClient } from 'tsrpc-browser';
import './index.less';
import { serviceProto } from './shared/protocols/serviceProto';

// Create Client
const client = new HttpClient(serviceProto, {
    server: 'http://127.0.0.1:3000'
});

const App = () => {
    // States
    const [name, setName] = useState('');
    const [reply, setReply] = useState<string>('');

    async function onBtnSendClick() {
        setReply('');

        // ========== TSRPC Client -> callApi ==========
        let ret = await client.callApi('Hello', {
            name: name
        });

        // Error
        if (!ret.isSucc) {
            alert('= ERROR =\n' + ret.err.message);
            return;
        }

        // Success
        setName('');
        setReply(ret.res.reply);
    }

    return <div className="App">
        <h1>Hello, TSRPC</h1>

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
    </div>
}

ReactDOM.render(<App />, document.getElementById('app'));