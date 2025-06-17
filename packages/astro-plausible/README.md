# astro-plausible

An Astro integration for adding [Plausible Analytics](https://plausible.io/) to
your website. Refactored out of my website for a more generic and reusable
approach.

## Highlights

- Disables tracking and provides console logging during development
- Supports all
  [Plausible script extensions](https://plausible.io/docs/script-extensions)
  including outbound links, file downloads, 404 tracking, hash-based routing,
  custom events, custom properties, and ecommerce
- (Optionally) Serve the tracking script using
  [Partytown](https://partytown.qwik.dev/)
- Works with self-hosted Plausible instances

## Usage

```typescript
import plausible from "astro-plausible";

export default defineConfig({
  integrations: [
    plausible({ domain: "example.com" }),
  ],
});
```

## Options

### Basic Setup

```js
plausible({
  domain: "example.com",
});
```

### Multiple Domains

```js
plausible({
  domain: "example.com,app.example.com",
});
```

### Self-hosted Plausible

```js
plausible({
  domain: "example.com",
  src: "https://analytics.example.com/js/script.js",
  apiHost: "https://analytics.example.com/api/event",
});
```

### With Enhanced Tracking

```js
plausible({
  domain: "example.com",
  trackOutboundLinks: true,
  trackFileDownloads: true,
  track404: true,
  enableCustomEvents: true,
});
```

### With Partytown

```js
plausible({
  domain: "example.com",
  withPartytown: true,
});
```

### Advanced Configuration

```js
plausible({
  domain: "example.com",
  trackOutboundLinks: true,
  trackFileDownloads: true,
  additionalFileTypes: "js,py",
  excludePaths: ["/admin/*", "/dashboard/*"],
  allowedDomains: ["example.com", "www.example.com"],
  excludeHash: true,
  excludeSearch: true,
});
```

## Configuration Options

| Option                   | Type       | Default                               | Description                                                              |
| ------------------------ | ---------- | ------------------------------------- | ------------------------------------------------------------------------ |
| `domain`                 | `string`   | **required**                          | Your website domain(s). For multiple domains, use comma-separated values |
| `src`                    | `string`   | `"https://plausible.io/js/script.js"` | URL to the Plausible script                                              |
| `apiHost`                | `string`   | `"https://plausible.io/api/event"`    | API endpoint for your Plausible instance                                 |
| `trackOutboundLinks`     | `boolean`  | `false`                               | Enable automatic outbound link tracking                                  |
| `trackFileDownloads`     | `boolean`  | `false`                               | Enable automatic file download tracking                                  |
| `track404`               | `boolean`  | `false`                               | Enable 404 error page tracking                                           |
| `trackHashBasedRouting`  | `boolean`  | `false`                               | Enable hash-based routing tracking                                       |
| `enableCustomEvents`     | `boolean`  | `false`                               | Enable custom event tracking                                             |
| `enableCustomProperties` | `boolean`  | `false`                               | Enable custom properties tracking                                        |
| `enableEcommerce`        | `boolean`  | `false`                               | Enable ecommerce revenue tracking                                        |
| `customFileTypes`        | `string`   | `undefined`                           | Custom file types to track (overrides defaults)                          |
| `additionalFileTypes`    | `string`   | `undefined`                           | Additional file types to track (extends defaults)                        |
| `allowedDomains`         | `string[]` | `[]`                                  | Domains where tracking is allowed                                        |
| `excludePaths`           | `string[]` | `[]`                                  | Paths to exclude from tracking                                           |
| `excludeHash`            | `boolean`  | `false`                               | Exclude hash from URL tracking                                           |
| `excludeSearch`          | `boolean`  | `false`                               | Exclude search parameters from URL tracking                              |
| `manualMode`             | `boolean`  | `false`                               | Enable manual pageview triggering                                        |
| `withPartytown`          | `boolean`  | `false`                               | Load script via Partytown                                                |
