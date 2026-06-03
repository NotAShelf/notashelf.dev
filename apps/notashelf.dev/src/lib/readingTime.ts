/**
 * Reading-time estimation that does not pretend code blocks, tables, and
 * mermaid diagrams are prose.
 *
 * The naive `body.split(/\s+/).length / 200` model treats every line of a
 * shell transcript or a Cargo.toml the same as a sentence of English, which
 * inflates "min read" by 3-5x on technical posts and makes it useless as a
 * signal. Instead, this strips the dense regions out of the prose word
 * count and charges them at a separate, lower scan rate that reflects how
 * readers actually consume them (skim, glance, occasionally pause).
 *
 * Inputs are raw markdown (frontmatter is tolerated and stripped).
 */

const WORDS_PER_MINUTE = 220;

// Tunables. Readers don't parse a 40-line pseudocode block at 220 wpm; they
// pattern-match. A line of code or a table row should cost a fraction of a
// prose-line's reading time. Per-block constants account for the orienting
// pause when a fenced region appears in the flow.
const CODE_BLOCK_BASE_SECONDS = 3;
const CODE_LINE_SECONDS = 0.6;

const DIAGRAM_BLOCK_BASE_SECONDS = 8;
const DIAGRAM_LINE_SECONDS = 0.4;

const TABLE_ROW_SECONDS = 2;

// Languages we treat as diagrams (scanned, not read like code).
const DIAGRAM_LANGS = new Set(["mermaid"]);

interface Breakdown {
  proseWords: number;
  codeLines: number;
  codeBlocks: number;
  diagramLines: number;
  diagramBlocks: number;
  tableRows: number;
  seconds: number;
}

export function estimateReadingTime(markdown: string): number {
  return Math.max(1, Math.ceil(estimateReadingSeconds(markdown) / 60));
}

export function estimateReadingSeconds(markdown: string): number {
  return computeBreakdown(markdown).seconds;
}

/** Exposed for tests and debugging. */
export function computeBreakdown(markdown: string): Breakdown {
  let src = markdown;

  // Strip YAML front matter so its keys don't end up as "words".
  src = src.replace(/^---\n[\s\S]*?\n---\n?/, "");

  // Strip HTML comments.
  src = src.replace(/<!--[\s\S]*?-->/g, "");

  let codeBlocks = 0;
  let codeLines = 0;
  let diagramBlocks = 0;
  let diagramLines = 0;

  // Fenced code blocks: ```lang\n…\n```. Capture the language so we can
  // distinguish diagrams from code.
  src = src.replace(
    /^([ \t]*)(`{3,}|~{3,})([^\n`]*)\n([\s\S]*?)\n\1\2[ \t]*$/gm,
    (_match, _indent, _fence, info, body: string) => {
      const lang = (info || "").trim().split(/\s+/)[0].toLowerCase();
      const lines = body.split("\n").length;
      if (DIAGRAM_LANGS.has(lang)) {
        diagramBlocks += 1;
        diagramLines += lines;
      } else {
        codeBlocks += 1;
        codeLines += lines;
      }
      return "";
    },
  );

  // Indented code blocks (4-space). Cheap heuristic: a run of lines each
  // starting with 4+ spaces, separated from prose by blank lines.
  src = src.replace(/(?:^|\n)((?: {4}[^\n]*\n?)+)/g, (_match, body: string) => {
    const lines = body.replace(/\n$/, "").split("\n").length;
    codeBlocks += 1;
    codeLines += lines;
    return "\n";
  });

  // Inline pre-rendered <pre class="mermaid">…</pre> blocks that already
  // bypassed the fence (e.g. raw HTML in the source). Counted as diagrams.
  src = src.replace(
    /<pre[^>]*class="[^"]*\bmermaid\b[^"]*"[^>]*>([\s\S]*?)<\/pre>/gi,
    (_match, body: string) => {
      diagramBlocks += 1;
      diagramLines += body.split("\n").length;
      return "";
    },
  );

  // Tables: count rows (lines starting with `|`). Strip the rows so their
  // cell contents don't count as prose words.
  let tableRows = 0;
  src = src.replace(/^\|[^\n]*$/gm, () => {
    tableRows += 1;
    return "";
  });
  // The `|---|---|` separator row is also a table row; the regex above
  // catches it already.

  // Drop inline code spans from prose word count (they are technical tokens,
  // not reading-pace words).
  src = src.replace(/`[^`\n]+`/g, "");

  // Drop image markup (alt text is rarely "read").
  src = src.replace(/!\[[^\]]*\]\([^)]*\)/g, "");

  // Reduce link markup `[text](url)` to just `text`.
  src = src.replace(/\[([^\]]+)\]\([^)]*\)/g, "$1");

  // Drop common markdown syntax tokens that aren't words.
  src = src
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/[*_>]+/g, " ")
    .replace(/^\s*[-+]\s+/gm, "");

  const proseWords = src.split(/\s+/).filter(Boolean).length;

  const seconds =
    (proseWords / WORDS_PER_MINUTE) * 60 +
    codeBlocks * CODE_BLOCK_BASE_SECONDS +
    codeLines * CODE_LINE_SECONDS +
    diagramBlocks * DIAGRAM_BLOCK_BASE_SECONDS +
    diagramLines * DIAGRAM_LINE_SECONDS +
    tableRows * TABLE_ROW_SECONDS;

  return {
    proseWords,
    codeLines,
    codeBlocks,
    diagramLines,
    diagramBlocks,
    tableRows,
    seconds,
  };
}
