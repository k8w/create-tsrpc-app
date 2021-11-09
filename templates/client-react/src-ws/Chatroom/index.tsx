import { useEffect, useRef, useState } from "react";
import { getClient } from "../getClient";
import { MsgChat } from "../shared/protocols/MsgChat";
import './index.less';

export const Chatroom = (props: { title: string }) => {
    const [input, setInput] = useState('');
    const [list, setList] = useState([] as MsgChat[]);
    const [client] = useState(getClient());

    // Send input message
    async function send() {
        let ret = await client.callApi('Send', {
            content: input
        });

        // Error
        if (!ret.isSucc) {
            alert(ret.err.message);
            return;
        }

        // Success
        setInput('');
    }

    // on mounted
    useEffect(() => {
        // Connect at startup
        client.connect().then(v => {
            if (!v.isSucc) {
                alert('= Client Connect Error =\n' + v.errMsg);
            }
        });

        // Listen Msg
        client.listenMsg('Chat', v => { setList(oldList => [...oldList, v]) })

        // When disconnected
        client.flows.postDisconnectFlow.push(v => {
            alert('Server disconnected');
            return v;
        })
    }, [client]);

    // Scroll to bottom when new message come
    const ul = useRef<HTMLUListElement>(null);
    useEffect(() => {
        ul.current?.scrollTo(0, ul.current.scrollHeight);
    }, [list.length])

    return <div className="Chatroom">
        <header>{props.title}</header>
        <ul className="list" ref={ul}>
            {list.map((v, i) =>
                <li key={i}>
                    <div className='content'>{v.content}</div>
                    <div className='time'>{v.time.toLocaleTimeString()}</div>
                </li>
            )}
        </ul>
        <div className="send">
            <input placeholder="Say something..." value={input}
                onChange={e => { setInput(e.target.value) }}
                onKeyPress={e => e.key === 'Enter' && send()}
            />
            <button onClick={send}>Send</button>
        </div>
    </div>
}