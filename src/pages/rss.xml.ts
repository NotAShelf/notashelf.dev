import rss from "@astrojs/rss";
import { getCollection } from "astro:content";
import type { CollectionEntry } from "astro:content";
import { marked } from "marked";

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
      // Render the post content to HTML
      const rawContent = await marked.parse(post.body);

      return {
        title: post.data.title,
        pubDate: new Date(post.data.date),
        description: post.data.description,
        content: rawContent,
        link: `/posts/${post.slug}/`,
        categories: post.data.keywords,
      };
    }),
  );

  return rss({
    title: "NotAShelf Blog",
    description:
      "Personal notes on Linux, Nix, NixOS, System Administration and Programming",
    site: import.meta.env.SITE || "https://notashelf.dev",
    items: postItems,
    customData: `<language>en-us</language>`,
    stylesheet: "/rss-styles.xsl",
  });
}
