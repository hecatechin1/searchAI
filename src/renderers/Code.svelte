<script>
  import { t } from 'svelte-i18n';
  import CopyIcon from "../assets/copy.svg";
  import CheckIcon from "../assets/check.svg";
  import hljs from "highlight.js";
  import { marked } from "marked";
  import "highlight.js/styles/default.css";


  export let text;
  let  hj = hljs.highlightAuto(text);
  let copied = false;
  
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(text);
      copied = true;  // 设置为 true 显示成功消息
      setTimeout(() => {
        copied = false;  // 3 秒后隐藏成功消息
      }, 2000);
    } catch (error) {
      console.error("Error copying text: ", error);
    }
  };
</script>

<div style="position:relative">
  <div class="copycode">
    <div>{ hj.language }</div>
    <button class="" on:click={copyToClipboard}>
      {#if copied}
      <img class="inline-block" alt="Copied" src={CheckIcon} />
      
        <span>{$t('code.copied')}!</span>
      {:else}
      <img class="inline-block copycode-icon" alt="Copy Code" src={CopyIcon} />
      <span>{$t('code.copy')}</span>
      {/if}
    </button>
  </div>
  <pre><code>{@html hj.value}</code></pre>
</div>

<style>
  pre {
    background-color: #0d0d0d;
    border-radius: 0px 0px 10px 10px;
    padding: 20px;
    margin: 0 20px 0 20px;
    opacity: 0;
    animation: fade-in 0.5s ease-in-out forwards;
    margin-bottom: 1rem;
    font-weight: bold;
    overflow-wrap: break-word;
    white-space: pre-wrap;
  }

  .copycode {
    display: flex;
    justify-content: space-between;
    background-color: #333;
    margin: 0 20px 0 20px;
    border-radius: 10px 10px 0px 0px;
    padding: 0.5rem 1rem 0.5rem 1rem;
    color: rgb(187, 187, 187);
  }

  button {
    font-size: small;
    display: block;
    transition: all 0.1s ease-in-out;
    color: rgb(187, 187, 187);
  }

  button:hover {
    color: white;
  }

  .copycode button img {
    margin: 0;
    filter: brightness(0) invert(0.7);
  }

  .copycode button:hover img {
    filter: brightness(0) invert(1);
  }

  @keyframes fade-in {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }


</style>