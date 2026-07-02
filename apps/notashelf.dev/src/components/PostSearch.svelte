<script lang="ts">
  import { onMount, tick } from "svelte";
  import { SvelteDate } from "svelte/reactivity";

  export interface PostData {
    id: string;
    title: string;
    description?: string;
    keywords: string[];
    date: string;
    updated?: string;
    hasSignificantUpdate: boolean;
  }

  export let allPosts: PostData[];
  export let currentPage: number;
  export let baseUrl: string;
  export let allTags: string[];
  export let pageTitle: string = "Blog Posts";

  const STORAGE_KEY = "post-search-state";
  const DISPLAYED_PAGES = 5;

  let searchQuery = "";
  let activeTag = "";
  let isViewingAll = false;
  let isRecentlyUpdated = false;
  let debounceTimer: ReturnType<typeof setTimeout>;

  let postsListEl: HTMLUListElement | null = null;
  let dynamicPerPage = 5;
  let localPage = currentPage;

  async function updatePerPage() {
    await tick();
    if (!postsListEl) return;
    const listTop = postsListEl.getBoundingClientRect().top;
    const firstCard = postsListEl.querySelector(".post-dropdown-item") as HTMLElement | null;
    const cardHeight = firstCard
      ? firstCard.getBoundingClientRect().height +
        parseFloat(window.getComputedStyle(firstCard).marginBottom || "10")
      : 120;
    dynamicPerPage = Math.max(1, Math.floor((window.innerHeight - listTop - 20) / cardHeight));
  }

  onMount(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (saved) {
        const state = JSON.parse(saved);
        if (typeof state.searchTerm === "string") searchQuery = state.searchTerm;
        if (typeof state.activeTag === "string") activeTag = state.activeTag;
        if (typeof state.viewAll === "boolean") isViewingAll = state.viewAll;
      }
    } catch {
      // sessionStorage unavailable
    }
    updatePerPage();
    window.addEventListener("resize", updatePerPage);
    return () => window.removeEventListener("resize", updatePerPage);
  });

  function saveState() {
    try {
      sessionStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ searchTerm: searchQuery, activeTag, viewAll: isViewingAll }),
      );
    } catch {
      // sessionStorage unavailable
    }
  }

  $: filteredPosts = (() => {
    let result = allPosts;
    if (isRecentlyUpdated) {
      const cutoff = new SvelteDate();
      cutoff.setDate(cutoff.getDate() - 30);
      result = result.filter((p) => p.updated && new Date(p.updated) >= cutoff);
    }
    if (activeTag) {
      result = result.filter((p) => p.keywords.includes(activeTag));
    }
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          (p.description?.toLowerCase().includes(q) ?? false),
      );
    }
    return result;
  })();

  $: isFiltering =
    isViewingAll || !!searchQuery.trim() || !!activeTag || isRecentlyUpdated;
  $: dynTotalPages = Math.max(1, Math.ceil(allPosts.length / dynamicPerPage));
  $: clampedPage = Math.max(1, Math.min(localPage, dynTotalPages));
  $: dynPagedPosts = allPosts.slice(
    (clampedPage - 1) * dynamicPerPage,
    clampedPage * dynamicPerPage,
  );
  $: displayPosts = isFiltering ? filteredPosts : dynPagedPosts;
  $: showPagination = !isFiltering && dynTotalPages > 1;

  $: startPage = (() => {
    let s = Math.max(1, clampedPage - Math.floor(DISPLAYED_PAGES / 2));
    const e = Math.min(dynTotalPages, s + DISPLAYED_PAGES - 1);
    if (e - s + 1 < DISPLAYED_PAGES) s = Math.max(1, e - DISPLAYED_PAGES + 1);
    return s;
  })();
  $: endPage = Math.min(dynTotalPages, startPage + DISPLAYED_PAGES - 1);
  $: pageNumbers = Array.from(
    { length: endPage - startPage + 1 },
    (_, i) => startPage + i,
  );

  function handleSearchInput() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      if (searchQuery.trim() && !isViewingAll) isViewingAll = true;
      saveState();
    }, 300);
  }

  function handleSearchSubmit() {
    if (searchQuery.trim() && !isViewingAll) isViewingAll = true;
    saveState();
  }

  function clearSearch() {
    searchQuery = "";
    saveState();
  }

  function handleTagSelect(tag: string) {
    isRecentlyUpdated = false;
    activeTag = tag;
    if (tag && !isViewingAll) isViewingAll = true;
    saveState();
  }

  function handleRecentlyUpdated() {
    isRecentlyUpdated = !isRecentlyUpdated;
    if (isRecentlyUpdated) {
      activeTag = "";
      if (!isViewingAll) isViewingAll = true;
    }
    saveState();
  }

  function toggleViewAll() {
    isViewingAll = !isViewingAll;
    saveState();
  }

  function resetFilters() {
    searchQuery = "";
    activeTag = "";
    isRecentlyUpdated = false;
    isViewingAll = false;
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      // sessionStorage unavailable
    }
  }

  function formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  function goToPage(page: number) {
    localPage = Math.max(1, Math.min(page, dynTotalPages));
    const url = localPage === 1 ? baseUrl : `${baseUrl}/${localPage}`;
    history.pushState({ page: localPage }, "", url);
    saveState();
  }
