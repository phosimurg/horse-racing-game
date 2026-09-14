---
paths:
  - 'src/**/*.vue'
  - 'src/styles/**'
---

# Style rules

- Use design tokens (`var(--...)` from `src/styles/tokens.css`) for color, spacing, typography, radius, elevation, z-index and motion; never a raw value when a token exists.
- Component styles are scoped. Global styles live in the cascade layers `reset`, `tokens`, `base`, `layout`, `components`, `utilities`.
- Use logical properties such as `margin-inline`, `padding-block` and `inset-inline-start`.
- Animate only `transform` and `opacity`. Put non-essential motion inside `@media (prefers-reduced-motion: no-preference)`.
- Hover effects go inside `@media (hover: hover)`; every interactive element styles `:focus-visible`.
- Contrast is at least 4.5:1 for text and 3:1 for UI components and focus indicators in both themes; `forced-colors` mode stays usable.
- Never use `!important`.
