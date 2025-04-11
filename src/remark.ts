import { toString } from "hast-util-to-string";
import { visit } from "unist-util-visit";
import slugify from "slugify";
import type { Plugin } from "unified";
import type { Node } from "unist";

interface HeadingNode extends Node {
  depth?: number;
  data?: {
    hProperties?: {
      id?: string;
    };
  };
}

interface TextNode extends Node {
  value: string;
}

export const remarkHeadingIds: Plugin = () => {
  return (tree) => {
    visit(tree, "heading", (node: HeadingNode) => {
      const text = toString(node);
      const id = slugify(text, { lower: true, strict: true });

      node.data = node.data || {};
      node.data.hProperties = node.data.hProperties || {};
      node.data.hProperties.id = id;
    });
  };
};

export const remarkEmDash: Plugin = () => {
  return (tree) => {
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
