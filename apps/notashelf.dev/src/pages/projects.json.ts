import { getCollection } from "astro:content";
import type { APIRoute } from "astro";
import type { ProjectEntry } from "@lib/types";

export const GET: APIRoute = async () => {
  const allProjects = await getCollection("projects");
  // Emit all fields for each project entry.
  // This is sorted **by ID** for added determinism.
  const projects = allProjects
    .map((entry: ProjectEntry) => ({
      ...entry.data,
      id: entry.id,
      slug: entry.slug,
      body: entry.body,
      link: entry.data.sourceUrl,
    }))
    .sort(
      (
        a: ProjectEntry["data"] & { id: string },
        b: ProjectEntry["data"] & { id: string },
      ) => a.id.localeCompare(b.id),
    );

  return new Response(JSON.stringify(projects, null, 2), {
    headers: { "Content-Type": "application/json" },
  });
};
