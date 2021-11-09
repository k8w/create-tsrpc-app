import ReactDOM from 'react-dom';
import { Chatroom } from './Chatroom';
import './index.less';

const App = () => <div className='App'>
    <h1>TSRPC Chatroom</h1>

    <div>
        <Chatroom title='Client #1' />
        <Chatroom title='Client #2' />
    </div>
</div>

ReactDOM.render(<App />, document.getElementById('app'));