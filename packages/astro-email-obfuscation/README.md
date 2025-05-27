# Astro Email Obfuscation

An Astro integration that obfuscates email addresses in your built HTML files to
protect them from scrapers and spam bots. Features advanced obfuscation methods
with layered defense capabilities, based on empirical testing[^1] for maximum
effectiveness.

[^1]: I tested it on my own setup, hope it counts.

## Features

- **Several obfuscation methods**: ROT18, JavaScript concatenation, SVG
  rendering, CSS hiding, and more
- **Method chaining**: Apply multiple obfuscation techniques in sequence for
  layered defense
- **Selective targeting**: Process email text, mailto links, or both
- **Accessibility focused**: Screen reader compatible with proper ARIA labels
  and fallbacks
- **Zero runtime overhead**: Build-time processing for static sites
- **Customizable**: Exclude elements, customize placeholders, and configure
  behavior
- **Development friendly**: Skip obfuscation in development mode for rapid
  iteration

## Installation

```bash
npm install astro-email-obfuscation
```

## Quick Start

Add the integration to your `astro.config.ts`:

```typescript
import { defineConfig } from "astro/config";
import emailObfuscation from "astro-email-obfuscation";

export default defineConfig({
  integrations: [
    emailObfuscation({
      methods: ["rot18"], // Single method
      target: "both", // Process text and links
    }),
  ],
});
```

## Advanced Configuration

```typescript
export default defineConfig({
  integrations: [
    emailObfuscation({
      // Multiple methods for layered defense
      methods: ["js-interaction", "rot18"],

      // Control what to process
      target: "both", // "text" | "link" | "both"

      // Server redirect for ultimate protection
      redirectBaseUrl: "/api/email-redirect",

      // Accessibility and UX
      placeholder: "📧 Click to reveal email",
      includeFallbacks: true,

      // Development and exclusions
      dev: false,
      excludeSelector: ".no-obfuscate",
    }),
  ],
});
```

## Obfuscation Methods

Methods are ranked by effectiveness based on empirical testing:

### High Effectiveness (JavaScript-based)

#### 1. `rot18` - ROT13+ROT5 Encoding

```
user@domain.com → hjre@qbznva.pbz
```

- **Bot resistance**: High (requires JS decoding)
- **Screen reader compatibility**: Excellent (with fallbacks)
- **Crawler resistance**: High
- **User experience**: Click to reveal

#### 2. `js-concat` - Dynamic Assembly

```html
<!-- Dynamically assembles email using JavaScript -->
<span data-p1="user" data-p2="domain.com">Click to reveal</span>
```

- **Bot resistance**: Very High (dynamic assembly)
- **Screen reader compatibility**: Good (with ARIA)
- **Crawler resistance**: Very High

#### 3. `js-interaction` - User Action Required

```html
<!-- Requires double-click confirmation -->
<span>Click to reveal email</span>
```

- **Bot resistance**: Very High (user interaction required)
- **Screen reader compatibility**: Excellent
- **Crawler resistance**: Very High

#### 4. `svg` - SVG Text Rendering

```html
<svg>
  <text>u</text>
  <text>s</text>
  <text>e</text>
  <text>r</text>...
</svg>
```

- **Bot resistance**: High (SVG parsing uncommon)
- **Screen reader compatibility**: Good (with ARIA)
- **Crawler resistance**: High

#### 5. `css-hidden` - CSS Manipulation

```html
<span>
  <span style="display: none">u</span>
  <span style="display: none">s</span>
  <!-- Click reveals all characters -->
</span>
```

- **Bot resistance**: High (CSS+JS parsing required)
- **Screen reader compatibility**: Good
- **Crawler resistance**: High

#### 6. `http-redirect` - Server-side Protection

```html
<a href="/api/email-redirect?e=dXNlckBkb21haW4uY29t">Contact</a>
```

### Moderate Effectiveness (Better when combined)

#### 7. `reverse` - String Reversal

```
user@domain.com → moc.niamod@resu
```

- **Bot resistance**: Low-Medium (easily reversible)
- **Screen reader compatibility**: Poor (reads backwards)
- **Best used**: In combination with other methods

#### 8. `base64` - Base64 Encoding

```
user@domain.com → dXNlckBkb21haW4uY29t
```

- **Bot resistance**: Low-Medium (easily decoded)
- **Screen reader compatibility**: Poor (gibberish)
- **Best used**: In combination with other methods

#### 9. `deconstruct` - Character Array

```html
<span data-parts='["u","s","e","r","@","d","o","m","a","i","n",".","c","o","m"]'>
```

- **Bot resistance**: Low-Medium (simple joining)
- **Screen reader compatibility**: Poor
- **Best used**: In combination with other methods

## Method Chaining

Combine multiple methods for maximum protection:

```typescript
emailObfuscation({
  // Apply methods in sequence
  // Each adds a layer of protection
  methods: ["js-interaction", "rot18"],

  // Or create a "fortress" of obfuscation
  methods: ["css-hidden", "js-concat", "base64"],
});
```

