import { visit } from "unist-util-visit";
import type { RemarkPlugin } from "../types";

const remarkEmDash: RemarkPlugin = () => {
  return (tree, _file) => {
    visit(tree, "text", (node: { value: string }) => {
      // Replace --- with em dash (—), but avoid replacing frontmatter delimiters
      // Uses negative lookahead/lookbehind to prevent matching ---- or longer sequences
      node.value = node.value.replace(/(?<!-)-{3}(?!-)/g, "—");
      
      // Replace -- with en dash (–), but avoid replacing frontmatter delimiters
      // Uses negative lookahead/lookbehind to prevent matching --- or longer sequences
      node.value = node.value.replace(/(?<!-)-{2}(?!-)/g, "–");
      
      // Handle cases where there are spaces around triple dashes
      // Preserves the spaces while replacing the dashes with em dash
      node.value = node.value.replace(/\s+-{3}\s+/g, " — ");
      
      // Handle cases where there are spaces around double dashes
      // Preserves the spaces while replacing the dashes with en dash
      node.value = node.value.replace(/\s+-{2}\s+/g, " – ");
    });
  };
};

export default remarkEmDash;
