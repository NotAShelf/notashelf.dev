import { visit } from "unist-util-visit";
import type { Plugin } from "unified";
import type { Root, Text } from "mdast";

/**
 * Check if a node is a text node
 */
function isTextNode(node: any): node is Text {
  return node && node.type === "text" && typeof node.value === "string";
}

const remarkEmDash: Plugin<[], Root> = () => {
  return (tree) => {
    visit(tree, "text", (node) => {
      if (!isTextNode(node)) {
        return;
      }

      // Replace triple dashes with em dash (—)
      node.value = node.value.replace(/(?<!-)-{3}(?!-)/g, "—");
      // Replace double dashes with en dash (–)
      node.value = node.value.replace(/(?<!-)-{2}(?!-)/g, "–");
      // Replace spaced triple dashes with spaced em dash
      node.value = node.value.replace(/\s+-{3}\s+/g, " — ");
      // Replace spaced double dashes with spaced en dash
      node.value = node.value.replace(/\s+-{2}\s+/g, " – ");
    });
  };
};

export default remarkEmDash;
