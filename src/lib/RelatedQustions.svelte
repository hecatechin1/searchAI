<script>
    export let questions = []; // 接收问题数组
</script>

<div class="flex flex-wrap gap-2">
    {#each questions as question}
        <button class="py-1 px-3 bg-gray-200 rounded-full text-sm hover:bg-gray-300 transition">
        {question}
        </button>
    {/each}
</div>

<style>
/* 可选的样式调整 */
button {
    white-space: nowrap;
}
</style>