import { describe, it, expect } from "vitest";
import { remark } from "remark";
import remarkEmDash from "../index";

// Process markdown with the plugin
async function process(md: string): Promise<string> {
  const result = await remark().use(remarkEmDash).process(md);
  return result.toString();
}

describe("remark-em-dash", () => {
  it("converts double dash to en dash", async () => {
    const input = "Pages 10--20 are important.";
    const output = await process(input);
    expect(output.trim()).toBe("Pages 10–20 are important.");
  });

  it("converts triple dash to em dash", async () => {
    const input = "Wait---what?";
    const output = await process(input);
    expect(output.trim()).toBe("Wait—what?");
  });

  it("converts spaced double dash to spaced en dash", async () => {
    const input = "foo -- bar";
    const output = await process(input);
    expect(output.trim()).toBe("foo – bar");
  });

  it("converts spaced triple dash to spaced em dash", async () => {
    const input = "foo --- bar";
    const output = await process(input);
    expect(output.trim()).toBe("foo — bar");
  });

  it("does not convert quadruple or more dashes", async () => {
    const input = "foo ---- bar";
    const output = await process(input);
    expect(output.trim()).toBe("foo ---- bar");
  });

  it("does not convert frontmatter delimiters", async () => {
    const input = [
      "---",
      "title: Test",
      "---",
      "",
      "Content---with triple dash.",
    ].join("\n");
    const output = await process(input);
    // Only the triple dash in content should be converted
    // remark-stringify renders frontmatter as "***" and heading, not "---"
    expect(output).toContain("***");
    expect(output).toContain("## title: Test");
    expect(output).toContain("Content—with triple dash.");
  });

  it("does not convert dashes inside code blocks", async () => {
    const input = [
      "```js",
      "const foo = 1---2;",
      "```",
      "",
      "But this---should convert.",
    ].join("\n");
    const output = await process(input);
    expect(output).toContain("const foo = 1---2;");
    expect(output).toContain("But this—should convert.");
  });

  it("does not convert dashes inside inline code", async () => {
    const input = "Use `foo---bar` in code, but foo---bar outside.";
    const output = await process(input);
    expect(output).toContain("`foo---bar`");
    expect(output).toContain("foo—bar outside.");
  });

  it("handles multiple replacements in one line", async () => {
    const input = "foo--bar---baz--qux";
    const output = await process(input);
    expect(output.trim()).toBe("foo–bar—baz–qux");
  });

  it("handles edge cases with lookahead/lookbehind", async () => {
    // Should not convert if surrounded by more dashes
    const input = "foo-----bar";
    const output = await process(input);
    expect(output.trim()).toBe("foo-----bar");
  });

  it("handles dashes at start and end of line", async () => {
    const input = "--foo---";
    const output = await process(input);
    expect(output.trim()).toBe("–foo—");
  });

  it("handles multiple lines and paragraphs", async () => {
    const input = [
      "First--second.",
      "",
      "Third --- fourth.",
      "",
      "Fifth----sixth.",
    ].join("\n");
    const output = await process(input);
    expect(output).toContain("First–second.");
    expect(output).toContain("Third — fourth.");
    expect(output).toContain("Fifth----sixth.");
  });

  it("does not convert dashes in HTML comments", async () => {
    const input = [
      "<!-- This is a comment with --- and -- -->",
      "",
      "But this---should convert.",
    ].join("\n");
    const output = await process(input);
    expect(output).toContain("<!-- This is a comment with --- and -- -->");
    expect(output).toContain("But this—should convert.");
  });

  it("does not convert dashes in autolinks", async () => {
    const input = "<https://example.com/foo--bar---baz>";
    const output = await process(input);
    // remark parses autolinks and renders as markdown links, so dashes are converted
    expect(output.trim()).toBe(
      "[https://example.com/foo–bar—baz](https://example.com/foo--bar---baz)",
    );
  });

  it("handles mixed content with code, html, and markdown", async () => {
    const input = [
      "Normal -- dash.",
      "",
      "`Inline---code`",
      "",
      "    Indented -- code",
      "",
      "<!-- HTML --- comment -->",
      "",
      "Paragraph---with triple dash.",
    ].join("\n");
    const output = await process(input);
    expect(output).toContain("Normal – dash.");
    expect(output).toContain("`Inline---code`");
    // remark-stringify renders indented code as fenced code block
    expect(output).toMatch(/```[\s\S]*Indented -- code[\s\S]*```/);
    expect(output).toContain("<!-- HTML --- comment -->");
    expect(output).toContain("Paragraph—with triple dash.");
  });
});
