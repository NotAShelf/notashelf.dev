import { getCollection } from "astro:content";

export async function GET() {
  const allProjects = await getCollection("projects");
  // Emit all fields for each project entry
  const projects = allProjects.map((entry) => ({
    ...entry.data,
    id: entry.id,
    slug: entry.slug,
    body: entry.body,
    link: entry.data.sourceUrl,
  }));

  return new Response(JSON.stringify(projects, null, 2), {
    headers: { "Content-Type": "application/json" },
  });
}
