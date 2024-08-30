import { SSE } from 'sse.js';
import { get, writable } from 'svelte/store';
import {messages, userRequestedStreamClosure,isStreaming ,streamContext} from "../stores/stores";
import {currentMessageid, type CustomMessage} from "../stores/stores";
import {setMessagesHistory} from "../manages/messageManages";

export async function sendMessage(msg:CustomMessage) {
    userRequestedStreamClosure.set(false);
    let hasError = false;
    let currentMessages = get(messages);
    currentMessages = [...currentMessages];

    let done = false;
    let streamText = "";
    isStreaming.set(true);
    let source = new SSE('',{
        headers:{
            "Content-Type": "application/json",
        },
        method:"POST",
        payload: JSON.stringify({
            prompt:msg
        })
    });

    source.addEventListener("message",async(e)=>{
        let payload;
        console.log(e.data);
        try{
            if(!hasError){
                streamText += e.data;
                streamContext.set({ streamText});
                setMessagesHistory([...currentMessages,{
                    role:'assistant',
                    content:streamText +  "█",
                }]);
            }
        }catch(error){
            hasError = true;
            streamText = streamText.replace(/█+$/, '');
            await setMessagesHistory([...currentMessages,{
                role:"assistant",
                content:streamText,
                'isLiked':false,
                'isDisliked':false
            }]);
            streamText = "";
            source.close();
            isStreaming.set(false);
            return;
        }
    });

    source.addEventListener('close',()=>{
        streamText = streamText.replace(/█+$/, '');
        setMessagesHistory([...currentMessages,{
            role:"assistant",
            content:streamText,
            'isLiked':false,
            'isDisliked':false
        }]);
        streamText = "";
        isStreaming.set(false);
    });
}