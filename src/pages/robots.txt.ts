export async function GET(): Promise<Response> {
  const resp = new Response(
    `
User-agent: PerplexityBot
Disallow: /

User-agent: FacebookBot
Disallow: /

User-agent:  OmigiliBot
Disallow: /

User-agent: anthropic-ai
Disallow: /

User-agent: GPTBot
Disallow: /

User-agent: ChatGPT-User
Disallow: /

User-agent: PerplexityBot
Disallow: /

User-agent: CCBot
Disallow: /

User-agent: Google-Extended
Disallow: /

User-agent: GoogleOther
Disallow: /

User-agent: *
Disallow:
Allow: /

Sitemap: ${import.meta.env.SITE}/sitemap.xml`.trim(),
  );

  resp.headers.set("Content-Type", "text/plain; charset=utf-8");

  return resp;
}
