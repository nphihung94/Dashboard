# Dashboard — Design Guidelines

**Design System:** Base.vn V0.2 + ExcelFormula.js
**Stack:** HTML + CSS (Base.vn macros) + jQuery 3+
**Updated:** 2026-03-18

---

## Brand Identity

- **Name:** Vibe Dashboard
- **Tagline:** "Data widgets. Formula power. Your canvas."
- **Tone:** Clean, professional, data-centric
- **Primary accent:** #1E88E5 (Base.vn brand blue)

---

## Color Tokens (inherit from Base.vn + local overrides)

See `css/tokens.css` for complete token definitions. Key color families:

### Neutral
```css
--color-bg:              #F1F3F5;   /* page canvas */
--color-surface:         #FFFFFF;   /* cards, panels */
--color-surface-subtle:  #F8F9FA;   /* footer tint, alt panels */
--color-border:          #E8E8E8;   /* borders, dividers */
--color-border-strong:   #D0D0D0;   /* strong borders */
```

### Brand & Interactive
```css
--color-brand:           #1E88E5;
--color-brand-hover:     #1976D2;
--color-brand-light:     rgba(30, 136, 229, 0.18);
```

### Text
```css
--color-text-1:          #343434;   /* primary */
--color-text-2:          #5B5B5B;   /* secondary */
--color-text-3:          #8F8F8F;   /* tertiary */
--color-text-disabled:   #C2C2C2;   /* disabled */
```

### Status
```css
--color-success-bg:      #E8F5E9;
--color-success-text:    #2E7D32;
--color-error-bg:        #FFEBEE;
--color-error-text:      #C62828;
--color-warn-bg:         #FFFDE7;
--color-warn-text:       #F57F17;
--color-info-bg:         #E3F2FD;
--color-info-text:       #1565C0;
```

### Status Dots (Flow Builder)
```css
--color-dot-healthy:     #4CAF50;
--color-dot-warning:     #FF9800;
--color-dot-error:       #F44336;
--color-dot-draft:       #FFA229;
```

### Pipeline Stage Icon Badges
```css
--stage-source:          #1565C0;
--stage-filter-rows:     #6A1B9A;
--stage-remove-columns:  #7B1FA2;
--stage-group-by:        #00695C;
--stage-add-column:      #283593;
--stage-sort:            #AD1457;
--stage-merge:           #E65100;
--stage-pivot:           #4A148C;
--stage-unpivot:         #880E4F;
--stage-output:          #1B5E20;
```

---

## Typography

- **Font:** Inter (Google Fonts)
- **Display value (KPI):** 32px / 700
- **Section title:** 18px / 600
- **Widget title:** 14px / 600
- **Body/label:** 13px / 400
- **Caption/meta:** 12px / 400

---

## Spacing & Layout (Base.vn 8px grid)

### Spacing Tokens
Use `--spacing-*` tokens for all gaps:
```css
--spacing-4:  4px;
--spacing-8:  8px;
--spacing-12: 12px;
--spacing-16: 16px;
--spacing-20: 20px;
--spacing-24: 24px;
--spacing-32: 32px;
```

### Layout Dimensions
- Sidebar width: `--sidebar-width: 220px`
- Header height: `--header-height: 42px`
- Config header min-height: 44px (accommodates stage icon 20px + padding)
- Widget padding: `--spacing-16`
- Widget header height: 40px
- Widget footer height: 32px
- Grid gutter: `--spacing-12`

### Border Radius
```css
--radius-sm: 4px;   /* icon badges, buttons */
--radius-md: 6px;   /* cards, inputs */
--radius-lg: 8px;   /* modals, context menus */
```

### Shadow System
```css
--shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.06);
--shadow-md: 0 2px 8px rgba(0, 0, 0, 0.10);
--shadow-lg: 0 4px 16px rgba(0, 0, 0, 0.14);  /* context menus, drawers */
```

### Transitions
```css
--flow-transition-fast:   150ms;  /* rapid feedback (dot pulse, hover) */
--flow-transition-normal: 200ms;  /* standard animation (drawer, chevron) */
```

---

## Component: Top Navbar

- Height: 56px
- Left: logo (24px icon + "Vibe Dashboard" text)
- Right: "+ Add Widget" primary button + settings icon
- Background: `--surface-bg` with `$bottom: --color-neutral-stroke-2-default`
- Shadow: `$shadow: 2px #000 0.06`

---

## Component: Widget Card

