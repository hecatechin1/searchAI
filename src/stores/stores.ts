import { type Writable, writable } from "svelte/store";

export interface CustomMessage{
    'role':string,
    'content':string,
    'isLiked':boolean,
    'isDisliked':boolean
}

//面板
export const settingsVisible = writable(false) ;
//设置选项

//发送按键 
let sendk = localStorage.getItem('sendkey');
export const sendKey = writable(sendk || "Enter");
sendKey.subscribe((value)=>{
    localStorage.setItem('sendkey',value);
});
//换行按键
let linebreakk = localStorage.getItem('linebreakkey');
export const lineBreakKey = writable(linebreakk || "Shift+Enter");
lineBreakKey.subscribe((value)=>{
    localStorage.setItem('linebreakkey',value);
});

export const isStreaming = writable(false);  
export const userRequestedStreamClosure = writable(false);  


export const currentMessageid = writable(0);
export const streamContext = writable({ streamText: ''}); 


let storedMessages = localStorage.getItem('search_messages');
let parsedMessages:CustomMessage[] = storedMessages !== null ? JSON.parse(storedMessages) : null;
export const messages: Writable<CustomMessage[]> = writable(parsedMessages || []);
messages.subscribe((value)=>{
    localStorage.setItem('search_messages',JSON.stringify(value));
});