export async function GET(): Promise<Response> {
  const content = `
User-agent: PerplexityBot
Disallow: /

User-agent: FacebookBot
Disallow: /

User-agent: OmigiliBot
Disallow: /

User-agent: anthropic-ai
Disallow: /

User-agent: GPTBot
Disallow: /

User-agent: ChatGPT-User
Disallow: /

User-agent: CCBot
Disallow: /

User-agent: Google-Extended
Disallow: /

User-agent: GoogleOther
Disallow: /

User-agent: ClaudeBot
Disallow: /

User-agent: Bytespider
Disallow: /

User-agent: Sogou
Disallow: /

User-agent: YisouSpider
Disallow: /

User-agent: PetalBot
Disallow: /

User-agent: AhrefsBot
Disallow: /

User-agent: SemrushBot
Disallow: /

User-agent: MJ12bot
Disallow: /

User-agent: BLEXBot
Disallow: /

User-agent: DotBot
Disallow: /

User-agent: Baiduspider
Disallow: /

User-agent: SeekportBot
Disallow: /

User-agent: Exabot
Disallow: /

User-agent: Mail.RU_Bot
Disallow: /

User-agent: *
Disallow:

Sitemap: ${import.meta.env.SITE}/sitemap.xml
`.trim();

  const resp = new Response(content);
  resp.headers.set("Content-Type", "text/plain; charset=utf-8");
  return resp;
}
