<script lang="ts">
  import VirtualTable from './VirtualTable.svelte';
  import type { CategorySchema, RecordItem } from '../types';

  export let category: CategorySchema | null = null;
  export let allRecords: RecordItem[] = [];
  export let filteredRecords: RecordItem[] = [];
  export let filters: Record<string, string> = {};
  export let onFilterChange: (key: string, value: string) => void;
  export let sortKey = '';
  export let sortDirection: 'asc' | 'desc' = 'asc';
  export let onSortChange: (key: string) => void;
</script>

{#if !category}
  <section class="table-panel empty-panel"></section>
{:else}
  <section class="table-panel">
    <div class="table-summary">
      <span>{filteredRecords.length}</span>
      <span class="summary-separator">/</span>
      <span>{allRecords.length}</span>
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
      />
    </div>
  </section>
{/if}
