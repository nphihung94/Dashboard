# Vibe Dashboard

A single-page application (SPA) for data pipeline management and dataset visualization. Built with vanilla JavaScript, jQuery, and plain HTML/CSS — no build step required.

## Features

- **Dashboard** — View, edit, and manage saved datasets
- **Dataset Creator** — Multi-step wizard to create datasets from files, APIs, databases, or external integrations
- **Pipeline Builder** — Visual data flow editor with transform stages (filter, select, aggregate, sort, formula, pivot, etc.)
- **Integrations** — Connect Google Sheets via OAuth; manage credentials per provider
- **Settings** — User preferences and configuration

## Tech Stack

| Layer | Tech |
|-------|------|
| UI | Vanilla JS (ES5), jQuery, HTML/CSS |
| Routing | Hash-based (`#home`, `#dashboard`, `#pipeline`, etc.) |
| State | In-memory stores + `localStorage` persistence |
| Fonts | Inter (Google Fonts) |
| Layout | Gridstack v10 |
| Auth | Google Identity Services (GIS) for OAuth |

## Getting Started

No build step or package install required.

### Prerequisites

- A modern browser (Chrome, Firefox, Edge)
- A static file server (or just open `index.html` directly)

### Run Locally

**Option 1 — Open directly:**
```bash
open index.html
# or double-click index.html in your file explorer
```

**Option 2 — Local server (recommended to avoid CORS issues):**
```bash
# Python
python -m http.server 8080

# Node.js
npx serve .

# VS Code
# Use the "Live Server" extension
```

Then open `http://localhost:8080` in your browser.

## Project Structure

```
Dashboard/
├── index.html              # App entry point
├── app.js                  # Router, page registry, app init
├── css/                    # Stylesheets (tokens, app, pipeline, flow-builder)
├── pages/                  # Page modules (home, dashboard, dataset, pipeline, settings, integrations)
├── components/             # Reusable UI components
│   ├── sidebar.js
│   ├── flow-builder/       # Data flow pipeline builder components
│   └── dataset-source-integration.js
├── services/               # Stores and business logic
│   ├── dataset-store.js
│   ├── layout-store.js
│   └── integration-store.js
├── demo-data/              # Sample datasets for development
└── docs/                   # Project documentation
```

## Pages & Routes

| Route | Page | Description |
|-------|------|-------------|
| `#home` | Home | Welcome screen with quick links |
| `#dashboard` | Dashboard | List and manage datasets |
| `#dataset` | Dataset Creator | Create new datasets via wizard |
| `#pipeline` | Pipeline Builder | Build data transformation flows |
| `#integrations` | Integrations | Manage OAuth connections |
| `#settings` | Settings | App preferences |

## Google Sheets Integration

1. Go to **Integrations** page
2. Enter your Google OAuth Client ID
3. Click **Connect** next to Google Sheets
4. Authorize via Google sign-in popup
5. In Dataset Creator, select **External Integration** as data source and provide a spreadsheet URL + range

## Data Persistence

All data is stored in `localStorage`:
- `vibe_datasets` — Saved datasets
- `vibe_flows` — Pipeline flow configurations
- `vibe_integrations` — OAuth credentials per provider

## Documentation

See `./docs/` for detailed docs:
- `codebase-summary.md` — Module-by-module breakdown
- `system-architecture.md` — Architecture layers and data flow
- `design-guidelines.md` — UI/UX standards
- `development-roadmap.md` — Feature roadmap and milestones
