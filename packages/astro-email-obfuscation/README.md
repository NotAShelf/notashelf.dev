# Astro Email Obfuscation

Home-made Astro integration that obfuscates email addresses in your built HTML
files to protect them from scrapers and spam bots. Designed for static sites.

## Features

- **Multiple obfuscation methods**: HTML entities, visual CSS tricks,
  fragmentation, and steganography
- **No inline styles**: Clean markup, styling handled by your CSS
- **Automation resistant**: Techniques designed to defeat sophisticated scrapers
- **Zero configuration**: Works out of the box with sensible defaults

## Usage

Add the integration to your `astro.config.ts`:

```typescript
import { defineConfig } from "astro/config";
import emailObfuscation from "astro-email-obfuscation";

export default defineConfig({
  integrations: [
    emailObfuscation({
      method: "entities", // 'visual' | 'fragment' | 'steganography'
    }),
  ],
});
```

## Obfuscation Methods

Several obfuscation methods are provided for you to choose from.

### 1. HTML Entities (default)

Converts characters to mixed decimal/hex HTML entities:

```
user@domain.com → &#117;&#x73;&#101;&#x72;&#64;&#100;&#x6f;&#x6d;&#97;&#x69;&#110;&#46;&#x63;&#x6f;&#x6d;
```

This will be enough to bypass most crawlers, but more sophisticated crawlers may
account for this.

### 2. Visual

Uses CSS to hide decoy text mixed within the email:

```
user@domain.com → <span class="email-obf">user<span class="email-decoy">xyz7</span>@<span class="email-decoy">abc3</span>domain.com</span>
```

### 3. Fragment

Splits email into fragments with noise that CSS hides:

```
user@domain.com → <span class="email-frag">user</span><span class="email-noise">fake</span><span class="email-frag">@</span><span class="email-noise">text</span><span class="email-frag">domain.com</span>
```

### 4. Steganography

Replaces email with innocent words containing hidden data:

```
user@domain.com → <span class="contact-hint" data-info="dXNlckBkb21h">contact</span>
```

## CSS Styling

Add this CSS to your site to handle the obfuscated elements:

```css
/* Hide decoy elements */
.email-decoy,
.email-noise {
  display: none !important;
}

/* Style obfuscated email elements */
.email-obf,
.contact-hint {
  cursor: pointer;
  text-decoration: underline;
  color: inherit;
}

/* Ensure fragments display inline */
.email-frag {
  display: inline;
}
```

## Options

```typescript
interface AstroEmailObfuscationOptions {
  /**
   * Obfuscation method to use
   * @default 'entities'
   */
  method?: "entities" | "visual" | "fragment" | "steganography";
}
```

## Security Notes

- **HTML Entities**: Most effective against simple scrapers, still readable by
  browsers
- **Visual**: Uses CSS to hide decoy text, resistant to text-based scraping
- **Fragment**: Splits emails across elements with noise, confuses pattern
  matching
- **Steganography**: Hides actual email data, replaces with innocent text

All methods remove `mailto:` links to prevent direct harvesting. Choose based on
your security vs. your own usability requirements.

## Attributions

[astro-mail-obfuscation]: https://github.com/andreas-brunner/astro-mail-obfuscation

`astro-email-obfuscation` is based roughly on [astro-mail-obfuscation] by
Andreas Brunner. While this plugin has been built from ground up to fit my own
needs, and to avoid relying on 3rd party packages where possible, it was a good
reference that came in handy in the design of this plugin, even though most of
the code is entirely different. Thank you!
