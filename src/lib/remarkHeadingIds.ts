import { visit } from "unist-util-visit";
import slugify from "slugify";
import type { Root, Heading, Text } from "mdast";
import type { VFile } from "vfile";

// Define a type that matches Astro's expected remark plugin format
type RemarkPlugin = () => (tree: Root, file: VFile) => void;

const remarkHeadingIds: RemarkPlugin = () => {
  return (tree: Root, _file: VFile) => {
    visit(tree, "heading", (node: Heading) => {
      // Extract text from heading node by collecting text from all child nodes
      let text = "";
      visit(node, "text", (textNode: Text) => {
        text += textNode.value;
      });

      const id = slugify(text, { lower: true, strict: true });

      // Ensure data and hProperties objects exist
      if (!node.data) node.data = {};
      if (!node.data.hProperties) node.data.hProperties = {};

      // Set the id property
      node.data.hProperties.id = id;
    });
  };
};

export default remarkHeadingIds;
