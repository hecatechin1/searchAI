import { get, writable } from "svelte/store";
import {messages,currentMessageid} from "../stores/stores";

export function setMessagesHistory(msg):Promise<void>{
    return new Promise<void>((resolve,reject)=>{
        try{
            messages.set(msg);
        }catch(error){

        }
    });
}