<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
  <xsl:template match="/">
    <html xmlns="http://www.w3.org/1999/xhtml">
      <head>
        <title><xsl:value-of select="/rss/channel/title"/> RSS Feed</title>
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
        <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
        <style type="text/css">
          :root {
            --primary: #1a1a1a;
            --primary-light: #262626;
            --primary-lighter: #333333;
            --secondary: #f0f0f0;
            --secondary-dark: #d0d0d0;
            --secondary-darker: #a0a0a0;
            --accent: #75b5aa;
          }

          * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
          }

          body {
            font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
            line-height: 1.6;
            color: var(--secondary);
            background-color: var(--primary);
            max-width: 900px;
            margin: 0 auto;
            padding: 2rem 1rem;
          }

          a {
            color: var(--secondary);
            text-decoration: none;
            transition: all 0.2s ease;
          }

          a:hover {
            color: var(--accent);
          }

          header {
            padding-bottom: 2rem;
            margin-bottom: 2rem;
            border-bottom: 1px solid rgba(255, 255, 255, 0.06);
          }

          h1 {
            font-size: 1.8rem;
            font-weight: 600;
            margin-bottom: 0.5rem;
          }

          .channel-description {
            color: var(--secondary-darker);
            font-size: 1rem;
            margin-bottom: 1rem;
          }

          .feed-meta {
            font-size: 0.85rem;
            color: var(--secondary-darker);
          }

          .item {
            margin-bottom: 2.5rem;
            padding-bottom: 2.5rem;
            border-bottom: 1px solid rgba(255, 255, 255, 0.06);
          }

          .item:last-child {
            border-bottom: none;
          }

          .item-header {
            margin-bottom: 1rem;
          }

          .item-title {
            font-size: 1.5rem;
            font-weight: 600;
            margin-bottom: 0.5rem;
          }

          .item-meta {
            display: flex;
            align-items: center;
            color: var(--secondary-darker);
            font-size: 0.85rem;
            margin-bottom: 0.75rem;
          }

          .item-description {
            font-size: 1rem;
            color: var(--secondary-dark);
            margin-bottom: 1rem;
            padding: 0.75rem 1rem;
            border-left: 3px solid rgba(255, 255, 255, 0.1);
            background: var(--primary-light);
          }

          .categories {
            display: flex;
            flex-wrap: wrap;
            gap: 0.5rem;
            margin: 1rem 0;
          }

          .category {
            display: inline-block;
            background: var(--primary-lighter);
            color: var(--secondary-dark);
            padding: 0.3rem 0.6rem;
            border-radius: 4px;
            font-size: 0.75rem;
          }

          .content {
            line-height: 1.7;
            margin-top: 1.5rem;
            overflow-wrap: break-word;
          }

          .content h1, .content h2, .content h3,
          .content h4, .content h5, .content h6 {
            margin: 1.5rem 0 0.75rem 0;
            color: var(--secondary);
          }

          .content h1 { font-size: 1.8rem; }
          .content h2 { font-size: 1.5rem; }
          .content h3 { font-size: 1.3rem; }

          .content p, .content ul, .content ol {
            margin-bottom: 1rem;
          }

          .content a {
            border-bottom: 1px solid rgba(117, 181, 170, 0.3);
          }

          .content a:hover {
            border-bottom: 1px solid var(--accent);
          }

          .content pre, .content code {
            background: var(--primary-lighter);
            border-radius: 4px;
            font-family: 'Iosevka', 'Fira Code', Monaco, Consolas, 'Courier New', monospace;
            font-size: 0.9rem;
            overflow-x: auto;
          }

          .content pre {
            padding: 1rem;
            margin: 1rem 0;
          }

          .content code {
            padding: 0.2rem 0.4rem;
          }

          .content img {
            max-width: 100%;
            height: auto;
            border-radius: 4px;
            margin: 1rem 0;
          }

          .content blockquote {
            border-left: 3px solid rgba(117, 181, 170, 0.5);
            padding-left: 1rem;
            color: var(--secondary-darker);
            margin: 1rem 0;
          }

          .read-more {
            display: block;
            margin-top: 1rem;
            text-align: right;
          }

          .footer {
            margin-top: 3rem;
            padding-top: 1.5rem;
            border-top: 1px solid rgba(255, 255, 255, 0.06);
            text-align: center;
            color: var(--secondary-darker);
            font-size: 0.85rem;
          }

          @media (max-width: 768px) {
            body {
              padding: 1.5rem 1rem;
            }

            h1 {
              font-size: 1.5rem;
            }

            .item-title {
              font-size: 1.3rem;
            }
          }
        </style>
      </head>
      <body>
        <header>
          <h1><a href="{/rss/channel/link}"><xsl:value-of select="/rss/channel/title"/></a></h1>
          <p class="channel-description"><xsl:value-of select="/rss/channel/description"/></p>
          <p class="feed-meta">RSS Feed • Updated <xsl:value-of select="/rss/channel/lastBuildDate"/></p>
        </header>

        <main>
          <xsl:for-each select="/rss/channel/item">
            <article class="item">
              <div class="item-header">
                <h2 class="item-title"><a href="{link}"><xsl:value-of select="title"/></a></h2>
                <div class="item-meta">
                  <time><xsl:value-of select="pubDate"/></time>
                </div>
              </div>

              <div class="item-description">
                <xsl:value-of select="description"/>
              </div>

              <xsl:if test="category">
                <div class="categories">
                  <xsl:for-each select="category">
                    <span class="category"><xsl:value-of select="."/></span>
                  </xsl:for-each>
                </div>
              </xsl:if>

              <div class="content">
                <xsl:value-of select="content"/>
              </div>

              <a href="{link}" class="read-more">Read on notashelf.dev →</a>
            </article>
          </xsl:for-each>
        </main>

        <footer class="footer">
          <p>RSS feed generated by <a href="https://notashelf.dev">notashelf.dev</a></p>
        </footer>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>