</script>

<div class="posts-header">
  <h1 class="page-title">{pageTitle}</h1>
  <div class="header-actions">
    <slot name="archive-link" />
    <button
      class="view-toggle"
      class:active={isViewingAll}
      on:click={toggleViewAll}
      title="Toggle view mode"
      aria-label="Toggle between paginated and all posts view"
    >
    {#if isViewingAll}
      <svg
        class="icon"
        viewBox="0 0 640 640"
        fill="currentColor"
        aria-hidden="true"
        width="1em"
        height="1em"
      >
        <path
          d="M104 112C90.7 112 80 122.7 80 136L80 184C80 197.3 90.7 208 104 208L152 208C165.3 208 176 197.3 176 184L176 136C176 122.7 165.3 112 152 112L104 112zM256 128C238.3 128 224 142.3 224 160C224 177.7 238.3 192 256 192L544 192C561.7 192 576 177.7 576 160C576 142.3 561.7 128 544 128L256 128zM256 288C238.3 288 224 302.3 224 320C224 337.7 238.3 352 256 352L544 352C561.7 352 576 337.7 576 320C576 302.3 561.7 288 544 288L256 288zM256 448C238.3 448 224 462.3 224 480C224 497.7 238.3 512 256 512L544 512C561.7 512 576 497.7 576 480C576 462.3 561.7 448 544 448L256 448zM80 296L80 344C80 357.3 90.7 368 104 368L152 368C165.3 368 176 357.3 176 344L176 296C176 282.7 165.3 272 152 272L104 272C90.7 272 80 282.7 80 296zM104 432C90.7 432 80 442.7 80 456L80 504C80 517.3 90.7 528 104 528L152 528C165.3 528 176 517.3 176 504L176 456C176 442.7 165.3 432 152 432L104 432z"
        />
      </svg>
      Paginate
    {:else}
      <svg
        class="icon"
        viewBox="0 0 640 640"
        fill="currentColor"
        aria-hidden="true"
        width="1em"
        height="1em"
      >
        <path
          d="M296.5 69.2C311.4 62.3 328.6 62.3 343.5 69.2L562.1 170.2C570.6 174.1 576 182.6 576 192C576 201.4 570.6 209.9 562.1 213.8L343.5 314.8C328.6 321.7 311.4 321.7 296.5 314.8L77.9 213.8C69.4 209.8 64 201.3 64 192C64 182.7 69.4 174.1 77.9 170.2L296.5 69.2zM112.1 282.4L276.4 358.3C304.1 371.1 336 371.1 363.7 358.3L528 282.4L562.1 298.2C570.6 302.1 576 310.6 576 320C576 329.4 570.6 337.9 562.1 341.8L343.5 442.8C328.6 449.7 311.4 449.7 296.5 442.8L77.9 341.8C69.4 337.8 64 329.3 64 320C64 310.7 69.4 302.1 77.9 298.2L112 282.4zM77.9 426.2L112 410.4L276.3 486.3C304 499.1 335.9 499.1 363.6 486.3L527.9 410.4L562 426.2C570.5 430.1 575.9 438.6 575.9 448C575.9 457.4 570.5 465.9 562 469.8L343.4 570.8C328.5 577.7 311.3 577.7 296.4 570.8L77.9 469.8C69.4 465.8 64 457.3 64 448C64 438.7 69.4 430.1 77.9 426.2z"
        />
      </svg>
      View All
    {/if}
    </button>
  </div>
</div>

<div class="filters-container">
  <div class="search-container">
    <form on:submit|preventDefault={handleSearchSubmit}>
      <input
        type="text"
        id="search-input"
        placeholder="Search posts..."
        aria-label="Search posts"
        bind:value={searchQuery}
        on:input={handleSearchInput}
      />
      <button type="submit" class="search-button" aria-label="Search">
        <svg
          class="icon"
          viewBox="0 0 640 640"
          fill="currentColor"
          aria-hidden="true"
          width="1em"
          height="1em"
        >
          <path
            d="M480 272C480 317.9 465.1 360.3 440 394.7L566.6 521.4C579.1 533.9 579.1 554.2 566.6 566.7C554.1 579.2 533.8 579.2 521.3 566.7L394.7 440C360.3 465.1 317.9 480 272 480C157.1 480 64 386.9 64 272C64 157.1 157.1 64 272 64C386.9 64 480 157.1 480 272zM272 416C351.5 416 416 351.5 416 272C416 192.5 351.5 128 272 128C192.5 128 128 192.5 128 272C128 351.5 192.5 416 272 416z"
          />
        </svg>
      </button>
      {#if searchQuery}
        <button
          type="button"
          class="clear-search"
          on:click={clearSearch}
          aria-label="Clear search"
        >
          <svg
            class="icon"
            viewBox="0 0 640 640"
            fill="currentColor"
            aria-hidden="true"
            width="1em"
            height="1em"
          >
            <path
              d="M183.1 137.4C170.6 124.9 150.3 124.9 137.8 137.4C125.3 149.9 125.3 170.2 137.8 182.7L275.2 320L137.9 457.4C125.4 469.9 125.4 490.2 137.9 502.7C150.4 515.2 170.7 515.2 183.2 502.7L320.5 365.3L457.9 502.6C470.4 515.1 490.7 515.1 503.2 502.6C515.7 490.1 515.7 469.8 503.2 457.3L365.8 320L503.1 182.6C515.6 170.1 515.6 149.8 503.1 137.3C490.6 124.8 470.3 124.8 457.8 137.3L320.5 274.7L183.1 137.4z"
            />
          </svg>
        </button>
      {/if}
    </form>
  </div>

  <div class="tags-container">
    <div class="tags-wrap">
      <button
        type="button"
        class="tag-filter"
        class:active={!activeTag && !isRecentlyUpdated}
        on:click={() => handleTagSelect("")}
      >All</button>
      <button
        type="button"
        class="tag-filter"
        class:active={isRecentlyUpdated}
        on:click={handleRecentlyUpdated}
        title="Show recently updated posts"
        aria-label="Filter posts updated in the last 30 days"
      >Recently Updated</button>
      {#each allTags as tag (tag)}
        <button
          type="button"
          class="tag-filter"
          class:active={activeTag === tag}
          on:click={() => handleTagSelect(tag)}
        >{tag}</button>
      {/each}
    </div>
  </div>
</div>

{#if displayPosts.length === 0}
  <div class="no-results">
    <svg
      class="search-icon"
      viewBox="0 0 640 640"
      fill="currentColor"
      aria-hidden="true"
    >
      <path
        d="M480 272C480 317.9 465.1 360.3 440 394.7L566.6 521.4C579.1 533.9 579.1 554.2 566.6 566.7C554.1 579.2 533.8 579.2 521.3 566.7L394.7 440C360.3 465.1 317.9 480 272 480C157.1 480 64 386.9 64 272C64 157.1 157.1 64 272 64C386.9 64 480 157.1 480 272zM272 416C351.5 416 416 351.5 416 272C416 192.5 351.5 128 272 128C192.5 128 128 192.5 128 272C128 351.5 192.5 416 272 416z"
      />
    </svg>
    <p>No posts found matching your criteria</p>
    <button type="button" class="reset-filters" on:click={resetFilters}
      >Reset filters</button
    >
  </div>
{:else}
  <ul class="post-list" bind:this={postsListEl}>
    {#each displayPosts as post (post.id)}
      <li class="post-dropdown-item">
        <a href={`/posts/${post.id}`} class="dropdown-link">
          <div class="card-content">
            <h2 class="card-title">{post.title}</h2>
            {#if post.keywords.length > 0}
              <div class="card-tags">
                {#each post.keywords as kw (kw)}
                  <span class="card-tag">{kw}</span>
                {/each}
              </div>
            {/if}
            <div class="card-dates">
              <time datetime={post.date}>Published {formatDate(post.date)}</time>
              {#if post.hasSignificantUpdate && post.updated}
                <time datetime={post.updated} class="updated"
                  >Updated {formatDate(post.updated)}</time
                >
              {/if}
            </div>
            {#if post.description}
              <p class="card-description">{post.description}</p>
            {/if}
          </div>
        </a>
      </li>
    {/each}
  </ul>
{/if}

{#if showPagination}
  <nav class="pagination" aria-label="Pagination">
    <button
      class="pagination-link prev"
      class:disabled={clampedPage <= 1}
      aria-label="Previous page"
      aria-disabled={clampedPage <= 1}
      disabled={clampedPage <= 1}
      on:click={() => goToPage(clampedPage - 1)}
    >
      <svg
        class="chevron-icon"
        viewBox="0 0 640 640"
        fill="currentColor"
        aria-hidden="true"
        width="0.55rem"
        height="0.55rem"
      >
        <path
          d="M169.4 297.4C156.9 309.9 156.9 330.2 169.4 342.7L361.4 534.7C373.9 547.2 394.2 547.2 406.7 534.7C419.2 522.2 419.2 501.9 406.7 489.4L237.3 320L406.6 150.6C419.1 138.1 419.1 117.8 406.6 105.3C394.1 92.8 373.8 92.8 361.3 105.3L169.3 297.3z"
        />
      </svg>
    </button>

    {#if startPage > 1}
      <button class="pagination-link" on:click={() => goToPage(1)}>1</button>
      {#if startPage > 2}
        <span class="pagination-ellipsis">...</span>
      {/if}
    {/if}

    {#each pageNumbers as page (page)}
      <button
        class="pagination-link"
        class:active={clampedPage === page}
        aria-current={clampedPage === page ? "page" : undefined}
        on:click={() => goToPage(page)}
      >{page}</button>
    {/each}

    {#if endPage < dynTotalPages}
      {#if endPage < dynTotalPages - 1}
        <span class="pagination-ellipsis">...</span>
      {/if}
      <button class="pagination-link" on:click={() => goToPage(dynTotalPages)}
        >{dynTotalPages}</button
      >
    {/if}

    <button
      class="pagination-link next"
      class:disabled={clampedPage >= dynTotalPages}
      aria-label="Next page"
      aria-disabled={clampedPage >= dynTotalPages}
      disabled={clampedPage >= dynTotalPages}
      on:click={() => goToPage(clampedPage + 1)}
    >
      <svg
        class="chevron-icon"
        viewBox="0 0 640 640"
        fill="currentColor"
        aria-hidden="true"
        width="0.55rem"
        height="0.55rem"
      >
        <path
          d="M471.1 297.4C483.6 309.9 483.6 330.2 471.1 342.7L279.1 534.7C266.6 547.2 246.3 547.2 233.8 534.7C221.3 522.2 221.3 501.9 233.8 489.4L403.2 320L233.9 150.6C221.4 138.1 221.4 117.8 233.9 105.3C246.4 92.8 266.7 92.8 279.2 105.3L471.2 297.3z"
        />
      </svg>
    </button>
  </nav>
{/if}

<style lang="scss">
  @use "sass:color";
  @use "../styles/variables" as vars;

  .posts-header {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    padding-top: 3rem;
    margin-bottom: 1.5rem;
  }

  .page-title {
    font-size: 2rem;
    font-weight: 700;
    margin: 0;
  }

  .header-actions {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }


  .view-toggle {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.9rem;
    color: color.scale(vars.$secondary, $lightness: -20%);
    background-color: vars.$button-bg;
    padding: 0.4rem 0.8rem;
    border-radius: 4px;
    border: none;
    cursor: pointer;
    font-family: inherit;
    transition: all 0.2s ease;

    &:hover {
      background-color: vars.$button-bg-hover;
      color: vars.$secondary;
    }

    &.active {
      background-color: vars.$button-bg;
      color: vars.$secondary;
    }

    .icon {
      width: 0.9rem;
      height: 0.9rem;
    }
  }

  .filters-container {
    margin-bottom: 1.5rem;
  }

  .search-container {
    margin-bottom: 1rem;

    form {
      position: relative;
      display: flex;
    }

    #search-input {
      flex: 1;
      padding: 0.6rem 0.8rem;
      border-radius: 4px 0 0 4px;
      background-color: vars.$input-bg;
      border: 1px solid vars.$input-border;
      border-right: none;
      color: vars.$secondary;
      font-family: inherit;
      font-size: 0.9rem;
      transition: all 0.2s ease;

      &:focus {
        outline: none;
        background-color: vars.$input-bg-focus;
        border-color: vars.$input-border-focus;
      }
    }

    .search-button {
      padding: 0.6rem 0.8rem;
      background-color: vars.$button-bg;
      border: 1px solid vars.$input-border;
      border-radius: 0 4px 4px 0;
      color: vars.$secondary;
      cursor: pointer;
      font-family: inherit;
      display: flex;
      align-items: center;
      transition: all 0.2s ease;

      &:hover {
        background-color: vars.$button-bg-hover;
      }

      .icon {
        width: 0.9rem;
        height: 0.9rem;
      }
    }

    .clear-search {
      position: absolute;
      right: 2.8rem;
      top: 50%;
      transform: translateY(-50%);
      background: none;
      border: none;
      color: vars.$text-muted;
      cursor: pointer;
      padding: 0.2rem;
      display: flex;
      align-items: center;
      font-family: inherit;

      &:hover {
        color: vars.$secondary;
      }

      .icon {
        width: 0.75rem;
        height: 0.75rem;
      }
    }
  }

  .tags-container .tags-wrap {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
  }

  .tag-filter {
    padding: 0.3rem 0.8rem;
    border-radius: 4px;
    border: none;
    cursor: pointer;
    font-family: inherit;
    color: vars.$text-muted;
    font-size: 0.85rem;
    margin-bottom: 0.5rem;
    background-color: vars.$button-bg;
    transition: all 0.2s ease;

    &:hover {
      background-color: vars.$button-bg-hover;
      color: vars.$secondary;
    }

    &.active {
      background-color: vars.$border-medium;
      color: vars.$secondary;
      font-weight: 500;
    }
  }

  .post-list {
    padding: 0;
    margin: 0;
    width: 100%;
    list-style: none;
  }

  .post-dropdown-item {
    background-color: color.scale(vars.$primary, $lightness: 6%);
    list-style: none;
    border: 1px solid color.scale(vars.$primary, $lightness: -1%);
    border-radius: 6px;
    margin: 10px 0;
    width: 100%;
    display: flex;
    transition:
      background-color 0.15s ease-out,
      transform 0.1s ease-out;

    &:hover {
      background-color: color.scale(vars.$primary, $lightness: 9%);
      transform: translateY(-1px);
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
  }

  .dropdown-link {
    display: block;
    text-decoration: none;
    width: 100%;
    padding: 14px 16px;
    color: vars.$secondary;

    &:visited {
      color: vars.$secondary;
    }
  }

  .card-content {
    display: grid;
    grid-template-columns: 1fr auto;
    grid-template-areas:
      "title tags"
      "dates dates"
      "desc  desc";
    row-gap: 6px;
    column-gap: 14px;
    width: 100%;

    @media (max-width: 768px) {
      grid-template-columns: 1fr;
      grid-template-areas:
        "title"
        "dates"
        "tags"
        "desc";
    }
  }

  .card-title {
    grid-area: title;
    font-size: 1.1em;
    font-weight: bold;
    margin: 0;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    align-self: center;

    @media (max-width: 768px) {
      white-space: normal;
    }
  }

  .card-tags {
    grid-area: tags;
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    align-self: center;
    justify-content: flex-end;

    @media (max-width: 768px) {
      justify-content: flex-start;
    }
  }

  .card-tag {
    font-size: 0.7rem;
    background: vars.$border-light;
    padding: 2px 6px;
    border-radius: 3px;

    @media (max-width: 768px) {
      padding-left: 0;
      border-top-left-radius: 0;
      border-bottom-left-radius: 0;
    }
  }

  .card-dates {
    grid-area: dates;
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    font-size: 0.8em;
    color: color.scale(vars.$secondary, $lightness: -20%);

    time:not(:last-child) {
      margin-right: 1rem;
    }

    .updated {
      font-weight: 500;
    }
  }

  .card-description {
    grid-area: desc;
    font-size: 0.85em;
    color: color.scale(vars.$secondary, $lightness: -10%);
    margin: 0;
    line-height: 1.4;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .no-results {
    text-align: center;
    padding: 3rem 2rem;
    background-color: vars.$button-bg;
    border-radius: 6px;

    .search-icon {
      opacity: 0.5;
      display: block;
      width: 2rem;
      height: 2rem;
      margin: 0 auto 1rem;
    }

    p {
      font-size: 1.1rem;
      margin-bottom: 1.5rem;
    }

    .reset-filters {
      display: inline-block;
      padding: 0.5rem 1rem;
      background-color: vars.$button-bg;
      color: vars.$secondary;
      border-radius: 4px;
      border: 1px solid vars.$border-light;
      cursor: pointer;
      font-family: inherit;
      font-size: 1rem;
      transition: all 0.2s ease;

      &:hover {
        background-color: vars.$button-bg-hover;
      }
    }
  }

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
    border: none;
    cursor: pointer;
    font-family: inherit;
    text-decoration: none;
    color: vars.$secondary;
    font-size: 0.9rem;
    background-color: vars.$button-bg;
    transition: all 0.2s ease;

    &:hover:not(.disabled):not(.active) {
      background-color: vars.$button-bg-hover;
      transform: translateY(-1px);
    }

    &.active {
      background-color: vars.$border-light;
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
  }

  .pagination-ellipsis {
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 2rem;
    height: 2rem;
    color: vars.$text-muted;
    font-size: 0.9rem;
  }
</style>
