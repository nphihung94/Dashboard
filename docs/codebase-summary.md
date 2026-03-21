# Codebase Summary

**Last Updated**: 2026-03-21

## Overview

Vibe Dashboard is a single-page application (SPA) built with vanilla JavaScript (ES5), jQuery, and plain HTML/CSS. The app provides a modular pipeline system for data processing and a dashboard view with dataset management.

## Core Architecture

### Main Components

**App Shell** (`app.js`)
- Hash-based router: `#home`, `#dashboard`, `#dataset`, `#settings`, `#pipeline`, `#integrations`
- Page registry and lifecycle management (render/destroy)
- Initialization hook for stores
- Toast notification system

**Sidebar Navigation** (`components/sidebar.js`)
- General navigation items: Home, Dashboard, Dataset, Settings, Integrations, Pipeline
- Active page highlighting
- Custom SVG icons

**Services / Stores**

- **DatasetStore** (`services/dataset-store.js`): Manages dataset CRUD operations, localStorage persistence, and integration registration
- **LayoutStore** (`services/layout-store.js`): Manages UI layout state (sidebar, modals)
- **IntegrationStore** (`services/integration-store.js`): NEW — Manages OAuth integration credentials (Google Sheets, Drive, etc.); localStorage backed

### Pages

**Home** (`pages/page-home.js`)
- Welcome screen with quick links to main features

**Dashboard** (`pages/page-dashboard.js`)
- Displays list of saved datasets
- Provides access to edit, preview, and delete operations

**Dataset Creator** (`pages/page-dataset.js`)
- Multi-step wizard for creating new datasets
- Integrates data source selection (file, API, pipeline, database, external integration)
- Preview and validation before save

**Settings** (`pages/page-settings.js`)
- User preferences and configuration

**Integrations** (`pages/page-integrations.js`)
- NEW — Connect to external data sources (Google Sheets, Google Drive, Tableau, PowerBI)
- Google Sheets OAuth via Google Identity Services (GIS)
- Client ID input for OAuth configuration
- Display connected vs. not-connected state per provider
- Disconnect functionality with localStorage persistence

**Pipeline** (`pages/page-pipeline.js`)
- Data flow pipeline builder with 3 tabs: Flow, Configuration, Run Log
- Integrates Data Flow Builder components for visual rule-based stage configuration

### Components

