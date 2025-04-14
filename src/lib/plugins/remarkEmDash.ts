import { visit } from "unist-util-visit";

type RemarkPlugin = () => (tree: any, file: any) => void;

const remarkEmDash: RemarkPlugin = () => {
  return (tree, _file) => {
    visit(tree, "text", (node: { value: string }) => {
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
