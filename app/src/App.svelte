<script lang="ts">
  import { onMount } from 'svelte';
  import CategorySidebar from './components/CategorySidebar.svelte';
  import TablePanel from './components/TablePanel.svelte';
  import { getSchema } from './lib/schema';
  import { validateRecords, validateViewerData } from './lib/validation';
  import type { CategoryRelation, CategorySchema, RecordItem } from './types';

  const sidebarWidth = 200;
  const rowHeight = 44;

  type FixedFilterCondition = {
    key: string;
    value: string | number;
  };

  type NavigationSnapshot = {
    categoryId: string;
    filters: Record<string, string>;
    sortKey: string;
    sortDirection: 'asc' | 'desc';
    selectedRecord: RecordItem | null;
    scrollTop: number;
    fixedFilterConditions: FixedFilterCondition[];
    relationMode: boolean;
  };

  type NavigationTrailItem = {
    categoryId: string;
    categoryName: string;
    mappingValues: Array<string | number>;
  };

  let categories: CategorySchema[] = [];
  let recordsCache: Record<string, RecordItem[]> = {};
  let activeCategoryId = '';
  let filters: Record<string, string> = {};
  let sortKey = '';
  let sortDirection: 'asc' | 'desc' = 'asc';
  let selectedRecord: RecordItem | null = null;
  let scrollTop = 0;
  let fixedFilterConditions: FixedFilterCondition[] = [];
  let navigationHistory: NavigationSnapshot[] = [];
  let navigationTrail: NavigationTrailItem[] = [];
  let tableViewportHeight = 320;
  let isLoading = true;
  let loadError = '';
  let isCategoryLoading = false;
  let categoryLoadError = '';
  let latestCategoryRequestId = 0;
  let toastMessage = '';
  let toastTimer: number | null = null;
  let toastX = 18;
  let toastY = 18;

  onMount(() => {
    const handlePopState = () => {
      void loadViewer();
    };
    const handleKeydown = (event: KeyboardEvent) => {
      handleGlobalKeydown(event);
    };

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('keydown', handleKeydown);
    void loadViewer();

    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('keydown', handleKeydown);
      if (toastTimer) {
        window.clearTimeout(toastTimer);
      }
    };
  });

  function showToast(message: string, position?: { x: number; y: number }) {
    toastMessage = message;
    if (position) {
      toastX = position.x;
      toastY = position.y;
    }
    if (toastTimer) {
      window.clearTimeout(toastTimer);
    }
    toastTimer = window.setTimeout(() => {
      toastMessage = '';
      toastTimer = null;
    }, 1500);
  }

  async function loadViewer() {
    isLoading = true;
    loadError = '';

    try {
      latestCategoryRequestId += 1;
      const fetchedSchema = await getSchema(window.location.pathname, window.location.search);
      validateViewerData(fetchedSchema);
      categories = fetchedSchema;
      recordsCache = {};
      activeCategoryId = '';
      resetFilters();
      selectedRecord = null;
      scrollTop = 0;
      fixedFilterConditions = [];
      navigationHistory = [];
      navigationTrail = [];
      categoryLoadError = '';
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
      selectedRecord = null;
      scrollTop = 0;
      return;
    }

    filters = Object.fromEntries(category.columns.map((column) => [column.key, '']));
    sortKey = '';
    sortDirection = 'asc';
    selectedRecord = null;
    scrollTop = 0;
  }

  async function selectCategory(categoryId: string) {
    navigationHistory = [];
    navigationTrail = [];
    fixedFilterConditions = [];
    categoryLoadError = '';

    if (categoryId === activeCategoryId) {
      latestCategoryRequestId += 1;
      activeCategoryId = '';
      resetFilters();
      isCategoryLoading = false;
      return;
    }

    activeCategoryId = categoryId;
    resetFilters();

    if (recordsCache[categoryId]) {
      return;
    }

    const category = categories.find((item) => item.id === categoryId);
    if (!category) {
      return;
    }

    const requestId = ++latestCategoryRequestId;
    isCategoryLoading = true;

    try {
      const records = await category.fetchRecords();
      if (requestId !== latestCategoryRequestId) {
        return;
      }

      validateRecords(category, records);

      recordsCache = {
        ...recordsCache,
        [categoryId]: records
      };
    } catch (error) {
      if (requestId !== latestCategoryRequestId) {
        return;
      }

      categoryLoadError = error instanceof Error ? error.message : 'Failed to load records.';
    } finally {
      if (requestId === latestCategoryRequestId) {
        isCategoryLoading = false;
      }
    }
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

    if (sortDirection === 'asc') {
      sortDirection = 'desc';
      return;
    }

    sortKey = '';
    sortDirection = 'asc';
  }

  function updateScrollTop(nextScrollTop: number) {
    scrollTop = nextScrollTop;
  }

  function updateSelectedRecord(record: RecordItem | null) {
    selectedRecord = record;
  }

  function updateTableViewportHeight(height: number) {
    tableViewportHeight = height;
  }

  function shouldIgnoreKeyboard(event: KeyboardEvent) {
    const target = event.target as HTMLElement | null;
    if (!target) {
      return false;
    }

    const tagName = target.tagName;
    return (
      tagName === 'INPUT' ||
      tagName === 'TEXTAREA' ||
      target.isContentEditable
    );
  }

  function moveSelection(step: number) {
    if (!sortedRecords.length) {
      selectedRecord = null;
      return;
    }

    const currentIndex = selectedRecord ? sortedRecords.indexOf(selectedRecord) : -1;
    let nextIndex = currentIndex + step;

    if (currentIndex === -1) {
      nextIndex = step > 0 ? 0 : sortedRecords.length - 1;
    }

    nextIndex = Math.max(0, Math.min(sortedRecords.length - 1, nextIndex));

    const nextRecord = sortedRecords[nextIndex];
    selectedRecord = nextRecord;

    const centeredScrollTop = Math.max(
      0,
      nextIndex * rowHeight - (tableViewportHeight - rowHeight) / 2
    );

    scrollTop = centeredScrollTop;
  }

  function handleGlobalKeydown(event: KeyboardEvent) {
    if (isLoading || isCategoryLoading || !activeCategory || shouldIgnoreKeyboard(event)) {
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      moveSelection(1);
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      moveSelection(-1);
      return;
    }

    if (event.key === 'ArrowRight') {
      const firstRelation = activeCategory.relations[0];
      if (!selectedRecord || !firstRelation) {
        return;
      }

      event.preventDefault();
      void navigateRelation(firstRelation);
      return;
    }

    if (event.key === 'ArrowLeft' && navigationHistory.length > 0) {
      event.preventDefault();
      goBack();
    }
  }

  async function navigateRelation(relation: CategoryRelation) {
    if (!activeCategory || !selectedRecord) {
      return;
    }

    const sourceRecord = selectedRecord;
    const targetCategory = categories.find((category) => category.id === relation.targetCategoryId);
    if (!targetCategory) {
      return;
    }

    const mappingValues = relation.mappings.map(
      (mapping) => sourceRecord[mapping.sourceKey] ?? ''
    );

    navigationHistory = [
      ...navigationHistory,
      {
        categoryId: activeCategoryId,
        filters: { ...filters },
        sortKey,
        sortDirection,
        selectedRecord,
        scrollTop,
        fixedFilterConditions: [...fixedFilterConditions],
        relationMode: isRelationMode
      }
    ];
    navigationTrail =
      navigationTrail.length > 0
        ? [
            ...navigationTrail,
            {
              categoryId: targetCategory.id,
              categoryName: targetCategory.categoryName,
              mappingValues
            }
          ]
        : [
            {
              categoryId: activeCategory.id,
              categoryName: activeCategory.categoryName,
              mappingValues: []
            },
            {
              categoryId: targetCategory.id,
              categoryName: targetCategory.categoryName,
              mappingValues
            }
          ];

    activeCategoryId = targetCategory.id;
    filters = Object.fromEntries(targetCategory.columns.map((column) => [column.key, '']));
    sortKey = '';
    sortDirection = 'asc';
    selectedRecord = null;
    scrollTop = 0;
    fixedFilterConditions = relation.mappings.map((mapping) => ({
      key: mapping.targetKey,
      value: sourceRecord[mapping.sourceKey] ?? ''
    }));
    categoryLoadError = '';

    if (recordsCache[targetCategory.id]) {
      return;
    }

    const requestId = ++latestCategoryRequestId;
    isCategoryLoading = true;

    try {
      const records = await targetCategory.fetchRecords();
      if (requestId !== latestCategoryRequestId) {
        return;
      }

      validateRecords(targetCategory, records);

      recordsCache = {
        ...recordsCache,
        [targetCategory.id]: records
      };
    } catch (error) {
      if (requestId !== latestCategoryRequestId) {
        return;
      }

      categoryLoadError = error instanceof Error ? error.message : 'Failed to load records.';
    } finally {
      if (requestId === latestCategoryRequestId) {
        isCategoryLoading = false;
      }
    }
  }

  function goBack() {
    const lastSnapshot = navigationHistory[navigationHistory.length - 1];
    if (!lastSnapshot) {
      return;
    }

    latestCategoryRequestId += 1;
    navigationHistory = navigationHistory.slice(0, -1);
    navigationTrail = navigationTrail.slice(0, -1);
    activeCategoryId = lastSnapshot.categoryId;
    filters = { ...lastSnapshot.filters };
    sortKey = lastSnapshot.sortKey;
    sortDirection = lastSnapshot.sortDirection;
    selectedRecord = lastSnapshot.selectedRecord;
    scrollTop = lastSnapshot.scrollTop;
    fixedFilterConditions = [...lastSnapshot.fixedFilterConditions];
    isCategoryLoading = false;
    categoryLoadError = '';
  }

  $: activeCategory = categories.find((category) => category.id === activeCategoryId) ?? null;
  $: isRelationMode = fixedFilterConditions.length > 0 || navigationHistory.length > 0;
  $: historyTrail = activeCategory
    ? navigationTrail.length > 0
      ? navigationTrail
      : [
          {
            categoryId: activeCategory.id,
            categoryName: activeCategory.categoryName,
            mappingValues: []
          }
        ]
    : [];
  $: allRecords = activeCategory ? recordsCache[activeCategory.id] ?? [] : [];
  $: relationFilteredRecords = activeCategory
    ? allRecords.filter((record) =>
        fixedFilterConditions.every((condition) => record[condition.key] === condition.value)
      )
    : [];
  $: filteredRecords = activeCategory
    ? relationFilteredRecords.filter((record) =>
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
    {isRelationMode}
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
        allRecords={relationFilteredRecords}
        filteredRecords={sortedRecords}
        {filters}
        onFilterChange={updateFilter}
        {sortKey}
        {sortDirection}
        onSortChange={updateSort}
        {isCategoryLoading}
        {categoryLoadError}
        {selectedRecord}
        {scrollTop}
        onScrollTopChange={updateScrollTop}
        onSelectRecord={updateSelectedRecord}
        onViewportHeightChange={updateTableViewportHeight}
        relations={activeCategory?.relations ?? []}
        canGoBack={navigationHistory.length > 0}
        onGoBack={goBack}
        onNavigateRelation={navigateRelation}
        historyTrail={historyTrail}
        onShowToast={showToast}
      />
    {/if}
  </main>
</div>

{#if toastMessage}
  <div class="toast" style={`left:${toastX}px; top:${toastY}px;`}>
    {toastMessage}
  </div>
{/if}
