import { type Writable, writable } from "svelte/store";
import type { ChatCompletionRequestMessage } from "openai";

//继承并增加isLiked和isDisliked两个属性
interface CustomChatCompletionRequestMessage extends ChatCompletionRequestMessage{
  'isLiked'?:boolean;
  'isDisliked'?:boolean;
}
export interface Conversation {
  history: CustomChatCompletionRequestMessage[];
  conversationTokens: number;
  assistantRole: string;
  title: string;
}

export interface DefaultAssistantRole {
  role: string;
  type: string;
}
const openai_key = import.meta.env.VITE_OPENAI_KEY;
console.log(openai_key);
localStorage.setItem('api_key',`"${openai_key}"`)
// 面板可见性
export const settingsVisible = writable(false);
export const helpVisible = writable(false);
export const menuVisible = writable(false);
export const sidebarVisible = writable(false); //ADD: sidebar可见性 

let storedApiKey = localStorage.getItem("api_key")
let parsedApiKey = storedApiKey !== null ? JSON.parse(storedApiKey) : null;

export const apiKey:Writable<string|null> = writable(parsedApiKey)
apiKey.subscribe((value) => localStorage.setItem("api_key", JSON.stringify(value)));

let storedCombinedTokens = localStorage.getItem('combined_tokens');
let parsedCombinedTokens: number = storedCombinedTokens !== null ? JSON.parse(storedCombinedTokens) : 0;
export const combinedTokens = writable(parsedCombinedTokens);
combinedTokens.subscribe((value) => localStorage.setItem("combined_tokens", JSON.stringify(value)));

let storedDefaultAssistantRole = localStorage.getItem('default_assistant_role');
let parsedDefaultAssistantRole: DefaultAssistantRole = storedDefaultAssistantRole !== null ? JSON.parse(storedDefaultAssistantRole) : 0;
export const defaultAssistantRole = writable(parsedDefaultAssistantRole || {
    role: "你的所有回答都使用markdown格式",
    //role: "You are an AI Search Assistant designed to provide precise, accurate, and well-organized search results to users. Your primary objective is to understand the user's query, search for the most relevant information, and present it in a clear, concise, and organized manner using Markdown formatting. Your responses should be detailed, with important points emphasized, and well-structured.",
    type: "system",
  });
defaultAssistantRole.subscribe((value) => localStorage.setItem("default_assistant_role", JSON.stringify(value)));

export const chosenConversationId = writable(0);

let storedConversations = localStorage.getItem('conversations');
let parsedConversations: Conversation[] = storedConversations !== null ? JSON.parse(storedConversations) : null;
console.log(storedConversations);
export const conversations: Writable<Conversation[]> = writable(parsedConversations || [{
    history: [],
    conversationTokens: 0,
    assistantRole: `
    You are an AI Search Assistant designed to provide precise, accurate, and well-organized search results to users. Your primary objective is to understand the user's query, search for the most relevant information, and present it in a clear, concise, and organized manner using Markdown formatting. Your responses should be detailed, with important points emphasized, and well-structured.
    `,
    title: "",
  }]);

conversations.subscribe((value) => {
  localStorage.setItem('conversations', JSON.stringify(value));
});


export const selectedModel = writable(localStorage.getItem('selectedModel') || 'gpt-4o-mini');
export const selectedVoice = writable(localStorage.getItem('selectedVoice') || 'alloy');
export const selectedMode = writable(localStorage.getItem('selectedMode') || 'GPT');

export const selectedSize = writable(localStorage.getItem('selectedSize') || '1024x1024');
export const selectedQuality = writable(localStorage.getItem('selectedQuality') || 'standard');


selectedModel.subscribe(value => {
    localStorage.setItem("selectedModel", value);
  });
  selectedVoice.subscribe(value => {
    localStorage.setItem("selectedVoice", value);
  });
  selectedSize.subscribe(value => {
    localStorage.setItem("selectedSize", value);
  });
  selectedQuality.subscribe(value => {
    localStorage.setItem("selectedQuality", value);
  });
  selectedMode.subscribe(value => {
    localStorage.setItem("selectedMode", value);
  });
  export const audioUrls = writable([]);

  export const base64Images = writable([]);
  export const clearFileInputSignal = writable(false);
  export const clearPDFInputSignal = writable(false);

  export const isStreaming = writable(false);  
  export const userRequestedStreamClosure = writable(false);  

  export const streamContext = writable({ streamText: '', convId: null });  

  let storedShowTokens = localStorage.getItem('show_tokens');
let parsedShowTokens = storedShowTokens !== null ? JSON.parse(storedShowTokens) : false;

// Create the writable store with the initial value, either from localStorage or default
export const showTokens = writable(parsedShowTokens);

// Subscribe to changes and update localStorage
showTokens.subscribe(value => {
    localStorage.setItem('show_tokens', JSON.stringify(value));
});