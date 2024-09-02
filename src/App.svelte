<script lang="ts">
  import { get } from "svelte/store";
  import { onMount, onDestroy } from "svelte";
  import { initApp, cleanupApp } from "./appInit";
  import Topbar from "./lib/Topbar.svelte";
  import Settings from "./lib/Settings.svelte";
  import SvelteMarkdown from "svelte-markdown";
  import CodeRenderer from "./renderers/Code.svelte";
  import UserCodeRenderer from "./renderers/userCode.svelte";
  import EmRenderer from "./renderers/Em.svelte";
  import ListRenderer from "./renderers/ListRenderer.svelte";
  import ListItemRenderer from "./renderers/ListItem.svelte";
  import CodeSpanRenderer from "./renderers/CodeSpan.svelte";
  import ParagraphRenderer from "./renderers/Paragraph.svelte";
  import hljs from "highlight.js";
  import { marked } from "marked";
  import "highlight.js/styles/dark.css";
  import "./i18n.js";
  import { t } from "svelte-i18n";
  import HtmlRenderer from "./renderers/Html.svelte";
  import DeleteIcon from "./assets/delete.svg";
  import CopyIcon from "./assets/copy.svg";
  import RetryIcon from "./assets/retry.svg";
  import UserIcon from "./assets/UserIcon.svg";
  import RobotIcon from "./assets/aianswer-avtar.svg";
  import MoreIcon from "./assets/moreactions.svg";
  import EditIcon from "./assets/edit.svg";
  import SendIcon from "./assets/sendmessage-active.svg";
  import SendDisabledIcon from "./assets/sendmessage-default.svg";
  import WaitIcon from "./assets/stop.svg";
  import GPTIcon from "./assets/gpt.svg";
  import LikeIcon from "./assets/helpful.svg";
  import DislikeIcon from "./assets/unhelpful.svg";
  import LikeActiveIcon from "./assets/helpful-checked.svg";
  import DislikeActiveIcon from "./assets/unhelpful-checked.svg";
  import { afterUpdate } from "svelte";
  import {
    settingsVisible,
    messages,
    sendKey,
    lineBreakKey,
  } from "./stores/stores";
  import {
    isAudioMessage,
    formatMessageForMarkdown,
  } from "./utils/generalUtils";

  import { copyTextToClipboard } from "./utils/generalUtils";
  import { isStreaming } from "./stores/stores";
  import { closeStream } from "./services/uuAIServices";
  import {
    clearChat,
    deleteMessage,
    sendRegularMessage,
    sendRetryMessage
  } from "./manages/messageManages";
  import { parse } from "svelte/compiler";
  // 自定义 renderers
  const renderers = {
    code: CodeRenderer,
    em: EmRenderer,
    list: ListRenderer,
    listitem: ListItemRenderer,
    paragraph: ParagraphRenderer,
    html: HtmlRenderer,
  };

  const userRenderers = {
    code: UserCodeRenderer,
    codespan: CodeSpanRenderer,
    em: EmRenderer,
    list: ListRenderer,
    listitem: ListItemRenderer,
    paragraph: ParagraphRenderer,
    html: HtmlRenderer,
    // 其他自定义的 renderer
  };

  marked.setOptions({
    highlight: function (code, lang) {
      if (hljs.getLanguage(lang)) {
        return hljs.highlight(lang, code).value;
      }
      return hljs.highlightAuto(code).value;
    },
    langPrefix: "hljs language-", // 为高亮添加类前缀，确保样式生效
  });

  let urlParameter;
  let input: string = "";
  let textAreaElement: any;
  let editTextArea: any;

  let pdfOutput = "";

  let chatContainer: HTMLElement;
  let moreButtonsToggle: boolean = false;
  let conversationTitle = "";

  let editingMessageId: number | null = null;
  let editingMessageContent: string = "";

  let chatContainerObserver: MutationObserver | null = null;
  let isMobile = false;
  function setupMutationObserver() {
    if (!chatContainer) return; // Ensure chatContainer is mounted

    const config = { childList: true, subtree: true, characterData: true };

    chatContainerObserver = new MutationObserver((mutationsList, observer) => {
      // Trigger scroll if any relevant mutations observed
      scrollChatToEnd();
    });

    chatContainerObserver.observe(chatContainer, config);
  }

  onMount(async () => {
    await initApp();
    isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test( navigator.userAgent,);
    // Setup MutationObserver after app initialization and component mounting
    setupMutationObserver();

    const urlParams = new URLSearchParams(window.location.search);
    urlParameter = urlParams.get("aisearch_q");
    if (urlParameter) {
      input = urlParameter;
      processMessage();
    }
  });

  onDestroy(() => {
    // Clean up MutationObserver when component is destroyed to prevent memory leaks
    if (chatContainerObserver) {
      chatContainerObserver.disconnect();
      chatContainerObserver = null;
    }
    // Clean up app-specific resources
    cleanupApp();
  });

  function scrollChatToEnd() {
    if (chatContainer) {
      const threshold = 150; // How close to the bottom (in pixels) to trigger auto-scroll
      const isNearBottom =
        chatContainer.scrollHeight - chatContainer.scrollTop - threshold <=
        chatContainer.clientHeight;

      if (isNearBottom) {
        chatContainer.scrollTop = chatContainer.scrollHeight;
      }
    }
  }
  const keys = {
    Enter: "001",
    "Shift+Enter": "011",
    "Ctrl+Enter": "101",
  };
  function textAreaKeysListener(event: any) {
    
    let sendCode = parseInt(keys[get(sendKey)], 2);
    let linebreakCode = parseInt(keys[get(lineBreakKey)], 2);
    // const isMobile =
    //   /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    //     navigator.userAgent,
    //   );
    let e = parseInt(event.key === "Enter" ? "001" : "000", 2);
    let se = parseInt(event.shiftKey ? "010" : "000", 2);
    let ce = parseInt(event.ctrlKey ? "100" : "000", 2);
    let kd = ce | se | e;
    if ((!(sendCode ^ kd)) && (!isMobile)) {
      event.preventDefault(); // Prevent default insert line break behavior
      processMessage();
    }

    if ((!(linebreakCode ^ kd)) ||  (event.key === "Enter" && isMobile)  ) {
      event.preventDefault(); // Prevent default insert line break behavior
      const textarea = this;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;

      // Insert a newline character at the current cursor position
      textarea.value =
        textarea.value.substring(0, start) +
        "\n" +
        textarea.value.substring(end);

      // Move the cursor to the correct position after inserting the newline
      textarea.selectionStart = textarea.selectionEnd = start + 1;
    }

    // if (event.key === "Enter" && isMobile) {
      
    // }
  }

  const textMaxHeight = 300; // Maximum height in pixels

  function autoExpand(event: any) {
    event.target.style.height = "inherit"; // 重置高度
    const computed = window.getComputedStyle(event.target);
    const height =
      parseInt(computed.getPropertyValue("border-top-width"), 10) +
      event.target.scrollHeight +
      parseInt(computed.getPropertyValue("border-bottom-width"), 10);

    const newHeight = Math.min(height, textMaxHeight);
    event.target.style.height = `${newHeight}px`; // 设置计算后的高度

    // 手动调整滚动位置，确保新内容可见
    if (newHeight >= textMaxHeight) {
      event.target.scrollTop = event.target.scrollHeight;
    }
  }

  function handleInput(event: any) {
    autoExpand(event); // 扩展 textarea 的高度
  }

  function processMessage() {
    sendRegularMessage(input);
    input = "";
    textAreaElement.style.height = "6rem"; // Reset the height after sending
  }
  function scrollChat() {
    if (chatContainer) chatContainer.scrollTop = chatContainer.scrollHeight;
  }

  let lastMessageCount = 0;
  afterUpdate(() => {
    const currentMessageCount = $messages.length || 0;
    if (currentMessageCount > lastMessageCount) {
      scrollChat();
    }
    lastMessageCount = currentMessageCount; // Update the count after every update
  });

  function startEditMessage(i: number) {
    editingMessageId = i;
    editingMessageContent = get(messages)[i].content;
  }

  function retry(i: number) {
    sendRetryMessage(get(messages)[i-1].content,i)
  }

  function cancelEdit() {
    editingMessageId = null;
    editingMessageContent = "";
    editTextArea.style.height = "96px"; // Reset the height when editing is canceled
  }

  function submitEdit(i: number) {
    const editedContent = editingMessageContent; // Temporarily store the edited content
    sendRetryMessage(editedContent,i+1);
    cancelEdit();
    // // Calculate how many messages need to be deleted
    // const deleteCount =
    //   $conversations[$chosenConversationId].history.length - i;
    // // Delete messages from the end to the current one, including itself
    // for (let j = 0; j < deleteCount; j++) {
    //   deleteMessageFromConversation(
    //     $conversations[$chosenConversationId].history.length - 1,
    //   );
    // }
    // // Process the edited message as new input
    // let convId = $chosenConversationId;
    // routeMessage(editedContent, convId, pdfOutput);
    // cancelEdit(); // Reset editing state
  }
  document.addEventListener("DOMContentLoaded", function () {
    // 选择所有的 h1-h6 标签
    const headings = document.querySelectorAll(
      ".message-display h1, .message-display h2, .message-display h3, .message-display h4, .message-display h5, .message-display h6",
    );

    // 遍历每个 heading 元素，设置 data-text 属性并添加4个字符
    headings.forEach((heading) => {
      const originalText = heading.textContent;
      const extendedText = originalText + "..."; // 在文本后添加4个空格
      heading.setAttribute("data-text", extendedText);
    });
  });

  // 点赞和踩的方法  因为history是openai API里的ChatCompletionRequestMessage类型，
  //而ChatCompletionRequestMessage类型不包含isLiked和isDisliked这两个属性,所以直接增加属性会报错；
  //stores里定义customChatCompletionRequestMessage继承ChatCompletionRequestMessage,增加isLiked和isDisliked两个属性
  function toggleLike(msgid: any) {
    let msg = $messages[msgid];
    msg.isLiked = true;
    msg.isDisliked = false;
    let conv = get(messages);
    conv[msgid] = msg;
    messages.set(conv);
  }

  function toggleDislike(msgid: any) {
    let msg = $messages[msgid];
    msg.isLiked = false;
    msg.isDisliked = true;
    let conv = get(messages);
    conv[msgid] = msg;
    messages.set(conv);
  }

  function reloadConfig() {
    console.log();
  }
