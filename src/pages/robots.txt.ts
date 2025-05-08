export async function GET(): Promise<Response> {
  const disallowedUserAgents = [
    "PerplexityBot",
    "FacebookBot",
    "OmigiliBot",
    "anthropic-ai",
    "GPTBot",
    "ChatGPT-User",
    "CCBot",
    "Google-Extended",
    "GoogleOther",
    "ClaudeBot",
    "Bytespider",
    "Sogou",
    "YisouSpider",
    "PetalBot",
    "AhrefsBot",
    "SemrushBot",
    "MJ12bot",
    "BLEXBot",
    "DotBot",
    "Baiduspider",
    "SeekportBot",
    "Exabot",
    "Mail.RU_Bot",
  ];

  const content = `
${disallowedUserAgents.map(agent => `User-agent: ${agent}\nDisallow: /`).join("\n\n")}

User-agent: *
Disallow:

Sitemap: ${import.meta.env.SITE}/sitemap.xml
`.trim();

  const resp = new Response(content);
  resp.headers.set("Content-Type", "text/plain; charset=utf-8");
  return resp;
}
