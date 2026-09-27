import { describe, it, expect } from "vitest";
import { remark } from "remark";
import remarkEmDash from "../index";

async function process(md: string): Promise<string> {
  const result = await remark().use(remarkEmDash).process(md);
  return result.toString().trim();
}

async function transform(md: string) {
  const processor = remark().use(remarkEmDash);
  return processor.run(processor.parse(md));
}

describe("remark-em-dash", () => {
  it.each([
    ["Pages 10--20 are important.", "Pages 10–20 are important."],
    ["Wait---what?", "Wait—what?"],
    ["foo -- bar --- baz", "foo – bar — baz"],
    ["foo--bar---baz--qux", "foo–bar—baz–qux"],
    ["--foo---", "–foo—"],
    ["foo-bar – baz — qux", "foo-bar – baz — qux"],
  ])(
    "converts only double and triple dash runs in %s",
    async (input, expected) => {
      expect(await process(input)).toBe(expected);
    },
  );

  it("preserves longer dash runs beside convertible runs", async () => {
    expect(await process("a--b----c-----d------e--------f---g")).toBe(
      "a–b----c-----d------e--------f—g",
    );
  });

  it("preserves tabs and line breaks around converted dashes", async () => {
    const tree = await transform("before\t---\tafter\nnext\t--\tlast");
    expect(tree.children).toMatchObject([
      {
        type: "paragraph",
        children: [{ type: "text", value: "before\t—\tafter\nnext\t–\tlast" }],
      },
    ]);
  });

  it("converts text nested in headings, emphasis, strong text, lists, and quotes", async () => {
    const tree = await transform(
      "# Heading---text\n\n*em--text* **strong---text**\n\n- list--text\n\n> quote---text",
    );
    expect(tree.children).toMatchObject([
      { type: "heading", children: [{ type: "text", value: "Heading—text" }] },
      {
        type: "paragraph",
        children: [
          { type: "emphasis", children: [{ type: "text", value: "em–text" }] },
          { type: "text", value: " " },
          {
            type: "strong",
            children: [{ type: "text", value: "strong—text" }],
          },
        ],
      },
      {
        type: "list",
        children: [
          {
            type: "listItem",
            children: [
              {
                type: "paragraph",
                children: [{ type: "text", value: "list–text" }],
              },
            ],
          },
        ],
      },
      {
        type: "blockquote",
        children: [
          {
            type: "paragraph",
            children: [{ type: "text", value: "quote—text" }],
          },
        ],
      },
    ]);
  });

  it("preserves code, raw HTML, and thematic breaks while converting prose", async () => {
    const tree = await transform(
      "---\n\n```js\nconst foo = 1---2;\n```\n\n    indented -- code\n\n<!-- comment --- and -- -->\n\n`inline---code` prose---text",
    );
    expect(tree.children).toMatchObject([
      { type: "thematicBreak" },
      { type: "code", lang: "js", value: "const foo = 1---2;" },
      { type: "code", value: "indented -- code" },
      { type: "html", value: "<!-- comment --- and -- -->" },
      {
        type: "paragraph",
        children: [
          { type: "inlineCode", value: "inline---code" },
          { type: "text", value: " prose—text" },
        ],
      },
    ]);
  });

  it("converts link labels without changing destinations, titles, or image metadata", async () => {
    const tree = await transform(
      '[label--text](https://example.com/foo--bar---baz "title---text") ![alt---text](image--name.png "image---title")',
    );
    expect(tree.children).toMatchObject([
      {
        type: "paragraph",
        children: [
          {
            type: "link",
            url: "https://example.com/foo--bar---baz",
            title: "title---text",
            children: [{ type: "text", value: "label–text" }],
          },
          { type: "text", value: " " },
          {
            type: "image",
            alt: "alt---text",
            url: "image--name.png",
            title: "image---title",
          },
        ],
      },
    ]);
  });

  it("converts autolink display text while preserving the target URL", async () => {
    const tree = await transform("<https://example.com/foo--bar---baz>");
    expect(tree.children).toMatchObject([
      {
        type: "paragraph",
        children: [
          {
            type: "link",
            url: "https://example.com/foo--bar---baz",
            children: [
              { type: "text", value: "https://example.com/foo–bar—baz" },
            ],
          },
        ],
      },
    ]);
  });

  it("preserves reference identifiers and definitions while converting their labels", async () => {
    const tree = await transform(
      '[label---text][ref--id]\n\n[ref--id]: https://example.com/path---name "title--text"',
    );
    expect(tree.children).toMatchObject([
      {
        type: "paragraph",
        children: [
          {
            type: "linkReference",
            identifier: "ref--id",
            label: "ref--id",
            children: [{ type: "text", value: "label—text" }],
          },
        ],
      },
      {
        type: "definition",
        identifier: "ref--id",
        url: "https://example.com/path---name",
        title: "title--text",
      },
    ]);
  });
});
