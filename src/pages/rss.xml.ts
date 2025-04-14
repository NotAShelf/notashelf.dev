import rss from "@astrojs/rss";
import { getCollection } from "astro:content";
import type { CollectionEntry } from "astro:content";
import { remark } from "remark";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import { compile } from "@mdx-js/mdx";
import remarkMdx from "remark-mdx";

// Process markdown to HTML
async function markdownToHtml(content: string): Promise<string> {
  const result = await remark()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype)
    .use(rehypeStringify)
    .process(content);

  return result.toString();
}

// Process MDX to HTML
async function mdxToHtml(content: string): Promise<string> {
  try {
    // First attempt to compile MDX to JSX
    await compile(content, {
      remarkPlugins: [remarkGfm, remarkMdx],
    });

    // For RSS, we'll strip MDX components and just use the markdown parts
    const result = await remark()
      .use(remarkParse)
      .use(remarkMdx)
      .use(remarkGfm)
      .use(() => (tree) => {
        // This plugin removes mdxJsxFlowElement and mdxJsxTextElement nodes
        // which represent JSX in MDX files
        const visit = (node: any) => {
          if (node.children) {
            node.children = node.children.filter(
              (child: any) =>
                child.type !== "mdxJsxFlowElement" &&
                child.type !== "mdxJsxTextElement",
            );
            node.children.forEach(visit);
          }
        };
        visit(tree);
      })
      .use(remarkRehype)
      .use(rehypeStringify)
      .process(content);

    return result.toString();
  } catch (e) {
    // If MDX processing fails, fall back to regular markdown
    return markdownToHtml(content);
  }
}

export async function GET(): Promise<Response> {
  const posts: CollectionEntry<"posts">[] = await getCollection("posts");
  const sortedPosts = posts
    .filter((post) => !post.data.draft)
    .sort(
      (a, b) =>
        new Date(b.data.date).valueOf() - new Date(a.data.date).valueOf(),
    );

  const postItems = await Promise.all(
    sortedPosts.map(async (post) => {
      // Decide if the post is MDX based on the file extension
      // or content type
      const isMdx = post.id.endsWith(".mdx");

      // Treat post body as a string, provide fallback
      // XXX: Custom content collection was more trouble
      // than what it was worth...
      const postContent = post.body || "";

      // Render the post content to HTML using the appropriate
      // processor
      const htmlContent = isMdx
        ? await mdxToHtml(postContent)
        : await markdownToHtml(postContent);

      return {
        title: post.data.title,
        pubDate: new Date(post.data.date),
        description: post.data.description,
        content: htmlContent,
        link: `/posts/${post.id}/`,
        categories: post.data.keywords,
      };
    }),
  );

  return rss({
    title: "NotAShelf's Blog",
    description:
      "Personal notes on Linux, Nix, NixOS, System Administration and Programming",
    site: import.meta.env.SITE || "https://notashelf.dev",
    items: postItems,
    customData: `<language>en-us</language>`,
    stylesheet: "/rss-styles.xsl",
  });
}
