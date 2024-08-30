<script lang="ts">
  import { t } from 'svelte-i18n';
  import { createEventDispatcher } from "svelte";
  import { menuVisible } from "../stores/stores";
  // import MenuIcon from "../assets/menu.svg";
  import addIcon from "../assets/ainewchat.svg";
  import settingIcon from "../assets/aisettings.svg";
  import {
    settingsVisible,
    helpVisible,
  } from "../stores/stores";

  const dispatch = createEventDispatcher();
  function newChat() {
    dispatch("new-chat");
  }

  function openSettings() {
    helpVisible.set(false);
    settingsVisible.set(true);
  }
  function openHelp() {
    settingsVisible.set(false);
    helpVisible.set(true);
  }

  export let conversation_title: string;
</script>

<div
  class="bg-primary text-black/90 px-3 flex justify-between shrink grow-0 max-h-16 topbar"
>
  <!-- <button
    on:click={() => {
      menuVisible.set(true);
    }}
    class="text-lg font-medium"
  >
    <img class="icon-white w-8" alt="Menu" src={MenuIcon} />
  </button> -->
  <div class="font-bold pt-[0.5em] text-center overflow-hidden h-10 text-ellipsis whitespace-nowrap">
    {conversation_title === "" ? $t('topbar.title') : conversation_title}
  </div>
  <div class="flex gap-2 items-center">
  <button on:click={newChat} class="btn-custom">
    <img class="icon-small" alt="+" src={addIcon} />
    <span class="btn-text">{$t('topbar.newChat')}</span>
  </button>
  <button on:click={openSettings} class="btn-custom">
    <img class="icon-small" alt={$t('topbar.setting')} src={settingIcon} />
    <span class="btn-text">{$t('topbar.setting')}</span>
  </button>
  </div>
</div>
