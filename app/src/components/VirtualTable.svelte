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
  export let selectedRecord: RecordItem | null = null;
  export let scrollTop = 0;
  export let onScrollTopChange: (scrollTop: number) => void;
  export let onSelectRecord: (record: RecordItem | null) => void;
  export let onViewportHeightChange: (height: number) => void;
  export let onCopyRecords: (event: MouseEvent) => void | Promise<void>;
  export let onShowToast: (message: string, position?: { x: number; y: number }) => void;

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
    onViewportHeightChange(viewportHeight);
  }

  function handleScroll() {
    onScrollTopChange(bodyViewport?.scrollTop ?? 0);
  }

  async function applyScrollPosition() {
    if (!bodyViewport) {
      return;
    }

    await tick();

    if (!bodyViewport) {
      return;
    }

    if (Math.abs((bodyViewport.scrollTop ?? 0) - scrollTop) <= 1) {
      return;
    }

    bodyViewport.scrollTo({ top: scrollTop });
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
    scrollTop;
    records.length;
    void applyScrollPosition();
  }

  $: visibleCount = Math.ceil(viewportHeight / rowHeight);
  $: startIndex = Math.max(0, Math.floor(scrollTop / rowHeight) - overscan);
  $: endIndex = Math.min(records.length, startIndex + visibleCount + overscan * 2);
  $: visibleRows = records.slice(startIndex, endIndex);
  $: totalBodyHeight = records.length * rowHeight;
  $: totalTableWidth = columns.reduce((sum, column) => sum + column.width + sortIndicatorWidth, 0);
  $: gridTemplateColumns = columns.map((column) => `${column.width + sortIndicatorWidth}px`).join(' ');

  function isSelected(record: RecordItem) {
    return selectedRecord === record;
  }

  function handleRowClick(record: RecordItem) {
    onSelectRecord(isSelected(record) ? null : record);
  }

  async function handleCellCopy(value: string | number | undefined, x: number, y: number) {
    await navigator.clipboard.writeText(String(value ?? ''));
    onShowToast('Copied cell value.', { x, y });
  }

  function handleCellContextMenu(event: MouseEvent, value: string | number | undefined) {
    event.preventDefault();
    event.stopPropagation();
    void handleCellCopy(value, event.clientX, event.clientY);
  }

  function handleRowKeydown(event: KeyboardEvent, record: RecordItem) {
    if (event.key !== 'Enter' && event.key !== ' ') {
      return;
    }

    event.preventDefault();
    handleRowClick(record);
  }
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
          {#if column.key === '__rowNumber'}
            <button class="copy-button" type="button" onclick={(event) => onCopyRecords(event)}>Copy</button>
          {:else}
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
            class:selected-row={isSelected(record)}
            class="table-row table-body-row virtual-row"
            style={`grid-template-columns:${gridTemplateColumns}; height:${rowHeight}px; width:${totalTableWidth}px; transform:translateY(${(startIndex + index) * rowHeight}px)`}
            role="button"
            tabindex="0"
            onclick={() => handleRowClick(record)}
            onkeydown={(event) => handleRowKeydown(event, record)}
          >
            {#each columns as column}
              <div
                class:sorted-column={sortKey === column.key}
                class="table-cell body-cell"
                role="button"
                tabindex="-1"
                oncontextmenu={(event) =>
                  handleCellContextMenu(
                    event,
                    column.key === '__rowNumber' ? startIndex + index + 1 : record[column.key]
                  )}
              >
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
