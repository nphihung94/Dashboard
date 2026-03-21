# CSS Macro System Reference

This codebase uses a **custom CSS preprocessor** with two shorthand syntaxes defined in `config.css` and used throughout all CSS files. Always write new CSS using these macros — never expand them back to raw CSS.

---

## 1. `@macroName` — Inline Macro Expansion

Macros are defined in `config.css` with `@define macroName { ... }` and called with `@macroName;` inline.

Multiple macros can be chained on one line: `@absolute @hidden @pointer;`

### Position & Display

| Macro | Expands to |
|---|---|
| `@absolute` | `position: absolute` |
| `@relative` | `position: relative` |
| `@fixed` | `position: fixed` |
| `@sticky` | `position: sticky` |
| `@absfull` | `position:absolute; top:0; left:0; right:0; bottom:0` |
| `@fit` | `top:0; left:0; bottom:0; right:0` |
| `@block` | `display: block` |
| `@hidden` | `display: none` |
| `@inline` | `display: inline-block` |
| `@flex` | `display: flex` |
| `@iflex` | `display: inline-flex` |
| `@cell` | `display: table-cell` |
| `@left` | `float: left` |
| `@right` | `float: right` |
| `@full` | `width:100%; height:100%` |
| `@fullw` | `width: 100%` |
| `@clear` | `overflow: hidden` |
| `@xo` | `overflow: hidden` |

### Alignment & Text

| Macro | Expands to |
|---|---|
| `@center` | `text-align: center` |
| `@tleft` | `text-align: left` |
| `@tright` | `text-align: right` |
| `@justify` | `text-align: justify` |
| `@vtop` | `vertical-align: top` |
| `@vcenter` | `vertical-align: middle` |
| `@upper` | `text-transform: uppercase` |
| `@underline` | `text-decoration: underline` |
| `@nobreak` | `white-space: nowrap` |
| `@breakword` | word-break + hyphens rules |
| `@apxdot` | `overflow:hidden; text-overflow:ellipsis; white-space:nowrap` |

### Font Weight & Style

| Macro | Expands to |
|---|---|
| `@bold` | `font-weight: bold` |
| `@normal` | `font-weight: normal` |
| `@thin` | `font-weight: 300` |
| `@thick` | `font-weight: 500` |
| `@mthick` | `font-weight: 600` |
| `@italic` | `font-style: italic` |

### Font Size (`@f10` through `@f60`)

| Macro | Expands to |
|---|---|
| `@f10` | `font-size: 10px` |
| `@f11` | `font-size: 11px` |
| `@f12` | `font-size: 12px` |
| `@f13` | `font-size: 13px` |
| `@f14` | `font-size: 14px` |
| `@f15` | `font-size: 15px` |
| `@f16` | `font-size: 16px` |
| `@f18` | `font-size: 18px` |
| `@f20` | `font-size: 20px` |
| `@f22` | `font-size: 22px` |
| `@f24` | `font-size: 24px` |
| `@f26` | `font-size: 26px` |
| `@f28` | `font-size: 28px` |
| `@f30` | `font-size: 30px` |
| `@f32` | `font-size: 32px` |
| (etc.) | full range f10–f60 |

### Font Family

| Macro | Font |
|---|---|
| `@arial` | Arial, sans-serif |
| `@tahoma` | Helvetica, Tahoma, Arial, sans-serif |
| `@mono` | Consolas, Courier New, monospace |
| `@myriad` | Myriad Pro, Arial, Helvetica, sans-serif |
| `@cambria` | Cambria, serif |
| `@lucida` | Lucida Sans Unicode, sans-serif |

### Misc

| Macro | Expands to |
|---|---|
| `@pointer` | `cursor: pointer` |
| `@borderbox` | `box-sizing: border-box` (with prefixes) |
| `@scroll` | `overflow-y: scroll; scrollbar-width: 8px` |
| `@rounded` | `border-radius: 3px` |
| `@circle` | `border-radius: 50%` |
| `@cover` | `background-size: cover` (with prefixes) |
| `@noshadow` | `box-shadow: none` (all prefixes) |
| `@xinput` | bare input reset (no padding, border, bg) |
| `@finput` | full-width block input with border-box |
| `@content` | `content: ""` |

---

## 2. `$property` — Dollar Shorthand Properties

Dollar shorthands are custom property aliases that expand to one or more CSS declarations.

### Common Dollar Shorthands

