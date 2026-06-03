import { visit } from "unist-util-visit";
import type { Plugin } from "unified";
import type { Code, Html, Root } from "mdast";

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/**
 * Transform ```mermaid fenced code blocks into raw <pre class="mermaid">…</pre>
 * HTML nodes so that astro-expressive-code never tries to syntax-highlight
 * them. Actual rendering happens client-side in post-enhancements.ts.
 */
const remarkMermaid: Plugin<[], Root> = () => (tree) => {
  visit(tree, "code", (node: Code, index, parent) => {
    if (node.lang !== "mermaid" || !parent || typeof index !== "number") {
      return;
    }

    const replacement: Html = {
      type: "html",
      value: `<pre class="mermaid">${escapeHtml(node.value)}</pre>`,
    };
    parent.children.splice(index, 1, replacement);
  });
};

export default remarkMermaid;
