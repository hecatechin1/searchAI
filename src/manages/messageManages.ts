import { get, writable } from "svelte/store";
import {messages,currentMessageid} from "../stores/stores";

export function setMessagesHistory(msg:any):Promise<void>{
    return new Promise<void>((resolve,reject)=>{
        try{
            messages.set(msg);
        }catch(error){

        }
    });
}

export function clearChat(){
    console.log('clearChat');
}

export function deleteMessage(i:number){
    console.log('deleteMessage');
}