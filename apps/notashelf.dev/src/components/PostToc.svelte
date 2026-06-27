<script lang="ts">
  import { onMount, onDestroy } from "svelte";

  export interface Heading {
    id: string;
    text: string;
    level: number;
  }

  export let headings: Heading[];
  export let itemClass: string = "toc-item";

  let activeId = "";
  let observer: IntersectionObserver | null = null;

  onMount(() => {
    const els = headings
      .map((h) => document.getElementById(h.id))
      .filter((el): el is HTMLElement => el !== null);

    if (!els.length) return;

    const visible = new Set<string>();

    observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) visible.add(entry.target.id);
          else visible.delete(entry.target.id);
        });
        const first = headings.find((h) => visible.has(h.id));
        if (first) activeId = first.id;
      },
      { rootMargin: "-80px 0px -30% 0px", threshold: 0 },
    );

    els.forEach((el) => observer!.observe(el));
  });

  onDestroy(() => observer?.disconnect());

  function handleClick(e: MouseEvent, id: string) {
    e.preventDefault();
    const el = document.getElementById(id);
    if (!el) return;
    window.scrollTo({ top: el.offsetTop - 70, behavior: "smooth" });
    history.pushState(null, "", `#${id}`);
  }
</script>

{#each headings as heading (heading.id)}
  <a
    href={`#${heading.id}`}
    class={`${itemClass} level-${heading.level}`}
    class:active={activeId === heading.id}
    on:click={(e) => handleClick(e, heading.id)}
  >{heading.text}</a>
{/each}