</script>

<title>
  {$t("app.title")}
</title>
{#if $settingsVisible}
  <Settings on:settings-changed={reloadConfig} />
{/if}

<main class="bg-primary overflow-hidden">
  <div
    class="h-screen flex justify-stretch flex-col bg-secondary text-black/80 height-manager"
  >
    <Topbar
      bind:conversation_title={conversationTitle}
      on:new-chat={clearChat}
    />
    <div
      class="flex bg-primary overflow-y-auto overflow-x-hidden justify-center grow"
      bind:this={chatContainer}
    >
      {#if $messages.length > 0}
        <div class="flex flex-col pt-2 grow max-w-full px-0 sm:px-5">
          <div class="w-full">
            {#each $messages as message, i}
              {#if message.role !== "system"}
                <div
                  class="message relative inline-block bg-primary px-3 mt-3 flex flex-col transition-all duration-200 ease-in-out"
                >
                  <div class="profile-picture flex align-middle">
                    <div>
                      <img
                        src={message.role === "user" ? UserIcon : RobotIcon}
                        alt="Profile"
                        class="w-[1.5rem] h-[1.5rem]"
                      />
                    </div>
                    <div class="relative ml-2 font-bold">
                      {#if message.role === "assistant"}
                        {$t("app.assistantname")}
                      {:else}
                        {$t("app.username")}
                      {/if}
                    </div>
                  </div>

                  {#if editingMessageId === i}
                    <textarea
                      bind:this={editTextArea}
                      class="message-edit-textarea mt-2 bg-secondary p-2 mx-2 border-2 border-themegreyborder resize-none focus:outline-2 focus:outline-themegreen shadow rounded-lg transition-all duration-200 ease-in-out"
                      bind:value={editingMessageContent}
                      on:input={autoExpand}
                      autofocus
                      style="height: 6.5rem; overflow-y: auto;"
                    ></textarea>
                    <div class="flex place-content-center mt-4">
                      <button
                        class="cancel-edit border-2 border-themegreyborder bg-themegreyhover hover:bg-secondary rounded-lg px-3 py-1 mr-2"
                        on:click={() => cancelEdit()}>{$t("app.cancel")}</button
                      >
                      <button
                        class="submit-edit rounded-lg px-3 py-1 mr-2 text-white bg-themegreen
              {$isStreaming
                          ? 'bg-themegreylight text-white cursor-not-allowed'
                          : 'hover:bg-themegreenhover hover:text-white'}"
                        on:click={() => submitEdit(i)}
                        disabled={$isStreaming}>{$t("app.submit")}</button
                      >
                    </div>
                  {:else}
                    <div
                      class="message-display mt-2 transition-all duration-200 ease-in-out"
                    >
                      {#if message.role === "assistant"}
                        <SvelteMarkdown
                          {renderers}
                          source={formatMessageForMarkdown(
                            message.content.toString(),
                          )}
                        />
                      {:else}
                        <SvelteMarkdown
                          {renderers}
                          source={formatMessageForMarkdown(
                            message.content.toString(),
                          )}
                        />
                      {/if}
                    </div>
                    <div class="toolbelt flex mb-2 tools justify-between">
                      <div class="flex space-x-2">
                        {#if message.role === "assistant"}
                          <button
                            class="copyButton btn-custom"
                            on:click={() =>
                              copyTextToClipboard(message.content)}
                          >
                            <img
                              class="copy-icon"
                              alt={$t("app.copy")}
                              src={CopyIcon}
                            />
                            <span class="btn-text">{$t("app.copy")}</span>
                          </button>
                          <button
                            class="copyButton btn-custom"
                            on:click={() =>
                              retry(i)}
                          >
                            <img
                              class=""
                              alt={$t("app.retry")}
                              src={RetryIcon}
                            />
                            <span class="btn-text">{$t("app.retry")}</span>
                          </button>
                          <button
                            class="deleteButton btn-custom"
                            on:click={() => deleteMessage(i)}
                          >
                            <img
                              class="delete-icon"
                              alt={$t("app.delete")}
                              src={DeleteIcon}
                            />
                            <span class="btn-text">{$t("app.delete")}</span>
                          </button>
                        {/if}
                        {#if message.role === "user"}
                          <button
                            class="btn-custom"
                            on:click={() => startEditMessage(i)}
                          >
                            <img
                              class="edit-icon"
                              alt={$t("app.edit")}
                              src={EditIcon}
                            />
                            <span class="btn-text">{$t("app.edit")}</span>
                          </button>
                        {/if}
                      </div>
                      <div class="flex space-x-2">
                        {#if message.role === "assistant"}
                          <!-- 在内容框后面显示mode todo 不对应 -->
                          <!-- <span
                            class="btn-custom hover:bg-secondary cursor-default"
                            ><img
                              alt={$selectedMode}
                              src={GPTIcon}
                            />{$selectedMode}</span
                          > -->

                          <!--点赞和踩 todo 不对应 -->
                          <button
                            id="likeBtn"
                            class="btn-custom"
                            on:click={() => toggleLike(i)}
                          >
                            <img
                              alt="like"
                              src={message.isLiked ? LikeActiveIcon : LikeIcon}
                              class={message.isLiked
                                ? "small-rotate-animation"
                                : ""}
                            />
                            <span class="btn-text">{$t("app.like")}</span>
                          </button>
                          <button
                            id="dislikeBtn"
                            class="btn-custom"
                            on:click={() => toggleDislike(i)}
                          >
                            <img
                              alt="dislike"
                              src={message.isDisliked
                                ? DislikeActiveIcon
                                : DislikeIcon}
                              class={message.isDisliked
                                ? "small-rotate-animation"
                                : ""}
                            />
                            <span class="btn-text">{$t("app.dislike")}</span>
                          </button>
                        {/if}
                      </div>
                    </div>
                  {/if}
                </div>
              {/if}
            {/each}
          </div>
        </div>
      {:else}
        <div class="flex justify-center items-center h-full">
          <p>{$t("app.noConversation")}</p>
        </div>
      {/if}
    </div>

    <div
      class="inputbox-container w-full flex justify-center items-center bg-primary"
    >
      <div
        class="inputbox flex flex-1 bg-primary mt-auto mx-auto mb-3 relative"
      >
        <textarea
          bind:this={textAreaElement}
          class="w-full min-h-[6.5rem] h-24 rounded-lg p-2 pb-11 mx-1 border-2 border-themegreyborder resize-none focus:outline-2 focus:outline-themegreen shadow-xl"
          placeholder={$t("app.textareaPlaceholder")}
          autofocus
          bind:value={input}
          on:input={handleInput}
          style="height: 6.5rem; overflow-y: auto; overflow:visible !important;"
          on:keydown={textAreaKeysListener}
        ></textarea>
        <div
          class="absolute textarea-btn-set flex justify-between bg-primary pb-1"
        >
          <div class="flex send-btn-set flex-end items-center gap-1">
            <!-- 发送按钮 -->
            <button
              class="file-label bg-primary rounded cursor-pointer hover:themegray transition-colors"
              on:click={() => {
                if ($isStreaming) {
                  closeStream();
                } else {
                  processMessage();
                }
              }}
              disabled={!$isStreaming && !input.trim().length}
            >
              {#if $isStreaming}
                <img src={WaitIcon} alt="wait" class="min-w-[32px] w-[32px]" />
              {:else if input.trim().length === 0}
                <img
                  src={SendDisabledIcon}
                  alt="send"
                  class="min-w-[32px] w-[32px]"
                />
              {:else}
                <img src={SendIcon} alt="send" class="min-w-[32px] w-[32px]" />
              {/if}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</main>

<style>
  @import "./styles/styles.css";
</style>
