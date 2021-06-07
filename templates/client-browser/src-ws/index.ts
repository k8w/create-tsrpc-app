import { Chatroom } from "./Chatroom";

document.querySelectorAll('.chat-room').forEach(v => {
    new Chatroom(v as HTMLDivElement);
});

export { };
