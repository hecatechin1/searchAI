<script>
    export let site = {
      name: '',  // 站点名称（must）
      url: '',   // 站点的 URL（must）
      image: '', // 可选的站点图片
      icon: '',  // 可选的站点图标
      summary: '' // 可选的站点摘要
    };
  
    // 检查站点图片和摘要是否存在，用于决定卡片的样式
    const hasImage = site.image !== undefined && site.image !== '';
    const hasSummary = site.summary !== undefined && site.summary !== '';
  </script>
  
  <div class="flex items-center p-4 bg-gray-100 rounded-lg shadow-md max-w-full h-[8rem]">
    {#if hasImage}
      <img src={site.image} alt="{site.name} image" class="h-full w-20 object-cover mr-4 rounded-lg"/>
    {/if}
    
    <div class="flex-1">
      <div class="flex items-center">
        {#if site.icon}
          <img src={site.icon} alt="{site.name} icon" class="h-6 w-6 mr-2"/>
        {/if}
        <h3 class="text-lg font-semibold">{site.name}</h3>
      </div>
      {#if hasSummary}
        <p class="text-gray-600 text-sm mt-2">{site.summary}</p>
      {/if}
    </div>
  </div>
  
  <style>
    /* 强制统一卡片高度 */
    .card {
      height: 8rem; /* 设定固定高度 */
    }
  </style>已读