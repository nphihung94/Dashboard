# Typography — Base.vn Design System V0.2

## Font Family
- Primary: System UI stack → `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif`
- Monospace: `"SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace`

## Type Scale (px only — no rem/em)

| Role | Size | Weight | Line Height |
|---|---|---|---|
| Display Large | 32px | 700 | 40px |
| Display Medium | 28px | 700 | 36px |
| Heading 1 | 24px | 700 | 32px |
| Heading 2 | 20px | 600 | 28px |
| Heading 3 | 16px | 600 | 24px |
| Heading 4 | 14px | 600 | 20px |
| Body Large | 16px | 400 | 24px |
| Body Medium | 14px | 400 | 20px |
| Body Small | 12px | 400 | 18px |
| Label Large | 14px | 500 | 20px |
| Label Medium | 12px | 500 | 16px |
| Label Small | 11px | 500 | 16px |
| Caption | 12px | 400 | 16px |
| Code | 13px | 400 | 20px |

## Font Weights
- 400 — Regular (body text, captions)
- 500 — Medium (labels, secondary emphasis)
- 600 — Semibold (headings h3–h4, buttons)
- 700 — Bold (headings h1–h2, display)

## Text Color Tokens

| Usage | Token | Value |
|---|---|---|
| Primary text | `--color-neutral-text-1-default` | #343434 |
| Secondary text | `--color-neutral-text-2-default` | #5B5B5B |
| Tertiary text | `--color-neutral-text-3-default` | #757575 |
| Placeholder | `--color-neutral-text-4-default` | #8F8F8F |
| Brand/link | `--color-neutral-text-brand-default` | #1E88E5 |
| Disabled | `--color-neutral-text-disable` | #C2C2C2 |
| On brand bg | `--color-brand-text-1-default` | #FFFFFF |

## CSS Conventions for Typography

```css
/* ✅ CORRECT */
.card__title {
  font-size: 16px;
  font-weight: 600;
  line-height: 24px;
  color: var(--color-neutral-text-1-default);
}

.card__description {
  font-size: 14px;
  font-weight: 400;
  line-height: 20px;
  color: var(--color-neutral-text-2-default);
}

/* ❌ ERROR — using rem */
.card__title {
  font-size: 1rem; /* must be px */
}

/* ❌ ERROR — hardcoded color */
.card__description {
  color: #5B5B5B; /* must use token */
}
```

## Rules (ERROR if violated)
- Always use `px` for `font-size` and `line-height`.
- Never use `em` or `rem` for typography.
- Color must always use `var(--color-neutral-text-*)` or `var(--color-brand-text-*)`.
- Do not use `text-transform: uppercase` without explicit design direction.
- Minimum font size: 11px (Label Small) — never go below this.
- Always pair `font-size` with `line-height` — never set one without the other.
