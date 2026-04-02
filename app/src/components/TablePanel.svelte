<script lang="ts">
  import VirtualTable from './VirtualTable.svelte';
  import type { CategoryRelation, CategorySchema, RecordItem } from '../types';

  type HistoryTrailItem = {
    categoryId: string;
    categoryName: string;
    mappingValues: Array<string | number>;
  };

  export let category: CategorySchema | null = null;
  export let allRecords: RecordItem[] = [];
  export let filteredRecords: RecordItem[] = [];
  export let filters: Record<string, string> = {};
  export let onFilterChange: (key: string, value: string) => void;
  export let sortKey = '';
  export let sortDirection: 'asc' | 'desc' = 'asc';
  export let onSortChange: (key: string) => void;
  export let isCategoryLoading = false;
  export let categoryLoadError = '';
  export let selectedRecord: RecordItem | null = null;
  export let scrollTop = 0;
  export let onScrollTopChange: (scrollTop: number) => void;
  export let onSelectRecord: (record: RecordItem | null) => void;
  export let onViewportHeightChange: (height: number) => void;
  export let relations: CategoryRelation[] = [];
  export let canGoBack = false;
  export let onGoBack: () => void;
  export let onNavigateRelation: (relation: CategoryRelation) => void | Promise<void>;
  export let historyTrail: HistoryTrailItem[] = [];
  export let onShowToast: (message: string, position?: { x: number; y: number }) => void;

  async function copyVisibleRecords(event: MouseEvent) {
    if (!category) {
      return;
    }

    const headerLine = category.columns.map((column) => column.label).join('\t');
    const recordLines = filteredRecords.map((record, index) =>
      category.columns
        .map((column) =>
          column.key === '__rowNumber'
            ? String(index + 1)
            : String(record[column.key] ?? '')
        )
        .join('\t')
    );

    await navigator.clipboard.writeText([headerLine, ...recordLines].join('\n'));
    onShowToast(`Copied ${filteredRecords.length} rows as TSV.`, {
      x: event.clientX,
      y: event.clientY
    });
  }
</script>

{#if !category}
  <section class="table-panel empty-panel"></section>
{:else if isCategoryLoading}
  <section class="table-panel">
    <div class="panel-message">Loading...</div>
  </section>
{:else if categoryLoadError}
  <section class="table-panel">
    <div class="panel-message error">{categoryLoadError}</div>
  </section>
{:else}
  <section class="table-panel">
    <div class="table-summary">
      <span>{filteredRecords.length}</span>
      <span class="summary-separator">/</span>
      <span>{allRecords.length}</span>

      <div class="history-trail" aria-label="Navigation history">
        {#each historyTrail as item, index}
          {#if index > 0}
            <span class="history-separator">&gt;</span>
          {/if}

          <span class:active-history={index === historyTrail.length - 1} class="history-category">
            {item.categoryName}
          </span>

          {#if item.mappingValues.length > 0}
            <span class="history-values">
              [{item.mappingValues.join(', ')}]
            </span>
          {/if}
        {/each}
      </div>
    </div>

    <div class="table-shell">
      <VirtualTable
        columns={category.columns}
        records={filteredRecords}
        filters={filters}
        onFilterChange={onFilterChange}
        {sortKey}
        {sortDirection}
        onSortChange={onSortChange}
        {selectedRecord}
        {scrollTop}
        onScrollTopChange={onScrollTopChange}
        onSelectRecord={onSelectRecord}
        onViewportHeightChange={onViewportHeightChange}
        onCopyRecords={copyVisibleRecords}
        onShowToast={onShowToast}
      />
    </div>

    <div class="table-footer">
      <button
        class="footer-button"
        type="button"
        disabled={!canGoBack}
        onclick={onGoBack}
      >
        Back
      </button>

      {#each relations as relation}
        <button
          class="footer-button"
          type="button"
          disabled={!selectedRecord}
          onclick={() => onNavigateRelation(relation)}
        >
          {relation.name}
        </button>
      {/each}
    </div>
  </section>
{/if}
