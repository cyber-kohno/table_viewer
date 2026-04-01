<script lang="ts">
  import type { CategorySchema } from '../types';

  export let categories: CategorySchema[] = [];
  export let activeCategoryId = '';
  export let sidebarWidth = 200;
  export let onSelectCategory: (categoryId: string) => void | Promise<void>;
</script>

<aside class="sidebar" style={`width:${sidebarWidth}px`}>
  <div class="sidebar-title">Categories</div>
  <nav class="category-list" aria-label="Category list">
    {#each categories as category}
      <button
        class:active={category.id === activeCategoryId}
        class="category-button"
        type="button"
        onclick={() => onSelectCategory(category.id)}
      >
        {category.categoryName}
      </button>
    {/each}
  </nav>
</aside>
