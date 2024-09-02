import { get, writable } from "svelte/store";
import { messages } from "../stores/stores";
import { sendMessage } from "../services/uuAIServices"

export function setMessagesHistory(msg: any): Promise<void> {
    return new Promise<void>((resolve, reject) => {
        try {
            messages.set(msg);
        } catch (error) {

        }
    });
}

export function sendRegularMessage(msg: any) {
    let currentMessageHistory = get(messages);
    currentMessageHistory = [...currentMessageHistory, { role: "user", content: msg, isDisliked: false, isLiked: false }];
    setMessagesHistory(currentMessageHistory);
    sendMessage(msg, -1);
}

export function sendRetryMessage(msg: any, mid: number) {
    let currentMessageHistory = get(messages);
    currentMessageHistory[mid - 1].content = msg;
    if (mid >= currentMessageHistory.length) {
        mid=-1;
    } else {
        if (currentMessageHistory[mid].role == 'user') {
            currentMessageHistory.splice(mid, 0, {
                role: 'assistant',
                content: "█",
                isLiked: false,
                isDisliked: false
            })
        } else {
            currentMessageHistory[mid].content = "█";
        }
    }
    setMessagesHistory(currentMessageHistory);
    sendMessage(msg, mid);
}

export function clearChat() {
    messages.set([]);
}

export function deleteMessage(i: number) {
    let cm = get(messages);
    if (cm[i].role == 'assistant') {
        cm.splice(i, 1);
        messages.set(cm);
    }
}