import { visit } from "unist-util-visit";
import type { Root } from "mdast";
import type { VFile } from "vfile";

// Define a type that matches Astro's expected remark plugin format
type RemarkPlugin = () => (tree: Root, file: VFile) => void;

interface TextNode {
  type: "text";
  value: string;
}

const remarkEmDash: RemarkPlugin = () => {
  return (tree: Root, _file: VFile) => {
    visit(tree, "text", (node: TextNode) => {
      // Replace --- with em dash (—), but avoid replacing frontmatter delimiters
      // This regex looks for triple dashes with non-dash characters or spaces around them
      node.value = node.value.replace(/([^\-\s])---([^\-\s])/g, "$1—$2");

      // Handle cases where there might be spaces around the dashes
      node.value = node.value.replace(
        /([^\-\s])\s+---\s+([^\-\s])/g,
        "$1 — $2",
      );
    });
  };
};

export default remarkEmDash;