**Data Flow Builder** (`components/flow-builder/`)
- **flow-builder-shell.js** — Top-level container for stage chain view; renders stages horizontally and delegates to stage panels
- **source-stage-panel.js** — Source stage configuration (dataset selection, merge join rules)
- **transform-stage-panel.js** — Transform stage configuration (filter, select, aggregate, sort, limit, formula, pivot, unpivot)
- **stage-rule-forms.js** — Basic form components for stage rules (conditions, field selection, aggregation)
- **stage-rule-forms-filter.js** — Filter-specific form with readable operator labels ("equals", "contains", etc.); inline validation with `.flow-inline-error` banners
- **stage-rule-forms-select.js** — Select stage form with column search (visible when >8 columns) and data type indicators [T]/[#]/[D]/[B]; type badges in column list
- **stage-rule-forms-advanced.js** — Advanced rule forms (pivot config, unpivot config, formula definitions)
- **flow-builder-stage-ops.js** — Stage operations: add/remove/save/run flow; validates and executes stage transformations; includes `_rebuildInputRefs()` and `_invalidateFrom()` helpers for stage reordering
- **flow-builder-left-panel.js** — Left accordion panel with stage chain and reordering UI
- **flow-builder-left-panel-html.js** — HTML helper for left panel rendering with row count delta "→ N rows" badges
- **flow-builder-overlays.js** — Overlay components including context menus and backdrop for interactions
- **stage-preview-table.js** — Preview data table with pagination (10/25/50/100 rows), schema display, and sample row data

**Dataset Source Integration** (`components/dataset-source-integration.js`)
- NEW — Supports real Google Sheets integration via Sheets API v4
- Fetches sheet data using stored OAuth access tokens
- Falls back to coming-soon placeholders for Google Drive, Tableau, PowerBI
- Spreadsheet URL and range input for data selection
- Loading and error states

**Page Header** (`components/page-header.js`)
- Breadcrumb and title display

**Modal Dialog** (`components/modal.js`)
- Generic modal wrapper for dialogs

**Other Components**
- Dataset source cards (file, API, pipeline, database, external integration)
- File upload handler
- Toast notifications

## IntegrationStore API

**Methods**

- `IntegrationStore.init()` — Load integrations from localStorage
- `IntegrationStore.save(provider, tokenData)` — Persist OAuth credentials (shape: `{ provider, accessToken, expiresAt, email }`)
- `IntegrationStore.get(provider)` — Retrieve stored credentials for a provider
- `IntegrationStore.list()` — Return array of all connected integrations
- `IntegrationStore.remove(provider)` — Delete integration and persist change

**Storage Key**: `vibe-integrations` (localStorage)

**Data Shape**
```javascript
{
  "google-sheets": {
    "provider": "google-sheets",
    "accessToken": "ya29.a0AfH6SMB...",
    "expiresAt": 1684929600000,
    "email": ""
  }
}
```

## Google Sheets Integration Flow

1. User navigates to Integrations page
2. Enters Google OAuth Client ID (stored in `vibe-gis-client-id` localStorage key)
3. Clicks "Connect" on Google Sheets card
4. App lazily loads Google Identity Services (GIS) script
5. GIS popup opens OAuth consent screen
6. On success, access token stored in IntegrationStore
7. Card updates to "Connected" state with Disconnect button
8. In Dataset Creator, user can now load data from Google Sheets:
   - Paste Spreadsheet URL
   - Select range (default: A1:Z1000)
   - Click "Load Data"
   - App fetches sheet data via Sheets API v4 using stored token
   - Data is converted to row objects (first row as headers) and saved as dataset

## File Organization

```
C:\Workspace\Vibe\Dashboard
├── app.js                              # Main SPA router & initialization
├── index.html                          # Page shell & script loader
├── app.css                             # Global styles
├── app-utils.js                        # Utility functions
├── pages/
│   ├── page-home.js
│   ├── page-dashboard.js
│   ├── page-dataset.js
│   ├── page-settings.js
│   ├── page-pipeline.js
│   └── page-integrations.js            # NEW
├── components/
│   ├── page-header.js
│   ├── modal.js
│   ├── sidebar.js
│   ├── dataset-source-integration.js   # MODIFIED
│   └── flow-builder/                   # ENHANCED
│       ├── flow-builder-shell.js
│       ├── source-stage-panel.js
│       ├── transform-stage-panel.js
│       ├── stage-rule-forms.js
│       ├── stage-rule-forms-filter.js          # NEW
│       ├── stage-rule-forms-select.js          # NEW
│       ├── stage-rule-forms-advanced.js
│       ├── flow-builder-stage-ops.js           # ENHANCED
│       ├── flow-builder-left-panel.js          # ENHANCED
│       ├── flow-builder-left-panel-html.js     # NEW
│       ├── flow-builder-overlays.js            # ENHANCED
│       └── stage-preview-table.js              # ENHANCED
├── services/
│   ├── dataset-store.js                # MODIFIED (flow persistence)
│   ├── layout-store.js
│   ├── integration-store.js
│   └── flow-rule-engine.js             # NEW
├── css/
│   ├── app.css
│   └── flow-builder.css                # ENHANCED (tokens refactor)
└── docs/
    └── codebase-summary.md             # This file
```

## CSS Architecture

### Tokens System (`css/tokens.css`)

All styling uses CSS custom properties (design tokens). No hardcoded colors, spacing, or sizes.

**Token Categories:**
- **Colors**: Brand, neutral, status, status dots, pipeline stage icons
- **Spacing**: 4px–32px scale (8px grid)
- **Layout**: Sidebar width, header heights
- **Shadows**: sm (1px), md (8px), lg (16px) for depth hierarchy
- **Radius**: sm (4px), md (6px), lg (8px)
- **Typography**: Font family, size scale, weights
- **Transitions**: `--flow-transition-fast: 150ms`, `--flow-transition-normal: 200ms`

**Design System**: Base.vn V0.2 + Vibe-specific tokens (e.g., `--color-dot-draft: #FFA229`)

### Flow Builder Styles (`css/flow-builder.css`)

Complete rewrite — all hardcoded values replaced with tokens. Upgrade includes:

**Layout**
- 2-column grid: left (260px accordion) + right (config panel)
- Header min-height: 44px (accommodates 20px stage icon + padding)

**Components**
- **Stage accordion**: 20×20px icon badges with `--stage-*` colors; status dots (8px) with ring shadows
- **Hover states**: Smooth transitions via `--flow-transition-fast`
- **Context menu**: Fade-in animation, left-accent border on hover, `--shadow-lg`
- **Drawer**: Cubic-bezier(0.32,0.72,0,1) deceleration, clickable backdrop, 250ms transition

**Accessibility**
- `:focus-visible` outlines on all interactive elements
- `@media (prefers-reduced-motion: reduce)` respected — animations disabled, transitions set to 0ms
- Error pulse animation respects motion preference

**Animations**
- `flow-menu-in`: Context menu fade-in + slide-up
- `flow-dot-pulse`: Error dot breathing effect (opacity 1→0.45, 2s loop)

## Key Constraints & Standards

- **ES5 Only**: No const/let, arrow functions, template literals, or modern syntax
- **No Build Tool**: Loaded via plain script tags; jQuery for DOM manipulation
- **200-Line Max**: Individual files kept under 200 lines for readability
- **localStorage**: Primary persistence mechanism for user data and credentials
- **YAGNI / KISS / DRY**: Minimize scope, keep it simple, avoid duplication
- **Responsive Design**: CSS Grid + Flexbox for layout; mobile-friendly
- **Token-Driven Design**: All styles use `css/tokens.css`; no hardcoded values in component CSS

## Development Guidelines

1. Read design-guidelines.md for UI/UX standards
2. Follow IIFE pattern for module encapsulation
3. Use `window.ModuleName = ModuleName` to expose public APIs
4. Bind event handlers via jQuery .on() with event delegation
5. Test page navigation and store interactions manually in browser
6. Keep localStorage keys documented; prefix with `vibe-` for clarity
7. Run syntax check after modifications; no bundler or linter required

## Recent Changes

### Flow Builder UX Improvements (Completed)

**Data Type Indicators & Field Labels**
- Added data type prefixes [T]/[#]/[D]/[B] to field option text in Filter/Sort/Aggregate dropdowns
- Type badge spans in Select column list for visual clarity
- NEW: `components/flow-builder/stage-rule-forms-filter.js` and `stage-rule-forms-select.js`

**Row Count Feedback & Stage Reordering**
- "→ N rows" badge on each saved stage in left panel accordion (dynamic row count deltas)
- ↑↓ buttons on non-source stage headers for drag-free reordering
- `_rebuildInputRefs()` and `_invalidateFrom()` helpers in `flow-builder-stage-ops.js` for dependency tracking

**Inline Validation & Error Handling**
- `.flow-inline-error` banner inside forms with error message display
- `stage.error` field on data model for validation state persistence
- Field `.is-invalid` CSS highlighting for form controls

**Stage Duplication & Enhanced Config Header**
- "..." context menu on non-source stages with "Duplicate" option
- "Step X of Y — {Stage Name}" header label (e.g., "Step 2 of 4 — Filter Stage")
- Min-height 44px to accommodate stage icon (20px) + padding

**Column Search & Readable Operator Labels**
- Search input above column list in Select stage (visible when >8 columns)
- Readable operator labels: "equals", "not equals", "contains", etc. instead of symbols

**Preview Pagination & Keyboard Shortcuts**
- 10/25/50/100 row selector in preview table for flexible data exploration
- Ctrl+S (save stage), Ctrl+Enter (run flow) shortcuts scoped to `.flow-builder` container
- Keyboard shortcut bindings in event delegation

**Empty State Guide**
- Step-by-step guide (①②③) shown before any stage is saved
- Progressive disclosure for new users

**Files Created/Enhanced**:
- NEW: `components/flow-builder/stage-rule-forms-filter.js` — Filter form with readable operators + inline validation
- NEW: `components/flow-builder/stage-rule-forms-select.js` — Select form with column search + data type indicators
- NEW: `components/flow-builder/flow-builder-left-panel-html.js` — HTML generation for left panel with row count deltas
- ENHANCED: `components/flow-builder/flow-builder-stage-ops.js` — Stage reordering, duplication, dependency management
- ENHANCED: `components/flow-builder/flow-builder-left-panel.js` — Reordering UI, row count display
- ENHANCED: `components/flow-builder/stage-preview-table.js` — Pagination controls
- ENHANCED: `css/flow-builder.css` — All tokens-based, no hardcoded values

### Integration Page Feature (Completed)

- **Phase 1**: Scaffolded sidebar nav item, registered `#integrations` route, created page shell with provider cards
- **Phase 2**: Implemented IntegrationStore service, added Google Sheets OAuth flow via GIS, Client ID input
- **Phase 3**: Wired dataset-source-integration.js to IntegrationStore; real Google Sheets data fetch via Sheets API v4

**Files Created**: `services/integration-store.js`, `pages/page-integrations.js`

### Data Flow Builder Feature (Completed)

- **Flow Rule Engine**: SQL-like rule syntax with JavaScript in-memory execution for filter, select, aggregate, sort, limit, formula, pivot, unpivot stages
- **Flow Builder Components**: Visual stage chain editor with source/transform panels, advanced rule forms, and data preview
- **Flow Persistence**: DatasetStore integration for saving/loading flow definitions
- **Pipeline Integration**: Data Flow tab on Pipeline page with run/validate flow capabilities

**Files Created**:
- `services/flow-rule-engine.js` — Rule translation and stage execution engine
- `components/flow-builder/` (7→12 components) — Stage editors, rule forms, preview table, UX enhancements
- `css/flow-builder.css` — Flow builder styling (tokens-driven)

**Files Modified**:
- `services/dataset-store.js` — Added flow persistence (getFlowDef, saveFlowDef)
- `pages/page-pipeline.js` — Added Data Flow tab with flow builder integration
- `services/pipeline-engine.js` — Added runFlow method for stage execution

## Next Steps

- Monitor token expiry and refresh logic for Google Sheets integration
- Expand integrations to Google Drive, Tableau, PowerBI
- Optimize flow execution for large datasets (consider streaming/pagination)
- Consider keyboard shortcut documentation for user guide
