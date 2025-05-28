# remark-em-dash

A [remark](https://github.com/remarkjs/remark) plugin to convert double and
triple dashes to proper en and em dashes in markdown.

## Installation

```bash
npm install remark-em-dash
```

## Usage

```javascript
import { remark } from "remark";
import remarkEmDash from "remark-em-dash";

const processor = remark().use(remarkEmDash);

const markdown =
  "Pages 10--20 contain the main content --- the best part of the book.";
const result = await processor.process(markdown);

console.log(result.toString());
// Pages 10–20 contain the main content — the best part of the book.
```

## What it does

This plugin converts:

- `--` (double dash) → `–` (en dash)
- `---` (triple dash) → `—` (em dash)
- `--` (spaces around double dash) → `–` (spaced en dash)
- `---` (spaces around triple dash) → `—` (spaced em dash)

## Safety features

- Does not convert frontmatter delimiters (`---` at the start of files)
- Does not convert sequences of 4 or more dashes (`----`)
- Uses negative lookahead/lookbehind to prevent unintended conversions

## License

MIT
