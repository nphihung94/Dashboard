# System Architecture

**Last Updated**: 2026-03-21

## Overview

Vibe Dashboard is a single-page application (SPA) with a modular, layered architecture. It separates concerns into stores (state management), pages (route handlers), components (UI modules), and services (business logic).

## High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        Browser App (SPA)                         │
├─────────────────────────────────────────────────────────────────┤
│  Pages: Home | Dashboard | Dataset | Pipeline | Settings | Integrations │
├─────────────────────────────────────────────────────────────────┤
│          Components: Sidebar | Header | Modal | Dataset Source   │
│          Flow Builder: Shell | Panels | Forms | Preview          │
├─────────────────────────────────────────────────────────────────┤
│ Stores: DatasetStore | LayoutStore | IntegrationStore          │
├─────────────────────────────────────────────────────────────────┤
│ Services: FlowRuleEngine | PipelineEngine | IntegrationStore   │
├─────────────────────────────────────────────────────────────────┤
│ Persistence: localStorage (datasets, flows, integrations)        │
└─────────────────────────────────────────────────────────────────┘
```

## Layer 1: Pages (Route Handlers)

Each page is a self-contained module that:
1. Reads from stores
2. Renders UI by composing components
3. Responds to user input and triggers store updates

### Page List

| Page | Route | Purpose |
|------|-------|---------|
| Home | `#home` | Welcome screen with quick links |
| Dashboard | `#dashboard` | List saved datasets; create/edit/delete operations |
| Dataset Creator | `#dataset` | Multi-step wizard for new dataset creation |
| Pipeline Builder | `#pipeline` | Data flow and transformation pipeline editor |
| Settings | `#settings` | User preferences and configuration |
| Integrations | `#integrations` | OAuth credential management for external data sources |

## Layer 2: Components (UI Modules)

### Core Components

- **Sidebar** — Navigation and active page highlighting
- **Page Header** — Breadcrumb, title, status indicators
- **Modal** — Generic dialog wrapper for overlays
- **Dataset Source Integration** — File/API/Pipeline/Database/OAuth data source selector

### Data Flow Builder Components

Composable modules for building data transformation pipelines:

- **FlowBuilderShell** — Main container; renders stage chain and delegates to stage panels
- **SourceStagePanel** — Source dataset selection with join/merge configuration
- **TransformStagePanel** — Transform stage editor (filter, select, aggregate, sort, limit, formula, pivot, unpivot)
- **StageRuleForms** — Basic form inputs (conditions, field selections, aggregations)
- **StageRuleFormsAdvanced** — Complex forms (pivot rules, formula definitions)
- **FlowBuilderStageOps** — Stage operations (add/remove/save/run); validates and executes transformations
- **StagePreviewTable** — Output preview with schema and sample rows

## Layer 3: Stores (State Management)

Stores are singleton IIFE modules that manage application state with localStorage persistence.

### DatasetStore

**Purpose**: Dataset CRUD, pipeline management, flow persistence

**Key Methods**:
- `init()` — Load datasets from localStorage
- `createDataset(config)` — Add new dataset
- `getDataset(id)` — Retrieve by ID
- `updateDataset(id, updates)` — Modify dataset
- `deleteDataset(id)` — Remove dataset
- `listDatasets()` — Get all datasets
- `createPipeline(config)` — Add new pipeline
- `getPipeline(id)` — Retrieve pipeline
- `getFlowDef(pipelineId)` — Load flow definition
- `saveFlowDef(pipelineId, flowDef)` — Persist flow definition

**Storage Key**: `vibe-datasets` (localStorage)

### LayoutStore

**Purpose**: UI state (sidebar visibility, modals, active pages)

**Key Methods**:
- `toggleSidebar()` — Toggle sidebar visibility
- `toggleModal(id, state)` — Show/hide modal
- `setActivePage(pageId)` — Track current page

### IntegrationStore

**Purpose**: OAuth credential persistence for external integrations

**Key Methods**:
- `init()` — Load integrations from localStorage
- `save(provider, tokenData)` — Store OAuth token
- `get(provider)` — Retrieve credentials
- `list()` — Get all connected providers
- `remove(provider)` — Delete integration

**Storage Key**: `vibe-integrations` (localStorage)

## Layer 4: Services (Business Logic)

### FlowRuleEngine

Translates visual rule definitions into executable stage transformations.

**Purpose**: Schema inference, rule translation, validation, and execution

**Key Methods**:
- `inferSchema(data)` — Detect column types from sample rows
- `translateStage(flowStage)` — Convert visual rule to PipelineStage config
- `generateDisplayText(flowStage)` — Human-readable stage description
- `validateStage(flowStage, inputSchema)` — Check stage correctness
- `executeFlowStage(flowStage, inputData, store)` — Run stage in-memory