**Recommended combinations:**

- `["js-interaction", "rot18"]` - Double security with great UX
- `["css-hidden", "js-concat"]` - Visual + dynamic protection
- `["svg", "js-interaction"]` - Crawler-resistant + user-verified

## Processing Targets

Control what gets obfuscated:

```typescript
emailObfuscation({
  target: "text", // Only standalone email text
  target: "link", // Only mailto: links
  target: "both", // Both text and links (default)
});
```

## Server-side Redirect Setup

For `http-redirect` method, implement a server endpoint:

```javascript
// /api/email-redirect.js (Astro API route)
export async function GET({ url }) {
  const encoded = url.searchParams.get("e");
  if (!encoded) return new Response("Invalid request", { status: 400 });

  try {
    const email = atob(encoded);
    return Response.redirect(`mailto:${email}`);
  } catch {
    return new Response("Invalid email", { status: 400 });
  }
}
```

## Accessibility Features

The integration includes comprehensive accessibility support:

- **ARIA labels**: Proper screen reader announcements
- **Keyboard navigation**: Tab and Enter key support
- **Focus management**: Clear visual indicators
- **Fallbacks**: `<noscript>` alternatives when enabled
- **Reduced motion**: Respects user preferences

## Excluding Elements

Prevent obfuscation on specific elements:

```html
<!-- This email won't be obfuscated -->
<span class="no-obfuscate">admin@example.com</span>

<!-- Custom exclude selector -->
<div class="keep-plain">contact@company.com</div>
```

```typescript
emailObfuscation({
  excludeSelector: ".keep-plain",
});
```

## Development Mode

Skip obfuscation during development:

```typescript
emailObfuscation({
  dev: process.env.NODE_ENV === "development",
});
```

## Configuration Options

| Option             | Type       | Default                     | Description                                      |
| ------------------ | ---------- | --------------------------- | ------------------------------------------------ |
| `methods`          | `string[]` | `["rot18"]`                 | Array of obfuscation methods to apply            |
| `method`           | `string`   | -                           | ⚠️ **Deprecated**: Use `methods` array instead   |
| `target`           | `string`   | `"both"`                    | What to process: `"text"`, `"link"`, or `"both"` |
| `dev`              | `boolean`  | `false`                     | Enable obfuscation in development mode           |
| `excludeSelector`  | `string`   | `".no-obfuscate"`           | CSS selector for elements to skip                |
| `placeholder`      | `string`   | `"[Click to reveal email]"` | Text shown for clickable emails                  |
| `redirectBaseUrl`  | `string`   | `"/api/email-redirect"`     | Base URL for http-redirect method                |
| `includeFallbacks` | `boolean`  | `true`                      | Include `<noscript>` fallbacks for accessibility |

## Examples

### Basic protection

```typescript
emailObfuscation({
  methods: ["rot18"],
});
```

### High security

```typescript
emailObfuscation({
  methods: ["js-interaction", "css-hidden"],
  placeholder: "🔒 Secure email - click to access",
});
```

### Enterprise setup

```typescript
emailObfuscation({
  methods: ["http-redirect"],
  redirectBaseUrl: "https://api.company.com/email",
  target: "both",
  excludeSelector: ".public-email",
});
```

## Browser Support

- **Modern browsers**: Full support with all features
- **Legacy browsers**: Graceful degradation with fallbacks
- **No JavaScript**: `<noscript>` alternatives (when enabled)
- **Screen readers**: Full compatibility with ARIA labels

## Security Considerations

1. **No method is 100% secure** - Determined scrapers can defeat any client-side
   protection
2. **Layer your defenses** - Use multiple methods for best results
3. **Server-side is strongest** - `http-redirect` provides the best protection
4. **Monitor and adapt** - Update methods as scraping techniques evolve
5. **Balance UX and security** - Consider your users' needs

## Performance

- **Build time**: Minimal impact, processes files once
- **Runtime**: Zero overhead for static methods
- **Bundle size**: ~2KB for decoder script
- **Accessibility**: No impact on screen readers

## How It Works

1. **Build-time processing**: Scans HTML files after Astro build
2. **Email detection**: Uses regex to find email addresses in text and mailto
   links
3. **Method chaining**: Applies obfuscation methods in sequence
4. **Script injection**: Adds decoder JavaScript to processed pages
5. **Client-side reveal**: Users can interact to reveal real email addresses

## Compatibility

- **Astro**: 5.0.0+ (Tested on Astro 5.8+)
- **Browsers**: All modern browsers with JavaScript enabled

## Attributions

This plugin draws inspiration from:

- [astro-mail-obfuscation](https://github.com/andreas-brunner/astro-mail-obfuscation)
  by Andreas Brunner
- [Email obfuscation research](https://spencermortensen.com/articles/email-obfuscation/)
  by Spencer Mortensen

While built from the ground up with my own needs in mind, and with the primary
goal of avoiding dependencies on 3rd party integrations for small tasks, these
resources have provided valuable insights into email obfuscation techniques and
best practices. As such, I owe both of those authors a very big thank you.
