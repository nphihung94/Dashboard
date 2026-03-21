# Project Changelog

**Latest Version**: 0.4.0
**Last Updated**: 2026-03-21

All notable changes to this project are documented below. Format follows [Keep a Changelog](https://keepachangelog.com/).

---

## [0.4.0] — Flow Builder UX Improvements & Enhanced Forms — 2026-03-21

### Added

#### Data Type Indicators & Field Labels
- **Data type prefixes** on field options: [T] text, [#] number, [D] date, [B] boolean
- Visible in Filter/Sort/Aggregate dropdowns and Select column list
- Helps users understand field characteristics at a glance

#### Stage Reordering & Duplication
- **↑↓ reordering buttons** on non-source stage headers for drag-free rearrangement
- **Stage duplication** via "..." context menu (non-source stages only)
- Cascading input schema validation via `_rebuildInputRefs()` and `_invalidateFrom()` helpers
- Prevents invalid downstream references after reordering

#### Row Count Feedback
- **"→ N rows" badge** on each saved stage showing transformation output
- Dynamic updates reflect filtering, aggregation, and merge impacts
- Visual feedback on data reduction/expansion

#### Enhanced Configuration Header
- **"Step X of Y — {Stage Name}"** label showing position in pipeline
- Contextual header for easier stage navigation
- Stage icon + status dot included in 44px min-height layout

#### Inline Validation & Error Handling
- **`.flow-inline-error` banner** inside forms with error message display
- **`.is-invalid` highlighting** on form controls for visual feedback
- **`stage.error` field** on data model for validation state persistence
- Prevents invalid configurations from propagating downstream

#### Enhanced Select Stage Form
- **Column search input** above column list (visible when >8 columns)
- Real-time filtering as user types
- Data type badges on each column
- `.is-hidden` CSS class for conditional visibility

#### Readable Operator Labels
- Filter form displays **human-readable operators**: "equals", "not equals", "contains", "starts with", "ends with", etc.
- Replaces cryptic symbols (=, !=, >, <) for improved UX
- Consistent terminology across all filter conditions

#### Preview Pagination
- **10/25/50/100 row selector** in preview table footer
- Allows exploration of large datasets without performance impact
- Helps users validate data transformations at different scales

#### Keyboard Shortcuts
- **Ctrl+S**: Save current stage configuration
- **Ctrl+Enter**: Execute flow and run all stages
- Scoped to `.flow-builder` container; no global conflicts
- Toast notification feedback on shortcut activation

#### Empty State Guide
- **Step-by-step visual guide** (①②③) displayed before first saved stage
- Three instructional cards:
  1. Create source stage (select dataset)
  2. Add transformation stages (filter, select, etc.)
  3. Run flow and preview results
- Improves onboarding for new users

### New Files
- `components/flow-builder/stage-rule-forms-filter.js` — Filter-specific form with readable operators and inline validation
- `components/flow-builder/stage-rule-forms-select.js` — Select form with column search and data type indicators
- `components/flow-builder/flow-builder-left-panel-html.js` — HTML generation for left panel with row count deltas

### Modified Files
- `components/flow-builder/flow-builder-stage-ops.js` — Added stage reordering, duplication, dependency management
- `components/flow-builder/flow-builder-left-panel.js` — Added reordering UI, row count display, step indicators
- `components/flow-builder/stage-preview-table.js` — Added pagination controls (10/25/50/100 rows)
- `components/flow-builder/transform-stage-panel.js` — Integrated new form components, keyboard shortcuts
- `components/flow-builder/flow-builder-overlays.js` — Enhanced context menu for duplication/deletion

### UI/UX Enhancements
- More discoverable data type information at point of use
- Faster stage configuration without drag-and-drop learning curve
- Better visual feedback on transformation impacts
- Improved error messaging prevents data corruption
- Keyboard-first interaction model for power users

### Accessibility
- All new interactive elements support keyboard navigation
- Focus-visible outlines on reorder buttons and search input
- Context menu accessible via keyboard
- Reduced motion support for animations and transitions

---

## [0.3.1] — Flow Builder UX Token Upgrade — 2026-03-21

### Changed

#### CSS Architecture Overhaul
- **Token System Expansion**: Added new tokens to `css/tokens.css`
  - Status dots: `--color-dot-healthy`, `--color-dot-warning`, `--color-dot-error`, `--color-dot-draft`
  - Transitions: `--flow-transition-fast: 150ms`, `--flow-transition-normal: 200ms`
  - Pipeline stage icon colors remain consistent with existing stage tokens

- **Flow Builder CSS Complete Rewrite** (`css/flow-builder.css`)
  - Removed all hardcoded hex colors, pixel values, and animation timings
  - Replaced with design token references from `css/tokens.css`
  - Result: Single source of truth for all visual properties; easier maintenance and theming

#### Component Refinements
- **Stage Icon Badges**: 20×20px with rounded corners; per-stage color tokens
- **Status Dots**: 8px with ring shadows; animated pulse on error state
- **Context Menu**: Fade-in animation, left-accent border on hover, elevated shadow
- **Drawer**: Cubic-bezier easing (deceleration curve), clickable backdrop for dismiss-on-click

#### Accessibility Enhancements
- `:focus-visible` outlines on all interactive elements (stage headers, buttons, menu items, inputs)
- Full `@media (prefers-reduced-motion: reduce)` support:
  - Error pulse animation disabled
  - All transitions set to 0ms or removed
  - Smooth user experience for motion-sensitive users

#### Configuration Header
- Min-height: 44px (accommodates 20px stage icon + padding)
- Uses `--spacing-*` tokens for consistent alignment

### Technical Details

**Design Token Coverage**:
```css
/* Colors */
--color-dot-draft: #FFA229;
--color-dot-healthy: #4CAF50;
--color-dot-warning: #FF9800;
--color-dot-error: #F44336;

/* Transitions */
--flow-transition-fast: 150ms;    /* rapid feedback */
--flow-transition-normal: 200ms;  /* standard animation */

/* Existing stage colors (unchanged) */
--stage-source, --stage-filter-rows, --stage-remove-columns, etc.
```

**CSS Files Modified**:
- `css/tokens.css` — Added 4 color tokens + 2 transition tokens
- `css/flow-builder.css` — Complete rewrite (250+ LOC) to use all tokens

**Files Enhanced**:
- `components/flow-builder/flow-builder-overlays.js` — Added `.flow-backdrop` div for clickable dismiss

### Benefits
- **Maintainability**: Token-driven design reduces cognitive load when modifying styles
- **Consistency**: Single source of truth eliminates accidental color/size variations
- **Accessibility**: Focus and motion preferences now baked into component CSS
- **Scalability**: Easy to support dark mode, theming, or brand updates in future

---

## [0.3.0] — Data Flow Builder Release — 2026-03-20

### Added

#### Core Features
- **Data Flow Builder**: Visual stage chain editor for SQL-like data transformations
  - 8 transformation stages: Filter, Select, Aggregate, Sort, Limit, Formula, Pivot, Unpivot
  - Source stage with dataset selection and join/merge configuration
  - Real-time data preview with schema inference

#### New Files
- `services/flow-rule-engine.js` — SQL-like rule engine with in-memory execution
  - Rule translation to PipelineStage configs
  - Schema inference from sample data
  - Stage validation and error reporting
  - Display text generation for rule summaries

- `components/flow-builder/` — 7 component modules
  - `flow-builder-shell.js` — Main container with stage chain UI
  - `source-stage-panel.js` — Source configuration panel
  - `transform-stage-panel.js` — Transform stage editor
  - `stage-rule-forms.js` — Basic rule form components
  - `stage-rule-forms-advanced.js` — Advanced rule forms (pivot, unpivot, formula)
  - `flow-builder-stage-ops.js` — Stage mutation operations
  - `stage-preview-table.js` — Output preview with schema

- `css/flow-builder.css` — Flow builder styling
  - Stage chain visualization
  - Panel layouts and form styling
  - Preview table design
  - Status indicators and animations

#### Integrations
- Pipeline page now includes Data Flow tab
- Flow definitions persisted in localStorage via DatasetStore

### Modified

- `services/dataset-store.js` — Added flow persistence
  - `getFlowDef(pipelineId)` — Retrieve saved flow definition
  - `saveFlowDef(pipelineId, flowDef)` — Persist flow definition

- `services/pipeline-engine.js` — Added execution support
  - `runFlow(flowDef)` — Execute all stages sequentially
  - Integration with FlowRuleEngine for stage execution

- `pages/page-pipeline.js` — Data Flow tab integration
  - FlowBuilderShell rendered in Data Flow tab
  - Run Flow button with stage execution
  - Error handling and result display

### Technical Details

**Rule Syntax**: Flow stages use JSON rule objects:
```javascript
{
  type: 'filter',
  rules: {
    logic: 'AND',
    conditions: [
      { field: 'amount', operator: '>', value: '100' },
      { field: 'status', operator: '=', value: 'active' }
    ]
  }
}
```

**Supported Operators**:
- Comparison: `=`, `!=`, `>`, `<`, `>=`, `<=`
- String: `contains`, `startsWith`, `endsWith`
- Logic: `AND`, `OR`
- List: `in`, `notIn`

**Aggregation Functions**: count, sum, avg, min, max, first, last, distinct

---

## [0.2.0] — Google Sheets Integration — 2026-03-10

### Added

#### OAuth Integration
- Google Sheets OAuth via Google Identity Services (GIS)
- OAuth Client ID configuration (stored in localStorage)
- Connect/Disconnect flow for external integrations

#### New Files
- `services/integration-store.js` — OAuth credential management
  - `save(provider, tokenData)` — Store credentials
  - `get(provider)` — Retrieve credentials
  - `list()` — List all connected providers
  - `remove(provider)` — Disconnect integration

- `pages/page-integrations.js` — Integrations management page
  - Provider cards (Google Sheets, Google Drive, Tableau, PowerBI)
  - OAuth connection flow
  - Disconnect button for connected providers

#### Features
- Google Sheets API v4 integration for live data fetch
- Spreadsheet URL + range selector in Dataset Creator
- Real-time data download with automatic header detection

### Modified

- `components/dataset-source-integration.js` — Real Google Sheets support
  - OAuth token-based API requests
  - Sheet data conversion to row objects
  - Error handling for invalid URLs/ranges

- `app.js` — Added Integrations route
  - `#integrations` hash route
  - IntegrationStore initialization

- `components/sidebar.js` — Added Integrations nav item

- `index.html` — Updated script tags and page containers

### Technical Details

**OAuth Flow**:
1. User enters Google Client ID on Integrations page
2. Clicks "Connect" → GIS popup
3. User authorizes Vibe Dashboard
4. Access token stored in IntegrationStore
5. Available for Sheets API requests

**Storage Key**: `vibe-integrations` (localStorage)
```javascript
{
  "google-sheets": {
    provider: "google-sheets",
    accessToken: "ya29.a0AfH6SMB...",
    expiresAt: 1684929600000,
    email: "user@example.com"
  }
}
```

---

## [0.1.0] — Core Dashboard MVP — 2026-02-15

### Added

#### Core Architecture
- Hash-based SPA router with 6 pages
- Page registry and lifecycle management
- localStorage persistence for user data

#### Pages
- **Home** — Welcome screen with feature overview
- **Dashboard** — Dataset management (list, create, edit, delete)
- **Dataset Creator** — Multi-step wizard for new datasets
  - File upload (CSV, JSON)
  - API data source selector
  - Pipeline datasource
  - Database connection (stub)
  - Preview and validation before save

- **Pipeline Builder** — Visual pipeline editor scaffold
- **Settings** — User preferences placeholder
- **Integrations** — Placeholder for future external integrations

#### Components
- **Sidebar** — Navigation with active page highlighting
- **Page Header** — Breadcrumb and title display
- **Modal** — Generic dialog wrapper
- **Toast Notifications** — Feedback messages

#### Services & Stores
- **DatasetStore** — Dataset CRUD operations
  - localStorage persistence (`vibe-datasets`)
  - Dataset schema tracking
  - Pipeline creation and management

- **LayoutStore** — UI state management
  - Sidebar visibility
  - Modal state
  - Active page tracking

#### Design System
- Base.vn V0.2 color palette
- Typography system (Inter, 13px base)
- Spacing tokens (8px grid)
- Component styles (buttons, cards, forms)

### Technical Details

**File Structure**:
- ES5 JavaScript only (no const/let/arrow functions)
- Module pattern with IIFE and window exposure
- jQuery 3.x for DOM manipulation
- Plain CSS (no preprocessor)
- ~200 LOC per file maximum

**Storage Keys**:
- `vibe-datasets` — All datasets and pipelines
- `vibe-gis-client-id` — Google OAuth Client ID (added in 0.2.0)
- `vibe-integrations` — OAuth credentials (added in 0.2.0)

**Browser Support**: Modern ES5-compatible browsers (Chrome 60+, Firefox 55+, Safari 11+)

---

## Release History

| Version | Release Date | Major Features |
|---------|--------------|-----------------|
| 0.4.0 | 2026-03-21 | Flow Builder UX improvements, data type indicators, stage reordering, inline validation, keyboard shortcuts |
| 0.3.1 | 2026-03-21 | Flow Builder UX token upgrade, accessibility enhancements |
| 0.3.0 | 2026-03-20 | Data Flow Builder, in-memory rule engine |
| 0.2.0 | 2026-03-10 | Google Sheets OAuth, integrations page |
| 0.1.0 | 2026-02-15 | Core dashboard, dataset CRUD, SPA router |

---

## Unreleased

### Planned for 0.5.0 (Advanced Transformations)
- Complex join/merge operations with multiple keys
- Subquery and nested aggregation support
- Window functions (running total, rank, percent_rank, etc.)
- Date/time transformation stage (date parsing, formatting, arithmetic)
- Extended string manipulation functions (concat, substring, regex)
- Case expression support in formulas

### Planned for 0.6.0 (Dashboard Widgets)
- KPI card widget with trend indicators
- Line/bar/pie chart widgets with drill-down
- Data table widget with advanced filtering
- Formula widget (ExcelFormula.js)
- Custom metric calculations and variables
- Widget dark mode support

---

## Notes for Contributors

### Versioning Scheme
- **Major (X.0.0)**: Breaking changes or major architectural shifts
- **Minor (0.X.0)**: New features, backward compatible
- **Patch (0.0.X)**: Bug fixes and minor updates

### Commit Message Format
Use conventional commits:
- `feat: add data flow builder components`
- `fix: resolve schema inference for null values`
- `docs: update codebase summary`
- `refactor: simplify flow stage execution`

### Documentation Updates
Update CHANGELOG when:
- Adding new features or pages
- Removing or deprecating functionality
- Making breaking changes
- Adding new storage keys or data structures

Update `system-architecture.md` when:
- Adding new components or services
- Changing data flow patterns
- Modifying store APIs
