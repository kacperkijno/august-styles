# august-styles

CSS overrides for systeme.io pages — August Kjerland brand system.
Served via jsDelivr CDN.

## Files

- `lesson.css` — lesson page styling (scope: `body.ak-lesson`)

## Usage

Add to systeme.io page tracking code or HTML element widget:

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/kacperkijno/august-styles@main/lesson.css">
<script>document.body.classList.add('ak-lesson');</script>
```

Cache bust after edits by appending `?v=2`, `?v=3` etc. — or pin to a commit hash instead of `@main` for stability.

## Brand tokens

| Token | HEX |
|---|---|
| Forest | #1A3C2F |
| Cream | #F9F7F1 |
| Cream soft | #F3F0E7 |
| Terracotta | #B46A3C |
| Terracotta dark | #9A5832 |
| Warm cream | #E4B68A |
| Ink | #2D2D2D |
