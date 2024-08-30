import { type Writable, writable } from "svelte/store";
import type { Conversation } from "./c_stores";

interface customMessage{
    'role':string,
    'content':string,
    'isLiked':boolean,
    'isDisliked':boolean
}

//面板
export const settingsVisible = writable(false) ;


let storedMessages = localStorage.getItem('search_messages');
let parsedMessages:customMessage[] = storedMessages !== null ? JSON.parse(storedMessages) : null;
export const messages: Writable<customMessage[]> = writable(parsedMessages || [{
    role:'',
    content:'',
    isLiked:'',
    isDisliked:''
}]);