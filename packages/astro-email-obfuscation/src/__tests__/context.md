# Testing Context for astro-email-obfuscation

## Project Overview
- **Package**: `astro-email-obfuscation` (v2.0.3)
- **Purpose**: Astro integration for email obfuscation with multiple methods
- **Testing Framework**: Vitest v3.2.2
- **Location**: `/packages/astro-email-obfuscation/`

## Key Components to Test

### 1. Core Functionality
- Default export function `astroEmailObfuscation()`
- Options handling (legacy `method` vs new `methods` array)
- Configuration validation
- Astro integration hooks

### 2. Obfuscation Methods (9 total)
1. **rot18** - ROT13+ROT5 encoding (high effectiveness)
2. **js-concat** - JavaScript concatenation (very high effectiveness)
3. **js-interaction** - User interaction required (very high effectiveness)
4. **svg** - SVG rendering (high effectiveness)
5. **css-hidden** - CSS manipulation (high effectiveness)
6. **http-redirect** - Server-side redirect (very high effectiveness)
7. **reverse** - String reversal (moderate effectiveness)
8. **base64** - Base64 encoding (moderate effectiveness)
9. **deconstruct** - Character array splitting (moderate effectiveness)

### 3. Utility Functions
- `rot18()` - ROT18 encoding implementation
- `base64Encode()` - Base64 encoding
- `deconstructEmail()` - Email splitting
- `reverseEmail()` - Email reversal
- `escapeHtml()` - HTML escaping for XSS prevention
- `generateUniqueId()` - Deterministic ID generation

### 4. Content Processing
- `processHTMLContent()` - Main HTML processing function
- Email regex matching
- Target filtering (text, link, both)
- Exclude selector handling
- Double-processing prevention

### 5. Integration Features
- Astro hooks: `astro:config:setup`, `astro:config:done`, `astro:build:done`
- Configuration validation
- File processing in build
- Decoder script injection

## Testing Strategy

### Phase 1: Basic Functionality (CURRENT)
- Simple smoke test to verify tooling
- Basic option parsing
- Default configuration

### Phase 2: Unit Tests
- Individual obfuscation methods
- Utility functions
- Configuration validation
- Error handling

### Phase 3: Integration Tests
- HTML content processing
- Astro integration hooks
- File processing workflow

### Phase 4: Edge Cases & Error Scenarios
- Invalid email formats
- XSS prevention
- Configuration edge cases
- File system errors

## Important Notes
- Repository owner is "pedantic psychopath" - keep tests organized and clean
- Use existing Vitest setup - config already in place
- Follow monorepo structure - tests in `src/__tests__/`
- Maintain consistency with existing test patterns
- Focus on comprehensive coverage but start small

## Dependencies & Setup
- Uses Node.js Buffer for base64 encoding
- Requires fs.promises for file operations
- Astro integration interface
- External decoder.js script for client-side decoding

## Key Edge Cases to Consider
- Invalid email formats
- Missing @domain parts
- XSS injection attempts
- Large files processing
- Concurrent builds
- Development vs production modes
- Missing decoder script scenarios
