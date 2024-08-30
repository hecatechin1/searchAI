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


export const isStreaming = writable(false);  
export const userRequestedStreamClosure = writable(false);  


export const currentMessageid = writable(0);
export const streamContext = writable({ streamText: ''}); 


let storedMessages = localStorage.getItem('search_messages');
let parsedMessages:CustomMessage[] = storedMessages !== null ? JSON.parse(storedMessages) : null;
export const messages: Writable<CustomMessage[]> = writable(parsedMessages || [{
    role:'',
    content:'',
    isLiked:'',
    isDisliked:''
}]);
messages.subscribe((value)=>{
    localStorage.setItem('search_messages',JSON.stringify(value));
});