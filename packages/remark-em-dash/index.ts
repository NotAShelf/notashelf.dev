import { visit } from "unist-util-visit";
import type { Plugin } from "unified";
import type { Root } from "mdast";

const remarkEmDash: Plugin<[], Root> = () => {
  return (tree) => {
    visit(tree, "text", (node) => {
      // Replace triple dashes with em dash (—)
      node.value = node.value.replace(/(?<!-)-{3}(?!-)/g, "—");
      // Replace double dashes with en dash (–)
      node.value = node.value.replace(/(?<!-)-{2}(?!-)/g, "–");
    });
  };
};

export default remarkEmDash;