| Shorthand | Expands to |
|---|---|
| `$bg: #color` | `background-color: #color` |
| `$bg: #color 0.5` | `background-color: rgba(...)` with opacity |
| `$stroke: #color` | `border: 1px solid #color` |
| `$stroke: 2px #color` | `border: 2px solid #color` |
| `$istroke: #color` | `border: 1px solid #color` (inset/inner variant) |
| `$corner: Npx` | `border-radius: Npx` |
| `$corner: 50%` | `border-radius: 50%` (circle) |
| `$top: #color` | `border-top: 1px solid #color` |
| `$bottom: #color` | `border-bottom: 1px solid #color` |
| `$bottom: 2px #color` | `border-bottom: 2px solid #color` |
| `$left: #color` | `border-left: 1px solid #color` |
| `$right: #color` | `border-right: 1px solid #color` |
| `$shadow: Npx #color` | `box-shadow: 0 Npx Npx #color` |
| `$mshadow: Npx #color` | `box-shadow` (modal/elevated shadow) |
| `$glow: Npx #color` | outer glow box-shadow |
| `$dropshadow: Npx #color` | `drop-shadow` filter |
| `$tshadow: Npx #color` | `text-shadow` |
| `$transition: prop duration` | `transition: prop duration` |
| `$opacity: 0.N` | `opacity: 0.N; filter: alpha(opacity=N*100)` |
| `$rotate: deg N` | `transform: rotate(Ndeg)` with prefixes |
| `$gradient: #top #bottom` | CSS linear-gradient |
| `$color: #color 0.N` | `color: rgba(...)` |

### Color Reference Shorthands

| Shorthand | Meaning |
|---|---|
| `@#fff` | `color: #fff` |
| `@#333` | `color: #333` (any hex) |
| `@@error` | `color: var(--error-color)` (theme var) |
| `@@red` | `color: var(--red-color)` |
| `$bg:@red` | `background-color: var(--red-color)` |
| `$bg:@error 0.1` | bg using theme var at 10% opacity |
| `$bg:@main` | brand/primary color background |
| `$bg:@success` | success color background |
| `<@main -95 60>` | color manipulation: darken/lighten @main |

### Dynamic CSS Variable References

```css
/* Reference a CSS var with fallback */
$bg: [--subtext-color, #999];
$bg: [--bg-color-active, #e6e6e6];
```

---

## 3. Usage Patterns (Real Examples from Codebase)

### Chaining macros inline
```css
.__dialogclose {
    @absolute @pointer @#999 @borderbox;
    right: 10px;
    top: 10px;
    $corner: 50%;
    width: 32px;
    height: 32px;
}
```

### Position + size pattern
```css
.element {
    @absolute @fit;   /* fills parent */
    $bg: #000 0.6;    /* semi-transparent black */
    z-index: 10000;
}
```

### Typography pattern
```css
.title {
    @f16 @thick @upper;        /* font-size:16px, weight:500, uppercase */
    @#111;                     /* color:#111 */
    line-height: 24px;
}
```

### Interactive element pattern
```css
.item {
    @block @pointer @f13 @relative;
    padding: 8px 10px;
    $corner: 3px;
    @#555;
    
    :hover {
        $bg: #f3f3f3;
        @#111;
    }
}
```

### Button-style pattern
```css
.button {
    @center @pointer @#fff @bold @left;
    $bg: @main;
    $corner: 3px;
    $transition: all 0.3s;
    
    :hover {
        $bg: <@main 20 20>;
    }
}
```

---

## 4. Combining with Base.vn Design Tokens

When writing new component CSS, **combine both systems**:
- Use `@macros` for display, position, font, cursor helpers
- Use `$shorthands` for colors, borders, corners, shadows
- Use `var(--token-name)` for Base.vn design token values (spacing, colors, radius)

```css
/* ✅ CORRECT — uses macros + tokens together */
.button--primary {
    @iflex @pointer @bold;
    align-items: center;
    gap: var(--gap-horizontal-h-xsmall);
    padding: var(--gap-padding-p-3xsmall) var(--gap-padding-p-large);
    $corner: var(--radius-r-3xsmall);  /* or direct: $corner: 8px */
    $bg: var(--color-brand-background-1-default);
    @f14;
    @#fff;
    
    :hover {
        $bg: var(--color-brand-background-1-hover);
    }
    
    :disabled, &.button--disabled {
        $bg: var(--color-brand-background-disable);
        @@neutral-text-disable;   /* or: color: var(--color-neutral-text-disable) */
        cursor: not-allowed;
    }
}
```

---

## 5. Animation Macros (animation.css)

Available keyframes:
- `spin` — 360deg rotation, use with: `animation: spin 2s infinite linear`
- `leftright` — left/right bounce animation

```css
.__ajaxshow .__icon {
    animation: spin 2s infinite linear;
    -webkit-animation: spin 2s infinite linear;
}
```

---

## 6. Rules — ERROR if violated

- **Never expand a macro** back to raw CSS when the macro exists. Write `@absolute` not `position: absolute`.
- **Never write `float: left`** — use `@left`.
- **Never write `display: none`** — use `@hidden`.
- **Never write `display: inline-block`** — use `@inline`.
- **Never write `overflow: hidden`** alone — use `@xo` or `@clear`.
- **Never write `cursor: pointer`** — use `@pointer`.
- **Never hardcode colors** that have a Base.vn token — always use `var(--color-*)`.
- **Never hardcode spacing** outside the token scale (0,2,4,6,8,10,12,16,20,24,32px).
- **Dollar shorthands** (`$bg`, `$stroke`, `$corner`) must be used for borders, backgrounds, radius — not longhand CSS.
