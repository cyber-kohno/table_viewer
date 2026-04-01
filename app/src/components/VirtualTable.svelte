<script lang="ts">
  import { onMount, tick } from 'svelte';
  import type { RecordItem, SchemaColumn } from '../types';

  const rowHeight = 44;
  const headerRowHeight = 48;
  const filterRowHeight = 52;
  const overscan = 6;
  const sortIndicatorWidth = 20;

  export let columns: SchemaColumn[] = [];
  export let records: RecordItem[] = [];
  export let filters: Record<string, string> = {};
  export let onFilterChange: (key: string, value: string) => void;
  export let sortKey = '';
  export let sortDirection: 'asc' | 'desc' = 'asc';
  export let onSortChange: (key: string) => void;

  let scrollTop = 0;
  let viewportHeight = 320;
  let bodyViewport: HTMLDivElement | null = null;
  let resizeObserver: ResizeObserver | null = null;
  let observedViewport: HTMLDivElement | null = null;

  onMount(() => {
    resizeObserver = new ResizeObserver(() => {
      syncViewportHeight();
    });

    void tick().then(syncViewportHeight);

    return () => {
      resizeObserver?.disconnect();
    };
  });

  function syncViewportHeight() {
    viewportHeight = bodyViewport?.clientHeight ?? 320;
  }

  function handleScroll() {
    scrollTop = bodyViewport?.scrollTop ?? 0;
  }

  function getSortState(columnKey: string) {
    if (columnKey === '__rowNumber' || sortKey !== columnKey) {
      return '';
    }

    return sortDirection;
  }

  function escapeHtml(value: string) {
    return value
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
  }

  function getHighlightedCell(record: RecordItem, columnKey: string) {
    const rawValue =
      columnKey === '__rowNumber' ? '' : String(record[columnKey] ?? '');
    const filterValue = (filters[columnKey] ?? '').trim();

    if (!rawValue) {
      return '';
    }

    if (!filterValue) {
      return escapeHtml(rawValue);
    }

    const lowerValue = rawValue.toLowerCase();
    const lowerFilter = filterValue.toLowerCase();
    let searchIndex = 0;
    let highlighted = '';

    while (searchIndex < rawValue.length) {
      const matchedIndex = lowerValue.indexOf(lowerFilter, searchIndex);

      if (matchedIndex === -1) {
        highlighted += escapeHtml(rawValue.slice(searchIndex));
        break;
      }

      highlighted += escapeHtml(rawValue.slice(searchIndex, matchedIndex));
      highlighted += `<mark class="cell-highlight">${escapeHtml(
        rawValue.slice(matchedIndex, matchedIndex + filterValue.length)
      )}</mark>`;
      searchIndex = matchedIndex + filterValue.length;
    }

    return highlighted;
  }

  $: if (resizeObserver && bodyViewport && bodyViewport !== observedViewport) {
    if (observedViewport) {
      resizeObserver.unobserve(observedViewport);
    }
    observedViewport = bodyViewport;
    resizeObserver.observe(bodyViewport);
    syncViewportHeight();
  }

  $: if (bodyViewport) {
    columns;
    records;
    scrollTop = 0;
    bodyViewport.scrollTo({ top: 0 });
  }

  $: visibleCount = Math.ceil(viewportHeight / rowHeight);
  $: startIndex = Math.max(0, Math.floor(scrollTop / rowHeight) - overscan);
  $: endIndex = Math.min(records.length, startIndex + visibleCount + overscan * 2);
  $: visibleRows = records.slice(startIndex, endIndex);
  $: totalBodyHeight = records.length * rowHeight;
  $: totalTableWidth = columns.reduce((sum, column) => sum + column.width + sortIndicatorWidth, 0);
  $: gridTemplateColumns = columns.map((column) => `${column.width + sortIndicatorWidth}px`).join(' ');
</script>

<svelte:window on:resize={syncViewportHeight} />

<div class="table-scroll-x">
  <div class="data-table" style={`min-width:${totalTableWidth}px`}>
    <div
      class="table-row table-header sticky"
      style={`grid-template-columns:${gridTemplateColumns}; height:${headerRowHeight}px; width:${totalTableWidth}px`}
    >
      {#each columns as column}
        <button
          class:sortable={column.key !== '__rowNumber'}
          class:sorted-column={sortKey === column.key}
          class="table-cell header-cell header-button"
          type="button"
          onclick={() => onSortChange(column.key)}
        >
          <span class="header-label">{column.label}</span>
          <span
            class:asc={getSortState(column.key) === 'asc'}
            class:desc={getSortState(column.key) === 'desc'}
            class="sort-indicator"
            aria-hidden="true"
          ></span>
        </button>
      {/each}
    </div>

    <div
      class="table-row table-filter sticky-filter"
      style={`grid-template-columns:${gridTemplateColumns}; height:${filterRowHeight}px; width:${totalTableWidth}px`}
    >
      {#each columns as column}
        <div class:sorted-column={sortKey === column.key} class="table-cell filter-cell">
          {#if column.key !== '__rowNumber'}
            <input
              class="filter-input"
              value={filters[column.key] ?? ''}
              aria-label={`Filter ${column.label}`}
              oninput={(event) => onFilterChange(column.key, (event.currentTarget as HTMLInputElement).value)}
            />
          {/if}
        </div>
      {/each}
    </div>

    <div
      bind:this={bodyViewport}
      class="table-body-viewport"
      onscroll={handleScroll}
    >
      <div class="virtual-canvas" style={`height:${totalBodyHeight}px`}>
        {#each visibleRows as record, index}
          <div
            class:alternate={(startIndex + index) % 2 === 0}
            class="table-row table-body-row virtual-row"
            style={`grid-template-columns:${gridTemplateColumns}; height:${rowHeight}px; width:${totalTableWidth}px; transform:translateY(${(startIndex + index) * rowHeight}px)`}
          >
            {#each columns as column}
              <div class:sorted-column={sortKey === column.key} class="table-cell body-cell">
                {#if column.key === '__rowNumber'}
                  {startIndex + index + 1}
                {:else}
                  {@html getHighlightedCell(record, column.key)}
                {/if}
              </div>
            {/each}
          </div>
        {/each}
      </div>
    </div>
  </div>
</div>
