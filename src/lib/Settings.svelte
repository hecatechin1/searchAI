<script lang="ts">
  import { t, locale } from 'svelte-i18n';
  import {
    selectedModel,
    selectedVoice,
    selectedMode,
    showTokens,
    selectedSize,
    selectedQuality,
  } from "../stores/stores";
  import { createEventDispatcher } from "svelte";
  import CloseIcon from "../assets/close.svg";
  import { writable, get, derived } from "svelte/store";
  import { onMount } from "svelte";

  import {
    apiKey,
    settingsVisible,
    combinedTokens,
    defaultAssistantRole,
    type DefaultAssistantRole,
  } from "../stores/stores";
  
  // 切换语言
  function changeLanguage(event) {
    locale.set(event.target.value);  
  }

  const dispatch = createEventDispatcher();

  let apiCheckMessage = writable("");
  let showMessage = writable("");

  let models = writable([]);
  let filteredModels = writable([]);
  $: $selectedMode, updateFilteredModels();
  $: $models, updateFilteredModels();

  let localApiTextField: string = get(apiKey) || "";
  $: localApiTextField = $apiKey || "";

  let apiTextField = "";
  apiKey.subscribe((value) => {
    apiTextField = value || "";
    localApiTextField = apiTextField;
  });

  let assistantRoleField = $defaultAssistantRole.role;
  let assistantRoleTypeField = $defaultAssistantRole.type;

  apiKey.subscribe((value) => {
    localStorage.setItem("api_key", JSON.stringify(value));
  });

  let showTokensToggle = false;
  showTokens.subscribe((value) => {
    showTokensToggle = value;
  });

  onMount(async () => {
    await initializeSettings();
  });
  function handleShowTokensToggleChange() {
    showTokens.set(showTokensToggle);
  }
  function updateFilteredModels() {
    let mode = get(selectedMode);
    let availableModels = get(models);
    let newFilteredModels = [];

    if (mode === "GPT") {
      newFilteredModels = availableModels.filter(
        (model) => model.id.includes("gpt") && !model.id.includes("vision")
      );
    } else if (mode === "GPT + Vision") {
      newFilteredModels = availableModels.filter((model) =>
        model.id.includes("vision")
      );
    } else if (mode === "Dall-E") {
      newFilteredModels = availableModels.filter((model) =>
        model.id.includes("dall-e")
      );
    } else if (mode === "TTS") {
      newFilteredModels = availableModels.filter((model) =>
        model.id.includes("tts")
      );
    }

    filteredModels.set(newFilteredModels);

    // Automatically select the first model in the filtered list if the current selection is not in the new list
    if (
      newFilteredModels.length > 0 &&
      (!get(selectedModel) ||
        !newFilteredModels.some((model) => model.id === get(selectedModel)))
    ) {
      selectedModel.set(newFilteredModels[0].id);
    }
  }
  async function initializeSettings() {
    const savedMode = localStorage.getItem("selectedMode");
    selectedMode.set(savedMode || "GPT");

    if (apiTextField) {
      await fetchModels(apiTextField);
    } else {
      const savedModels = localStorage.getItem("models");
      if (savedModels) {
        models.set(JSON.parse(savedModels));
      }
    }
    updateFilteredModels();
  }

  async function checkAPIConnection() {
    if (!localApiTextField) {
      showMessage.set("yellow");
      apiCheckMessage.set("API key is missing.");
      return;
    }

    try {
      const response = await fetch("https://api.openai.com/v1/models", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${localApiTextField}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        showMessage.set("green");
        apiCheckMessage.set("API connection succeeded.");
        // Optionally, reload settings or models here
        handleSave();
        await fetchModels(apiTextField);
        updateFilteredModels();
      } else {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error("API connection failed:", error);
      showMessage.set("red");
      apiCheckMessage.set("API connection failed.");
    }
  }

  async function fetchModels(apiKey: string) {
    if (!apiKey) {
      showMessage.set("yellow");
      console.log("showMessage", showMessage);
      console.error("API key is missing.");
      return;
    }

    try {
      const response = await fetch("https://api.openai.com/v1/models", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const sortedModels = data.data.sort((a, b) => a.id.localeCompare(b.id));
      models.set(sortedModels);
      localStorage.setItem("models", JSON.stringify(sortedModels));

      // After models are fetched and set, restore the model selection
    } catch (error) {
      console.error("Failed to fetch models:", error);
    }
  }

  function clearTokens() {
    combinedTokens.set(0);
  }

  function handleSave() {
    defaultAssistantRole.set({
      role: assistantRoleField,
      type: assistantRoleTypeField,
    });
    apiKey.set(localApiTextField);

    localStorage.setItem("selectedModel", get(selectedModel));
    localStorage.setItem("selectedVoice", get(selectedVoice));
    localStorage.setItem("selectedMode", get(selectedMode));

    dispatch("settings-changed");
    console.log("Settings saved.");
  }

  function handleClose() {
    settingsVisible.set(false);
  }

  function handleSaveAndClose() {
    handleSave();
    handleClose();
  }
</script>

<!-- Settings.svelte -->
<div class="fixed z-50 inset-0 animate-fade-in">
  <div class="flex items-center justify-center min-h-screen">
    <div class="w-full sm:w-auto bg-primary text-gray-900 rounded-lg shadow-xl py-8 relative max-h-[90vh]">
      <button
        class="absolute top-0 right-0 mt-2 mr-2 text-gray-500 hover:text-gray-600"
        on:click={handleClose}
      >
        <img class="icon-white w-6" alt="Close" src={CloseIcon} />
      </button>
      <h2 class="text-xl font-bold mb-4 px-4 sm:px-8">{$t('settings.title')}</h2>
      <!-- Language Selection -->

      <div class="setting-items">
        <div
          class="setting-item-group"
        >
        <div class="setting-item">
          <span class="setting-lable">{$t('settings.language')}</span>
          <select class="" on:change={changeLanguage}>
            <option value="zh">中文 (Chinese)</option>
            <option value="en">English (English)</option>
            <option value="es">Español (Spanish)</option>
            <option value="fr">Français (French)</option>
            <option value="de">Deutsch (German)</option>
            <option value="ja">日本語 (Japanese)</option>
            <option value="ko">한국어 (Korean)</option>
            <option value="ru">Русский (Russian)</option>
            <option value="pt">Português (Portuguese)</option>
            <option value="it">Italiano (Italian)</option>
            <option value="ar">العربية (Arabic)</option>
            <option value="hi">हिन्दी (Hindi)</option>
            <option value="tr">Türkçe (Turkish)</option>
            <option value="vi">Tiếng Việt (Vietnamese)</option>
            <option value="th">ไทย (Thai)</option>
            <option value="pl">Polski (Polish)</option>
            <option value="nl">Nederlands (Dutch)</option>
            <option value="sv">Svenska (Swedish)</option>
            <option value="fi">Suomi (Finnish)</option>
            <option value="no">Norsk (Norwegian)</option>
            <option value="da">Dansk (Danish)</option>
          </select>
        </div>  
        </div>

        <!-- First Section -->
        <div
          class="setting-item-group"
        >
          <div
            class="setting-item"
          >
            <span class="setting-lable">{$t('settings.whenask.title')}</span>
            <select class="">
              <option>{$t('settings.whenask.afterQmark')}</option>
              <option>{$t('settings.whenask.askMannually')}</option>
              <option>{$t('settings.whenask.askAnytime')}</option>
              <!-- Add more options as needed -->
            </select>
          </div>
          <div class="setting-item">
            <span class="setting-lable">{$t('settings.mode')}</span>
            <select class="">
              <option>GPT-4.0</option>
              <!-- Add more options as needed -->
            </select>
          </div>
        </div>

        <!-- Second Section -->
        <div
          class="setting-item-group"
        >
          <div class="setting-item">
            <span class="setting-lable">{$t('settings.sendKey')}</span>
            <select class="">
              <option class="text-gray-600">Enter</option>
              <option class="text-gray-600">Ctrl + Enter</option>
              <option class="text-gray-600">Shift + Enter</option>
            </select>
          </div>
          <div class="setting-item">
            <span class="setting-lable">{$t('settings.lineBreakKey')}</span>
            <select class="">
            <option class="text-gray-600">Ctrl + Enter</option>
            <option class="text-gray-600">Shift + Enter</option>
            <option class="text-gray-600">Enter</option>
          </select>
          </div>
          <div class="setting-item">
            <span class="setting-lable">{$t('settings.switchMode')}</span>
            <select class="">
              <option class="text-gray-600">Ctrl + Shift + M</option>
              <option class="text-gray-600">{$t('settings.customKey')}</option>
            </select>
          </div>
          <div class="setting-item">
            <span class="setting-lable">{$t('settings.newChat')}</span>
            <select class="">
              <option class="text-gray-600">Ctrl + Shift + N</option>
              <option class="text-gray-600">{$t('settings.customKey')}</option>
            </select>
          </div>
        </div>

        <!-- Third Section -->
        <div
          class="setting-item-group"
        >
          <div class="setting-item">
            <span class="setting-lable">{$t('settings.currentV')}</span>
            <span class="text-gray-600">Version 1.0.0</span>
          </div>
          <div class="setting-item">
            <span class="setting-lable">{$t('settings.termsText')}</span>
            <a
              href={$t('settings.termsLink')}
              class="text-gray-600 hover:underline break-all"
            >
            {$t('settings.termsLink')}
            </a>
          </div>
          <div class="setting-item">
            <span class="setting-lable">{$t('settings.userSupport')}</span>
            <a
              href={"mailto:"+ $t('settings.userSupportEmail')}
              class="text-gray-600 hover:underline"
            >
            {$t('settings.userSupportEmail')}
            </a>
          </div>
        </div>
        
      </div>
      <div class="flex justify-end">
        <button
          class="bg-themegreen hover:bg-themegreenhover transition-colors duration-200 text-white py-2 px-4 mt-3 rounded mx-4 sm:mx-8"
          on:click={handleSaveAndClose}
        >
        {$t('settings.save')}
        </button>
      </div>
    </div>
  </div>
</div>

<style>
  @import "../styles/settings.css";
</style>
