---
name: base-vn-ui-design
description: >
  Apply Base.vn design system rules when building, reviewing, or critiquing any web UI component,
  page, or CSS file. Use this skill whenever the user asks to: create a UI component, write a CSS
  file, review existing HTML/CSS code for design issues, design a layout or page, produce pixel-perfect
  UI following design tokens, or asks about UX patterns, spacing, color usage, or component structure.
  Always trigger this skill for any task that involves writing or evaluating CSS, HTML layout,
  component design, icon usage, or visual design decisions — even if the user doesn't explicitly
  mention "Base.vn" or "design system". This skill is the single source of truth for all UI/CSS work.
---

# Base.vn UI Design Skill

This skill encodes the Base.vn Design System V0.2 rules for building pixel-perfect, consistent web UIs using plain HTML + external CSS files.

## Table of Contents
- [File Structure Rules](#file-structure)
- [CSS Macro System](#macro-system)
- [CSS Coding Conventions](#css-conventions)
- [BEM Naming](#bem-naming)
- [Design Tokens (CSS Variables)](#design-tokens)
- [Spacing & Layout](#spacing-layout)
- [Typography](#typography)
- [Color Usage](#color-usage)
- [Icons](#icons)
- [UX Review Rules](#ux-review)
- [Reference Files](#reference-files)

---

## File Structure Rules {#file-structure}

Every component lives in its own folder with two sub-folders:

```
component-name/
├── js/
│   └── component-name.js
└── css/
    └── component-name.css
```

**Rules (ERROR if violated):**
- CSS must NEVER be written inline in HTML. All styles go in the `/css/` file.
- Global design tokens live in a single `tokens.css` file at the project root, imported first.
- No `style=""` attributes anywhere in HTML — ever.
- Import order in HTML: `tokens.css` → component CSS → other CSS.

---

## CSS Macro System {#macro-system}

This codebase uses a **custom CSS preprocessor**. All CSS files use two shorthand syntaxes. **Always write new CSS using these macros — never write the expanded raw CSS when a macro exists.**

For the full macro table, read `references/macros.md`. Key rules:

### `@macroName` — Inline expansion (from `config.css`)

```css
/* ❌ ERROR — raw CSS when macro exists */
position: absolute;
display: none;
cursor: pointer;
overflow: hidden;

/* ✅ CORRECT — use macros */
@absolute;
@hidden;
@pointer;
@xo;
```

**Most used macros quick reference:**

| Macro | Meaning |
|---|---|
| `@absolute` / `@relative` / `@fixed` | position |
| `@absfull` | position:absolute + top/left/right/bottom:0 |
| `@fit` | top/left/right/bottom: 0 (use with @absolute) |
| `@block` / `@hidden` / `@inline` / `@flex` / `@iflex` | display |
| `@left` / `@right` | float |
| `@xo` / `@clear` | overflow: hidden |
| `@pointer` | cursor: pointer |
| `@center` / `@tleft` / `@tright` | text-align |
| `@bold` / `@normal` / `@thick` / `@mthick` / `@thin` | font-weight |
| `@f11` … `@f32` | font-size (e.g. `@f14` = `font-size:14px`) |
| `@arial` / `@tahoma` / `@mono` | font-family |
| `@upper` / `@underline` / `@italic` | text decoration/transform |
| `@vcenter` / `@vtop` | vertical-align |
| `@borderbox` | box-sizing: border-box |
| `@nobreak` | white-space: nowrap |
| `@apxdot` | text-overflow: ellipsis |
| `@rounded` | border-radius: 3px |
| `@circle` | border-radius: 50% |

Macros can be **chained**: `@absolute @pointer @f13 @bold;`

### `$property` — Dollar shorthand properties

```css
/* ❌ ERROR — longhand when shorthand exists */
background-color: #fff;
border: 1px solid #ccc;
border-radius: 4px;

/* ✅ CORRECT — use dollar shorthands */
$bg: #fff;
$stroke: #ccc;
$corner: 4px;
```

**Most used dollar shorthands:**

| Shorthand | Meaning |
|---|---|
| `$bg: #color` | background-color |
| `$bg: #color 0.5` | background-color with opacity |
| `$bg: @main` / `$bg: @red` / `$bg: @error` | theme variable backgrounds |
| `$stroke: #color` | border: 1px solid |
| `$stroke: Npx #color` | border: Npx solid |
| `$istroke: #color` | inner/inset border |
| `$corner: Npx` | border-radius |
| `$top/bottom/left/right: #color` | single-side borders |
| `$shadow: Npx #color` | box-shadow |
| `$mshadow: Npx #color` | elevated/modal box-shadow |
| `$glow: Npx #color` | outer glow shadow |
| `$transition: prop duration` | transition |
| `$opacity: 0.N` | opacity (with IE filter) |
| `$tshadow: Npx #color` | text-shadow |

### Color inline syntax

```css
@#fff;              /* color: #fff */
@#333;              /* color: #333 (any hex) */
@@error;            /* color: var(--error-color) */
@@red;              /* color: var(--red-color) */
$bg: @error 0.1;   /* background at 10% opacity using theme var */
$bg: @main;        /* background using brand primary */
<@main -95 60>     /* color manipulation: darken @main */
```

### Combining macros + tokens

Use macros for display/position/font helpers, dollar shorthands for borders/bg/radius, and `var(--token)` for Base.vn spacing and color tokens:

```css
/* ✅ CORRECT — full pattern */
.button--primary {
    @iflex @pointer;
    align-items: center;
    gap: var(--gap-horizontal-h-xsmall);
    padding: var(--gap-padding-p-3xsmall) var(--gap-padding-p-large);
    $corner: 8px;
    $bg: var(--color-brand-background-1-default);
    @f14 @bold;
    @#fff;
    $transition: background-color 0.15s;

    :hover {
        $bg: var(--color-brand-background-1-hover);
    }
    :disabled, &.button--disabled {
        $bg: var(--color-brand-background-disable);
        color: var(--color-neutral-text-disable);
        cursor: not-allowed;
    }
}
```

---

## CSS Coding Conventions {#css-conventions}

**All of these are ERRORS — must fix:**

1. **No magic numbers.** Every value must reference a CSS custom property or macro. Exception: `0`, `1`, `100%`, `auto`, `none`.

2. **Always use pixels.** Never use `rem`, `em`, `%` for spacing or font sizes (except `100%` for full-width containers).

3. **No inline styles.** Never write `style=""` on any HTML element.

4. **Max nesting depth: 3 levels.** CSS selectors must not go deeper than 3 levels.

5. **Always use macros when available.** Never write the raw CSS expansion of a macro.
   ```css
   /* ❌ ERROR */
   position: absolute;
   display: none;
   overflow: hidden;
   /* ✅ CORRECT */
   @absolute;
   @hidden;
   @xo;
   ```

6. **Always use dollar shorthands for borders, bg, radius, shadow.**
   ```css
   /* ❌ ERROR */
   background-color: #fff;
   border: 1px solid #ccc;
   border-radius: 4px;
   /* ✅ CORRECT */
   $bg: #fff;
   $stroke: #ccc;
   $corner: 4px;
   ```

7. **Always use CSS custom properties for every token value.** Never hardcode color hex values, spacing numbers, or radius values that have a token defined.

---

## BEM Naming {#bem-naming}

Use strict BEM: `block__element--modifier`.

```css
/* Block */
.button { }

/* Element */
.button__icon { }
.button__label { }

/* Modifier */
.button--primary { }
.button--disabled { }
.button--size-medium { }

/* Element + Modifier */
.button__label--truncated { }
```

**Rules (ERROR if violated):**
- Class names must be lowercase, hyphen-separated words only.
- No camelCase, no underscores except BEM double-underscore/double-hyphen.
- Block name must match the component folder name.
- State classes use modifiers: `--hover`, `--active`, `--disabled`, `--selected`, `--pressed`.
- Never use element tags as selectors alone (e.g., `div { }`, `span { }`) — always scoped to a BEM class.

---

## Design Tokens {#design-tokens}

Read `references/tokens.css` for the full variable definitions to paste into `tokens.css`.

**Quick reference — token categories:**
- `--spacing-*` — global spacing scale (0–32px)
- `--gap-vertical-*`, `--gap-horizontal-*`, `--gap-padding-*` — semantic spacing aliases
- `--radius-*` — border radius scale
- `--color-neutral-*` — neutral backgrounds, strokes, text, icons
- `--color-brand-*` — brand blue backgrounds, strokes, text, icons
- `--color-status-critical-*` — error/critical states
- `--color-status-success-*` — success states
- `--color-status-attention-*` — attention/yellow states
- `--color-status-warning-*` — warning/orange states
- `--color-status-info-*` — info/blue states

**Token naming pattern:**
`--color-{category}-{type}-{variant}-{state}`

Example: `--color-brand-background-1-default`, `--color-status-critical-text-1-hover`

---

## Spacing & Layout {#spacing-layout}

**Spacing scale (all values in px — always use the token variable):**

| Token | Value |
|---|---|
| `--spacing-0` | 0px |
| `--spacing-2` | 2px |
| `--spacing-4` | 4px |
| `--spacing-6` | 6px |
| `--spacing-8` | 8px |
| `--spacing-10` | 10px |
| `--spacing-12` | 12px |
| `--spacing-16` | 16px |
| `--spacing-20` | 20px |
| `--spacing-24` | 24px |
| `--spacing-32` | 32px |

Use semantic aliases:
- Vertical gaps: `var(--gap-vertical-v-{size})`
- Horizontal gaps: `var(--gap-horizontal-h-{size})`
- Padding: `var(--gap-padding-p-{size})`

**Border Radius:**

| Token | Value |
|---|---|
| `--radius-r-none` | 0px |
| `--radius-r-small` | 2px |
| `--radius-r-xsmall` | 4px |
| `--radius-r-2xsmall` | 6px |
| `--radius-r-3xsmall` | 8px |
| `--radius-r-medium` | 12px |
| `--radius-r-large` | 16px |
| `--radius-r-xlarge` | 9999px (pill) |

**Layout rules (ERROR if violated):**
- All spacing must snap to the token scale. No values outside: 0, 2, 4, 6, 8, 10, 12, 16, 20, 24, 32px.
- Use Flexbox or Grid — never use `float` for layout.
- Gaps between sibling elements use `gap` property with `var(--gap-*)` tokens, not margins.

---

## Typography {#typography}

Typography tokens are defined in `references/typography.md`. Key rules:

- Font sizes must use px values from the defined scale.
- Line heights must use px or unitless values from the scale.
- Text colors must use `--color-neutral-text-*` or `--color-brand-text-*` tokens — never hardcoded hex.
- Use `font-weight` values: 400 (regular), 500 (medium), 600 (semibold), 700 (bold).

**Text hierarchy:**
- Primary text: `var(--color-neutral-text-1-default)` → `#343434`
- Secondary text: `var(--color-neutral-text-2-default)` → `#5B5B5B`
- Tertiary text: `var(--color-neutral-text-3-default)` → `#757575`
- Placeholder/disabled: `var(--color-neutral-text-4-default)` → `#8F8F8F`
- Brand/link: `var(--color-neutral-text-brand-default)` → `#1E88E5`
- Disabled: `var(--color-neutral-text-disable)` → `#C2C2C2`

---

## Color Usage {#color-usage}

See `references/colors.md` for the full color reference.

**Rules (ERROR if violated):**
- Never hardcode a hex value that has a design token — always use `var(--color-*)`.
- Match state variants correctly: `-default`, `-hover`, `-pressed`, `-selected`, `-disable`.
- For interactive elements, define all 4 states: default, hover, pressed/active, disabled.
- Brand primary: `#1E88E5` → always use `var(--color-brand-background-1-default)`.
- Disabled background: `var(--color-neutral-background-disable)` → `#F0F0F0`.
- Disabled text: `var(--color-neutral-text-disable)` → `#C2C2C2`.

**Status color mapping:**
- Critical/Error → `--color-status-critical-*`
- Success → `--color-status-success-*`
- Warning/Orange → `--color-status-warning-*`
- Attention/Yellow → `--color-status-attention-*`
- Info/Blue → `--color-status-info-*`

---

## Icons {#icons}

**Rules (ERROR if violated):**
- All icons MUST be SVG — never use icon fonts, PNG, JPG, or GIF.
- Icon sizes must follow the 4px scale: 16px, 20px, 24px, 28px, 32px.
- Common icon sizes: `20px` (small/inline), `24px` (default/standard).
- Icon color must be set via CSS using `color` + `fill: currentColor` or `stroke: currentColor` on the SVG — never hardcoded fill attributes in SVG markup.
- Icon container must be sized explicitly with `width` and `height` matching the icon size token.
- Icons must be pixel-perfect: viewBox must match the design dimensions; no fractional pixel values.

```css
/* ✅ CORRECT icon sizing */
.button__icon {
  width: 20px;
  height: 20px;
  color: var(--color-brand-icon-default);
}

/* SVG inline uses currentColor */
/* <svg viewBox="0 0 20 20" fill="none" ...>
     <path fill="currentColor" ... />
   </svg> */
```

---

## UX Review Rules {#ux-review}

When reviewing existing code, categorize findings as:

### 🔴 ERROR — Must Fix
- Any hardcoded color hex that has a token equivalent
- Any hardcoded spacing value not on the token scale
- Inline styles (`style=""`)
- CSS nesting deeper than 3 levels
- Non-BEM class names
- Non-SVG icons
- Missing interactive states (hover, pressed, disabled) on interactive elements
- Magic pixel values not from the token scale
- Icon sizes not on the 4px scale
- **Using raw `position: absolute` instead of `@absolute`**
- **Using raw `display: none` instead of `@hidden`**
- **Using raw `display: inline-block` instead of `@inline`**
- **Using raw `overflow: hidden` instead of `@xo`**
- **Using raw `cursor: pointer` instead of `@pointer`**
- **Using raw `background-color:` instead of `$bg:`**
- **Using raw `border:` instead of `$stroke:`**
- **Using raw `border-radius:` instead of `$corner:`**
- **Using raw `box-shadow:` instead of `$shadow:` / `$mshadow:` / `$glow:`**
- **Writing `float: left` instead of `@left`**

### ✅ Review Output Format

For each error found, report:
```
[ERROR] <location> — <what's wrong>
Fix: <exact correction>
```

Example:
```
[ERROR] .card CSS — hardcoded color #1E88E5
Fix: Replace with var(--color-brand-background-1-default)

[ERROR] .dialog CSS — raw position: absolute
Fix: Replace with @absolute;

[ERROR] .button HTML — inline style="padding: 14px 20px"
Fix: Remove inline style; add to button.css using var(--gap-padding-p-xlarge) and var(--gap-padding-p-3xlarge)

[ERROR] .modal CSS — raw background-color: #000
Fix: Replace with $bg: #000 0.6;
```

---

## Reference Files {#reference-files}

Read these when you need full details:

- **`references/macros.md`** — Complete macro table with all `@macroName` and `$shorthand` definitions, usage patterns, and real codebase examples. Read when writing any new CSS or reviewing existing CSS for macro violations.
- **`references/config.css`** — Source of truth for all `@define` macro definitions. Read when unsure what a specific macro expands to.
- **`references/tokens.css`** — Complete CSS custom properties file, ready to paste. Read when generating a `tokens.css` file or checking exact token values.
- **`references/colors.md`** — Full color token table organized by category. Read when working with color decisions or reviewing color usage.
- **`references/typography.md`** — Type scale, font weights, line heights. Read when working with text styles.
- **`references/animation.css`** — Keyframe definitions (`spin`, `leftright`). Read when adding animations.