```
┌─────────────────────────────────────────┐
│ [icon] Widget Title     [⚙] [⛶] [✕]   │ ← header 40px
├─────────────────────────────────────────┤
│                                         │
│            Widget Body                  │ ← flex-grow, overflow auto
│                                         │
├─────────────────────────────────────────┤
│ Last updated: 2min ago        [↻]       │ ← footer 32px (optional)
└─────────────────────────────────────────┘
```

- `$corner: 8px`
- `$shadow: 2px #000 0.06`
- Border: `$stroke: var(--color-neutral-stroke-2-default)`
- Body padding: `--spacing-16`

---

## Widget Types

| Widget | Icon | Min Size | Description |
|--------|------|----------|-------------|
| KPI Card | 📊 | 2×2 | Large metric value + trend + sparkline |
| Line Chart | 📈 | 3×2 | Time-series multi-series chart |
| Bar Chart | 📊 | 3×2 | Category comparison |
| Pie/Donut | 🥧 | 2×2 | Composition breakdown |
| Data Table | 🗂 | 4×3 | Sortable paginated rows |
| Formula Widget | fx | 2×2 | ExcelFormula.js instance with variables |
| Progress Bar | ▓ | 2×1 | Single metric progress toward target |
| Gauge | ⏱ | 2×2 | Radial gauge with threshold zones |

---

## Layout: Gridstack.js Grid

- 12 columns
- Row height: 60px
- Gutter: 12px
- Min widget: 2×2 units
- Drag handle: widget header
- Resize: bottom-right corner handle
- Responsive: collapse to 1 col on mobile

---

## Config Sidebar

- Position: fixed right, 300px wide
- Slide-in animation on settings click
- Sections: Dataset, Metrics, Filters, Display
- Footer: Apply / Reset / Remove Widget buttons
- Overlay: semi-transparent backdrop

---

## Add Widget Modal

- Centered overlay modal
- Category tabs: KPI | Charts | Tables | Formula
- Widget grid: 2-column card grid with preview icons
- Second step: Dataset + config form
- CTA: "Add to Dashboard" primary button

---

## Flow Builder Component Design

### 2-Column Layout
- **Left panel (260px)**: Stage chain accordion with icons, names, status dots, reordering buttons
- **Right panel (1fr)**: Config form for selected stage; preview drawer slides in from right
- **Full height**: Contained within pipeline tab

### Left Panel — Stage Accordion

**Header (44px min-height)**
- Stage title + collapse toggle button
- Uses `--spacing-*` tokens for padding
- Config header shows "Step X of Y — {Stage Name}" label

**Stage Items**
- Each stage is a collapsible accordion item
- Border-left (2px): transparent by default, `--color-brand` when active
- Background: `var(--color-surface-subtle)` on hover
- Active state: `var(--sidebar-active-bg)` with bold text

**Stage Icon Badge (20×20px)**
- Rounded square `--radius-sm`
- `background: var(--stage-TYPE)` per stage type
- Solid color, no gradients

