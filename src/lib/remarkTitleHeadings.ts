import { visit } from "unist-util-visit";
import type { Root, Heading, Text } from "mdast";
import type { VFile } from "vfile";

// Define a type that matches Astro's expected remark plugin format
type RemarkPlugin = () => (tree: Root, file: VFile) => void;

const remarkTitleHeadings: RemarkPlugin = () => {
  return (tree: Root, _file: VFile) => {
    function toTitleCase(text: string): string {
      if (!text) return "";

      const smallWords = new Set([
        "a",
        "an",
        "and",
        "as",
        "at",
        "but",
        "by",
        "en",
        "for",
        "if",
        "in",
        "of",
        "on",
        "or",
        "the",
        "to",
        "via",
        "vs",
        "vs.",
        "per",
        "nor",
      ]);

      const words = text.split(/\s+/);
      const result = words.map((word, index, array) => {
        if (index === 0 || index === array.length - 1) {
          return capitalizeWord(word);
        }

        if (smallWords.has(word.toLowerCase())) {
          return word.toLowerCase();
        }

        return capitalizeWord(word);
      });

      return result.join(" ");
    }

    function capitalizeWord(word: string): string {
      if (!word) return "";
      return word.replace(
        /(?:^|\s|-|\/|'|"|\(|\[)([a-z])/g,
        (match, letter) => {
          return match.replace(letter, letter.toUpperCase());
        },
      );
    }

    visit(tree, "heading", (headingNode: Heading) => {
      visit(headingNode, "text", (textNode: Text) => {
        const text = textNode.value ? textNode.value.trim() : "";
        textNode.value = toTitleCase(text);
      });
    });
  };
};

export default remarkTitleHeadings;
