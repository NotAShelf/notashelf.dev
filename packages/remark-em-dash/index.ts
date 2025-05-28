import { visit } from "unist-util-visit";
import type { Plugin } from "unified";
import type { Root } from "mdast";

const remarkEmDash: Plugin<[], Root> = () => {
  return (tree) => {
    visit(tree, "text", (node: { value: string }) => {
      node.value = node.value.replace(/(?<!-)-{3}(?!-)/g, "—");
      node.value = node.value.replace(/(?<!-)-{2}(?!-)/g, "–");
      node.value = node.value.replace(/\s+-{3}\s+/g, " — ");
      node.value = node.value.replace(/\s+-{2}\s+/g, " – ");
    });
  };
};

export default remarkEmDash;