**Supported Stages**:
- Source — Load dataset or join multiple datasets
- Filter — Row-level conditions (AND/OR logic)
- Select — Column projection (keep/drop columns)
- Aggregate — Group-by with count/sum/avg/min/max aggregations
- Sort — Column-based sorting (asc/desc)
- Limit — Restrict row count
- Formula — Add computed columns with JS expressions
- Pivot — Transform rows to columns
- Unpivot — Transform columns to rows

### PipelineEngine

Executes pipeline stages sequentially.

**Key Methods**:
- `runFlow(flowDef)` — Execute all stages in sequence
- `validateFlow(flowDef, store)` — Check all stages for errors

## Data Flow

### Pipeline Execution Flow

```
1. User clicks "Run Flow" on Pipeline page
2. FlowBuilderStageOps.runFlow() invoked
3. For each stage in flowDef:
   a. FlowRuleEngine.translateStage() → PipelineStage config
   b. PipelineEngine.executeStage() → run in-memory
   c. StagePreviewTable rendered with output
   d. If error → display to user, stop
4. Final output dataset stored/displayed
```

### State Persistence Flow

```
1. User modifies flow definition in FlowBuilderShell
2. FlowBuilderStageOps detects change
3. DatasetStore.saveFlowDef() persists to localStorage
4. On next visit → DatasetStore.getFlowDef() restores state
```

### OAuth Integration Flow

```
1. User navigates to Integrations page
2. Enters Google OAuth Client ID → stored in localStorage
3. Clicks "Connect" → loads Google Identity Services (GIS)
4. GIS popup → user grants consent
5. Access token → IntegrationStore.save('google-sheets', tokenData)
6. In Dataset Creator:
   - User pastes Google Sheets URL
   - dataset-source-integration.js fetches via Sheets API v4
   - Converts sheet rows to dataset objects
   - Saves as new dataset
```

## Persistence Strategy

### localStorage Structure

| Key | Contents | Max Size |
|-----|----------|----------|
| `vibe-datasets` | All datasets + pipelines (JSON) | ~5MB |
| `vibe-integrations` | OAuth tokens + provider metadata | ~100KB |
| `vibe-gis-client-id` | Google OAuth Client ID | ~500B |

## Performance Considerations

- **In-Memory Execution**: All transformations run in JavaScript; no backend required
- **Sample Data**: Preview uses first 100 rows for schema inference
- **Lazy Loading**: Google Identity Services script loaded only when needed
- **localStorage Limits**: Monitor dataset count; consider archival for large pipelines

## Security

- **OAuth Tokens**: Stored in browser localStorage (not secure for sensitive data; consider IndexedDB with encryption for production)
- **Data**: All processing happens in-browser; no external API calls except Google Sheets fetch
- **CORS**: Sheets API requests include OAuth bearer token; browser enforces CORS

## Design System

### Token-Driven Architecture

All styling uses CSS custom properties (tokens) defined in `css/tokens.css`:

**Color Tokens**
- Brand colors, neutral palette, status colors, status dots, pipeline stage icons
- Single source of truth for theming and consistency

**Spacing & Layout Tokens**
- 8px grid scale (`--spacing-4` through `--spacing-32`)
- Sidebar width, header heights, border radius, shadow levels

**Animation Tokens**
- `--flow-transition-fast: 150ms` — rapid feedback (hover, dot pulse)
- `--flow-transition-normal: 200ms` — standard animations (drawer, chevron)

### Flow Builder Styling (`css/flow-builder.css`)

Complete token-based CSS architecture:
- 2-column layout with accordion left panel (260px) and config panel right
- Stage icon badges (20×20px) with per-type color tokens
- Status dots (8px) with ring shadows and error pulse animation
- Context menu with fade-in animation and left-accent hover state
- Drawer with deceleration easing (cubic-bezier) and clickable backdrop
- Full accessibility: `:focus-visible` outlines, `prefers-reduced-motion` support

**Key Features**:
- No hardcoded colors or sizes
- Smooth transitions with consistent timing
- Error states with animated pulse
- Keyboard navigation and motion-preference compliance

## Extension Points

1. **New Stage Types**: Add to FlowRuleEngine.translateStage() switch statement
2. **New Data Sources**: Extend dataset-source-integration.js with provider modules
3. **Custom Formulas**: Expand formula stage execution in FlowRuleEngine
4. **Backend Integration**: Add PipelineEngine.executeServerSide() for large datasets
5. **Dark Mode**: Add dark mode token variants to `css/tokens.css` and conditional CSS
6. **Brand Theming**: Override token values in CSS or JS to support custom color schemes
