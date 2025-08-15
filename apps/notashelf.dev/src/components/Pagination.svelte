<script lang="ts">
  export let currentPage: number;
  export let totalPages: number;
  export let baseUrl: string = "/posts";

  const displayedPages = 5;

  // Calculate page ranges
  // This needs to be done in a way that avoids cyclical dependencies
  // because Svelte's reactivity can cause issues if we try to use
  // reactive variables inside of reactive statements.
  $: {
    // Initial calculation
    let start = Math.max(1, currentPage - Math.floor(displayedPages / 2));
    let end = Math.min(totalPages, start + displayedPages - 1);

    // Adjust if we're at the edges
    if (end - start + 1 < displayedPages) {
      start = Math.max(1, end - displayedPages + 1);
    }

    // Assign to reactive variables
    startPage = start;
    endPage = end;
  }

  // Declare variables outside of reactive statements
  let startPage: number;
  let endPage: number;

  function getPageUrl(page: number): string {
    return page === 1 ? baseUrl : `${baseUrl}/${page}`;
  }
</script>

{#if totalPages > 1}
  <nav class="pagination" aria-label="Pagination">
    <a
      href={currentPage > 1 ? getPageUrl(currentPage - 1) : "#"}
      class={`pagination-link prev ${currentPage <= 1 ? "disabled" : ""}`}
      aria-label="Previous page"
      aria-disabled={currentPage <= 1}
      tabindex={currentPage <= 1 ? -1 : 0}
    >
      <svg
        class="chevron-icon"
        viewBox="0 0 640 640"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path d="M169.4 297.4C156.9 309.9 156.9 330.2 169.4 342.7L361.4 534.7C373.9 547.2 394.2 547.2 406.7 534.7C419.2 522.2 419.2 501.9 406.7 489.4L237.3 320L406.6 150.6C419.1 138.1 419.1 117.8 406.6 105.3C394.1 92.8 373.8 92.8 361.3 105.3L169.3 297.3z"/>
      </svg>
    </a>

    {#if startPage > 1}
      <a href={getPageUrl(1)} class="pagination-link">1</a>
      {#if startPage > 2}
        <span class="pagination-ellipsis">...</span>
      {/if}
    {/if}

    {#each Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i) as page (page)}
      <a
        href={getPageUrl(page)}
        class={`pagination-link ${currentPage === page ? "active" : ""}`}
        aria-current={currentPage === page ? "page" : undefined}
      >
        {page}
      </a>
    {/each}

    {#if endPage < totalPages}
      {#if endPage < totalPages - 1}
        <span class="pagination-ellipsis">...</span>
      {/if}
      <a href={getPageUrl(totalPages)} class="pagination-link">{totalPages}</a>
    {/if}

    <a
      href={currentPage < totalPages ? getPageUrl(currentPage + 1) : "#"}
      class={`pagination-link next ${currentPage >= totalPages ? "disabled" : ""}`}
      aria-label="Next page"
      aria-disabled={currentPage >= totalPages}
      tabindex={currentPage >= totalPages ? -1 : 0}
    >
      <svg
        class="chevron-icon"
        viewBox="0 0 640 640"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path d="M471.1 297.4C483.6 309.9 483.6 330.2 471.1 342.7L279.1 534.7C266.6 547.2 246.3 547.2 233.8 534.7C221.3 522.2 221.3 501.9 233.8 489.4L403.2 320L233.9 150.6C221.4 138.1 221.4 117.8 233.9 105.3C246.4 92.8 266.7 92.8 279.2 105.3L471.2 297.3z"/>
      </svg>
    </a>
  </nav>
{/if}

<style lang="scss">
  @use "sass:color";
  @use "../styles/variables" as vars;

  .pagination {
    display: flex;
    justify-content: center;
    align-items: center;
    margin: 2rem 0;
    gap: 0.3rem;
    flex-wrap: wrap;
  }

  .pagination-link {
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 2rem;
    height: 2rem;
    padding: 0 0.5rem;
    border-radius: 4px;
    text-decoration: none;
    color: vars.$secondary;
    font-size: 0.9rem;
    background-color: rgba(255, 255, 255, 0.05);
    transition: all 0.2s ease;

    &:hover:not(.disabled, .active) {
      background-color: rgba(255, 255, 255, 0.1);
      transform: translateY(-1px);
    }

    &.active {
      background-color: rgba(255, 255, 255, 0.15);
      font-weight: 500;
      pointer-events: none;
    }

    &.disabled {
      opacity: 0.5;
      pointer-events: none;
    }

    &.prev,
    &.next {
      font-size: 0.8rem;
    }

    :global(.chevron-icon) {
      display: inline-block;
      vertical-align: middle;
      width: 1em;
      height: 1em;
      stroke: none;
      fill: currentColor;
      color: color.scale(vars.$secondary, $lightness: -20%);
    }
  }

  .pagination-ellipsis {
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 2rem;
    height: 2rem;
    color: rgba(255, 255, 255, 0.6);
    font-size: 0.9rem;
  }
</style>
