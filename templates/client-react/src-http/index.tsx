import { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import { HttpClient } from 'tsrpc-browser';
import { ResGetData } from './shared/protocols/PtlGetData';
import './index.less';
import { serviceProto } from './shared/protocols/serviceProto';

const client = new HttpClient(serviceProto, {
    server: 'http://127.0.0.1:3000',
    logger: console
});

const App = () => {
    // States
    const [input, setInput] = useState('');
    const [list, setList] = useState<ResGetData['data']>([]);

    // Reload message list
    async function loadList() {
        let ret = await client.callApi('GetData', {});

        // Error
        if (!ret.isSucc) {
            alert(ret.err.message);
            return;
        }

        // Success
        setList(ret.res.data);
    }

    // Send Message
    async function send() {
        let ret = await client.callApi('AddData', {
            content: input
        });

        // Error
        if (!ret.isSucc) {
            alert(ret.err.message);
            return;
        }

        // Success
        setInput('');
        loadList();
    }

    // Load list at first
    useEffect(() => { loadList() }, [0]);

    return <div className='App'>
        <h1>TSRPC Guestbook</h1>
        <div className="send">
            <textarea placeholder="Say something..." value={input} onChange={e => { setInput(e.target.value) }} />
            <button onClick={send}>Send</button>
        </div>
        <ul className="list">
            {list.map((v, i) =>
                <li key={i}>
                    <div className="content">{v.content}</div>
                    <div className="time">{v.time.toLocaleTimeString()}</div>
                </li>
            )}
        </ul>
    </div>
}

ReactDOM.render(<App />, document.getElementById('app'));