**Status Dot (8px)**
- `--color-dot-draft` (orange, #FFA229) — unsaved changes
- `--color-dot-healthy` (#4CAF50) — saved state
- `--color-dot-error` (#F44336) — validation error
- Box-shadow: 2px ring of light color (e.g., `0 0 0 2px var(--color-error-bg)`)
- Error state pulse: `flow-dot-pulse` animation (2s, opacity 1→0.45)

**Row Count Delta Badge**
- "→ N rows" badge on each saved stage showing output row count
- Positioned to right of stage title
- Visual feedback on transformation impact
- Updates dynamically on stage save

**Stage Reordering Controls**
- ↑↓ buttons on non-source stage headers (disabled on source stages)
- Keyboard-driven reordering with helper functions: `_rebuildInputRefs()`, `_invalidateFrom()`
- Cascading input schema validation on reorder

**Transitions**
- Hover/active: `var(--flow-transition-fast)` (150ms ease)
- Chevron rotate: `var(--flow-transition-normal)` (200ms ease)

### Right Panel — Config Header (44px min-height)

- Flex layout: title flex-1, action buttons right-aligned
- Title: `--font-size-md`, weight 600; shows "Step X of Y — {Stage Name}"
- Uses `--spacing-*` tokens for padding/gaps
- Bottom border: `--color-border`
- Context menu (...) on non-source stages with options: Duplicate, Delete, etc.

### Context Menu (Add Stage)

- Position: absolute, z-index 100
- Background: `--color-surface`
- Border: 1px `--color-border`
- Border-radius: `--radius-lg`
- Shadow: `--shadow-lg`
- Animation: fade-in + translateY(-4px) over `--flow-transition-fast`
- **Hover state**: left accent border (2px `--color-brand`)
- Items have 2px left border (transparent → brand color on hover)

### Slide-In Drawer (Preview)

- Position: fixed right edge, max-width 600px (responsive to viewport)
- Backdrop: `rgba(0, 0, 0, 0)` by default, `rgba(0, 0, 0, 0.15)` when open
- Drawer: `transform: translateX(100%)` closed → `translateX(0)` open
- **Easing**: `cubic-bezier(0.32, 0.72, 0, 1)` deceleration curve
- Duration: 250ms
- **Clickable backdrop**: enables dismiss-on-click behavior
- Shadow: `-4px 0 24px rgba(0, 0, 0, 0.12)`

### Form Validation & Error States

**Inline Error Banners**
- `.flow-inline-error` banner with error message displayed inside forms
- Red background: `--color-error-bg`, text: `--color-error-text`
- Positioned above/below affected fields
- Dismissible or auto-clearing on user correction

**Field Invalid Highlighting**
- `.is-invalid` class on form controls (inputs, selects, textarea)
- Border color: `--color-error-text`
- Optional: light background tint `--color-error-bg`
- Applied via stage validation model (`stage.error` field)

**Data Type Indicators**
- Prefix labels on field options: [T] text, [#] number, [D] date, [B] boolean
- Applied in Filter/Sort/Aggregate dropdowns and Select column lists
- Inline badges with token-based colors for distinction
- Example: "[T] Customer Name", "[#] Sales Amount", "[D] Transaction Date"

**Readable Operator Labels**
- Filter form displays human-readable operators: "equals", "not equals", "contains", "starts with", etc.
- Replaces symbols (=, !=, etc.) for clarity
- Consistent terminology across all filter conditions

### Form Features: Search & Pagination

**Column Search** (Select Stage)
- Search input above column list; visible when column count > 8
- Filters list in real-time as user types
- Hidden via `.is-hidden` CSS class when not applicable
- Placeholder: "Search columns..."

**Preview Pagination**
- Row selector dropdown (10/25/50/100 rows) in preview table footer
- Updates preview display without affecting actual flow execution
- Helps users inspect large datasets without overwhelming the UI

### Keyboard Shortcuts & Controls

**Stage Reordering**
- ↑ button: Move stage up in chain
- ↓ button: Move stage down in chain
- Disabled on source stage (first position always)
- Triggers `_rebuildInputRefs()` to revalidate downstream schemas

**Flow Control Shortcuts**
- **Ctrl+S**: Save current stage configuration
- **Ctrl+Enter**: Run flow and execute all stages
- Scoped to `.flow-builder` container; doesn't conflict with global shortcuts
- Visual feedback (toast/status message) on execution

### Empty State & Onboarding

**Empty State Guide**
- Step-by-step visual guide (①②③) shown when no stages saved
- Instructional cards with:
  1. Create source stage (select dataset)
  2. Add transformation stages (filter, select, etc.)
  3. Run flow and preview results
- Guides users through basic workflow
- Dismissed after first saved stage

### Accessibility

**Focus Visible**
- All interactive elements: `:focus-visible` outline (brand color, 2px)
- Buttons, stage headers, menu items all support keyboard nav
- Reorder buttons and context menu items keyboard-accessible

**Reduced Motion**
- `@media (prefers-reduced-motion: reduce)` respected
- Transitions set to 0ms or disabled
- Animations paused or removed (e.g., dot pulse, context menu fade-in)
- Example:
  ```css
  @media (prefers-reduced-motion: reduce) {
    .flow-preview-drawer {
      transition: none;
    }
    .flow-status-dot.is-error {
      animation: none;
    }
    .flow-context-menu {
      animation: none;
    }
  }
  ```

---

## Icons

All SVG. Sizes: 16px (small), 20px (default), 24px (large).
Use `fill: currentColor` or `stroke: currentColor`.

Key icons used:
- Settings/config: gear (20px)
- Fullscreen: expand arrows (20px)
- Remove/close: × (20px)
- Refresh: circular arrow (16px)
- Add: plus (20px)
- Drag handle: grid dots (20px)
- Chart types: distinct SVG per type
