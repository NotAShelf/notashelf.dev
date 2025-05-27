# Astro Email Obfuscation

An Astro integration that obfuscates email addresses in your built HTML files to
protect them from scrapers and spam bots. Designed for static sites with
multiple obfuscation methods.

## Features

- **Multiple obfuscation methods**: ROT18, Base64, reverse text, and character
  deconstruction
- **Client-side decoding**: Interactive email reveal with JavaScript
- **No inline styles required**: Clean markup, styling handled by your CSS
- **Build-time processing**: Zero runtime overhead for static sites
- **Configurable**: Exclude specific elements and customize placeholder text

## Installation

```bash
npm install astro-email-obfuscation
```

## Usage

Add the integration to your `astro.config.ts`:

```typescript
import { defineConfig } from "astro/config";
import emailObfuscation from "astro-email-obfuscation";

export default defineConfig({
  integrations: [
    emailObfuscation({
      method: "rot18", // 'base64' | 'reverse' | 'deconstruct'
    }),
  ],
});
```

## Obfuscation Methods

### 1. ROT18 (default)

Applies ROT13 to letters and ROT5 to numbers:

```
user@domain.com → hjre@qbznva.pbz
```

- Most effective against simple scrapers
- Reversible with the same algorithm
- Click to reveal as mailto link

### 2. Base64

Encodes emails in Base64:

```
user@domain.com → dXNlckBkb21haW4uY29t
```

- Standard encoding, easy to detect if known
- Click to reveal as mailto link

### 3. Reverse

Displays email backwards with CSS direction:

```
user@domain.com → moc.niamod@resu
```

- Visual obfuscation only
- Still readable by users with CSS
- No click required

### 4. Deconstruct

Splits email into individual characters:

```
user@domain.com → ["u","s","e","r","@","d","o","m","a","i","n",".","c","o","m"]
```

- Stored as JSON array
- Click to reveal as mailto link

## Options

```typescript
interface AstroEmailObfuscationOptions {
  /**
   * The obfuscation method to use
   * @default "rot18"
   */
  method?: "rot18" | "reverse" | "base64" | "deconstruct";

  /**
   * Whether to process emails in development mode
   * @default false
   */
  dev?: boolean;

  /**
   * CSS selector for elements that should NOT be obfuscated
   * @default ".no-obfuscate"
   */
  excludeSelector?: string;

  /**
   * Custom placeholder text for clickable obfuscated emails
   * @default "[Click to reveal email]"
   */
  placeholder?: string;
}
```

## CSS Styling

The integration applies minimal inline styles and relies on your CSS for
styling. Add this CSS to style obfuscated email elements:

```css
.rot18-email,
.b64-email,
.deconstructed-email {
  cursor: pointer;
}

.rot18-email:hover,
.b64-email:hover,
.deconstructed-email:hover {}

/* Reverse emails are styled inline with CSS direction */
.reverse-email {
  font-family: monospace;
}
```

## Security Notes

- **ROT18**: Effective against basic scrapers, but easy to decode if the method
  is known
- **Base64**: Standard encoding, detectable by sophisticated crawlers
- **Reverse**: Visual only, text-based scrapers can still extract emails
- **Deconstruct**: JSON format may be obvious to advanced parsers

All methods remove `mailto:` links to prevent direct harvesting. The integration
processes HTML after build, so emails in source code remain hidden.

## Compatibility

- **Astro**: 5.0.0+ (Tested only on Astro 5.8 and above)
- **Browsers**: All modern browsers with **JavaScript enabled**

## Development

The integration skips processing in development mode by default. Set `dev: true`
to enable processing during development.

## Attributions

[astro-mail-obfuscation]: https://github.com/andreas-brunner/astro-mail-obfuscation

`astro-email-obfuscation` is based roughly on [astro-mail-obfuscation] by
Andreas Brunner. While this plugin has been built from ground up to fit my own
needs, and to avoid relying on 3rd party packages where possible, it was a good
reference that came in handy in the design of this plugin, even though most of
the code is entirely different. Thank you!

[this post detailing e-mail obfuscation]: https://spencermortensen.com/articles/email-obfuscation/

In alter revisions, available obfuscation methods have been revised to follow
[this post detailing e-mail obfuscation]. Some of the methods found here were
discussed prior with [@outfoxxed](https://github.com/outfoxxed), but I have
learned a lot about e-mail obfuscation, and the statistics have been helpful in
choosing supported methods.astro-mail-obfuscation) by Andreas Brunner, though it
has been completely rewritten to fit specific needs and avoid external
dependencies.
