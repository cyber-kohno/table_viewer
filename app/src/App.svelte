<script lang="ts">
  import { onMount } from 'svelte';
  import CategorySidebar from './components/CategorySidebar.svelte';
  import TablePanel from './components/TablePanel.svelte';
  import { getSchema } from './lib/schema';
  import type { CategorySchema, RecordItem } from './types';

  const sidebarWidth = 200;

  let categories: CategorySchema[] = [];
  let recordsByCategory: Record<string, RecordItem[]> = {};
  let activeCategoryId = '';
  let filters: Record<string, string> = {};
  let sortKey = '';
  let sortDirection: 'asc' | 'desc' = 'asc';
  let isLoading = true;
  let loadError = '';

  onMount(() => {
    const handlePopState = () => {
      void loadViewer();
    };

    window.addEventListener('popstate', handlePopState);
    void loadViewer();

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  });

  async function loadViewer() {
    isLoading = true;
    loadError = '';

    try {
      const viewerData = await getSchema(window.location.pathname);
      categories = viewerData.schema;
      recordsByCategory = viewerData.recordsByCategory;
      activeCategoryId = '';
      resetFilters();
    } catch (error) {
      loadError = error instanceof Error ? error.message : 'Failed to load schema.';
    } finally {
      isLoading = false;
    }
  }

  function resetFilters() {
    const category = activeCategory;
    if (!category) {
      filters = {};
      sortKey = '';
      sortDirection = 'asc';
      return;
    }

    filters = Object.fromEntries(category.columns.map((column) => [column.key, '']));
    sortKey = '';
    sortDirection = 'asc';
  }

  function selectCategory(categoryId: string) {
    if (categoryId === activeCategoryId) {
      activeCategoryId = '';
      resetFilters();
      return;
    }
    activeCategoryId = categoryId;
    resetFilters();
  }

  function updateFilter(key: string, value: string) {
    filters = {
      ...filters,
      [key]: value
    };
  }

  function updateSort(key: string) {
    if (key === '__rowNumber') {
      return;
    }

    if (sortKey !== key) {
      sortKey = key;
      sortDirection = 'asc';
      return;
    }

    sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
  }

  $: activeCategory = categories.find((category) => category.id === activeCategoryId) ?? null;
  $: allRecords = activeCategory ? recordsByCategory[activeCategory.id] ?? [] : [];
  $: filteredRecords = activeCategory
    ? allRecords.filter((record) =>
        activeCategory.columns.every((column) => {
          const filterValue = (filters[column.key] ?? '').trim().toLowerCase();
          if (!filterValue) {
            return true;
          }
          const cellValue = String(record[column.key] ?? '').toLowerCase();
          return cellValue.includes(filterValue);
        })
      )
    : [];
  $: sortedRecords =
    sortKey && activeCategory
      ? [...filteredRecords].sort((left, right) => {
          const leftValue = left[sortKey];
          const rightValue = right[sortKey];

          if (typeof leftValue === 'number' && typeof rightValue === 'number') {
            return sortDirection === 'asc' ? leftValue - rightValue : rightValue - leftValue;
          }

          const compared = String(leftValue ?? '').localeCompare(String(rightValue ?? ''), 'ja', {
            numeric: true,
            sensitivity: 'base'
          });

          return sortDirection === 'asc' ? compared : -compared;
        })
      : filteredRecords;
</script>

<div class="layout">
  <CategorySidebar
    {categories}
    {activeCategoryId}
    {sidebarWidth}
    onSelectCategory={selectCategory}
  />

  <main class="content">
    {#if isLoading}
      <div class="panel-message">Loading...</div>
    {:else if loadError}
      <div class="panel-message error">{loadError}</div>
    {:else}
      <TablePanel
        category={activeCategory}
        {allRecords}
        filteredRecords={sortedRecords}
        {filters}
        onFilterChange={updateFilter}
        {sortKey}
        {sortDirection}
        onSortChange={updateSort}
      />
    {/if}
  </main>
</div>
