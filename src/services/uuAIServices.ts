import { SSE } from 'sse.js';
import { get, writable } from 'svelte/store';
import {messages, userRequestedStreamClosure,isStreaming ,streamContext} from "../stores/stores";
import {currentMessageid, type CustomMessage} from "../stores/stores";
import {setMessagesHistory} from "../manages/messageManages";

let globalSource: EventSource | null = null;  


export const closeStream = async()=>{

}

export async function sendMessage(msg:any,mid:number) {
    userRequestedStreamClosure.set(false);
    let hasError = false;
    let currentMessages = get(messages);
    currentMessages = [...currentMessages];

    let done = false;
    let streamText = "";
    isStreaming.set(true);
    let source = new SSE("https://api.uugpt.com/ai/stream",{
        headers:{
            "Content-Type": "application/json",
        },
        method:"POST",
        payload: JSON.stringify({
            system:"All responses must be in Markdown format.",
            prompt:msg
        })
    });

    source.addEventListener("message",async(e:any)=>{
        if(e.data !== "[DONE]"){
            try{
                if(!hasError){
                    streamText += e.data;
                    streamContext.set({ streamText});
                    if(mid <0){
                        setMessagesHistory([...currentMessages,{
                            role:'assistant',
                            content:streamText +  "█",
                            isLiked:false,
                            isDisliked:false
                        }]);
                    }else{
                        currentMessages[mid].content = streamText+"█";

                            // currentMessages[mid].content = streamText;
                        
                        setMessagesHistory(currentMessages);
                    }

                }
            }catch(error){
                hasError = true;
                source.close();
                isStreaming.set(false);
                return;
            }
        }else{
            streamText = streamText.replace(/█+$/, '');
            done = true;
            isStreaming.set(false);
            source.close();
            // await setMessagesHistory([...currentMessages,{
            //     role:"assistant",
            //     content:streamText,
            //     isLiked:false,
            //     isDisliked:false
            // }]);

            if(mid <0){
                setMessagesHistory([...currentMessages,{
                    role:'assistant',
                    content:streamText,
                    isLiked:false,
                    isDisliked:false
                }]);
            }else{

                    currentMessages[mid].content = streamText;

                setMessagesHistory(currentMessages);
            }


            streamText = "";

        }

    });

    source.addEventListener('error',()=>{
        streamText = streamText.replace(/█+$/, '');
        isStreaming.set(false);
        source.close();
        if(mid <0){
            setMessagesHistory([...currentMessages,{
                role:'assistant',
                content:streamText,
                isLiked:false,
                isDisliked:false
            }]);
        }else{

                currentMessages[mid].content = streamText;
            
            setMessagesHistory(currentMessages);
        }

        streamText = "";
    });

    source.stream();  
    globalSource = source;  
}