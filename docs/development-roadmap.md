# Development Roadmap

**Last Updated**: 2026-03-20

## Project Vision

Vibe Dashboard is a low-code data transformation and visualization platform. Users can create datasets from multiple sources, build visual data pipelines, and export results to reports or external systems.

## Release Phases

### Phase 1: Core Dashboard (COMPLETED)
**Status**: 100% — Released

- Hash-based SPA router with 6 pages
- Dataset CRUD (create, read, update, delete)
- localStorage persistence
- Basic UI with Sidebar, Header, Modal components
- Design system alignment (Base.vn colors, typography, spacing)

### Phase 2: Data Integrations (COMPLETED)
**Status**: 100% — Released

- Google Sheets OAuth via Google Identity Services (GIS)
- Sheets API v4 integration for live data fetch
- IntegrationStore for credential management
- Integrations management page
- Dataset Creator support for external data sources

**Deliverables**:
- OAuth flow with Client ID configuration
- Real-time Sheets data fetch and conversion
- Disconnect functionality with token revocation

### Phase 3: Data Flow Builder (COMPLETED)
**Status**: 100% — Released

- Visual pipeline editor with stage chain UI
- Rule-based transformation system (SQL-like syntax)
- 8 stage types: Source, Filter, Select, Aggregate, Sort, Limit, Formula, Pivot, Unpivot
- In-memory execution engine (FlowRuleEngine)
- Stage preview with schema inference
- Flow persistence in localStorage

**Deliverables**:
- flow-rule-engine.js — Rule translation and execution
- flow-builder/ component suite (7 files)
- flow-builder.css — Styling
- Pipeline page integration with Data Flow tab

### Phase 4: Advanced Transformations (IN PROGRESS)
**Status**: 0% — Planned

**Objectives**:
- Complex join/merge operations (left/right/inner/full outer)
- Subqueries and nested aggregations
- Window functions (running total, rank, etc.)
- Date/time transformations
- String manipulation functions

**Estimated Effort**: 3-4 weeks

### Phase 5: Dashboard Widgets (IN PROGRESS)
**Status**: 0% — Planned

**Objectives**:
- KPI cards with trend indicators
- Line/bar/pie chart widgets
- Sortable data tables with pagination
- Formula widgets (ExcelFormula.js integration)
- Gauge and progress widgets
- Custom metric calculations

**Estimated Effort**: 4-5 weeks

### Phase 6: Deployment & Export (PLANNED)
**Status**: 0% — Planned

**Objectives**:
- Export datasets to CSV/JSON/Excel
- Scheduled data refresh
- Report generation (PDF/HTML)
- Integration with BI tools (Tableau, PowerBI, Looker)
- Version history and rollback

**Estimated Effort**: 3-4 weeks

### Phase 7: Analytics & Collaboration (BACKLOG)
**Status**: 0% — Future consideration

**Objectives**:
- User authentication and permissions
- Shared dashboards and datasets
- Audit logging
- Usage analytics
- Team collaboration features

**Estimated Effort**: 6+ weeks

## Milestone Timeline

| Milestone | Phase | Target Date | Status |
|-----------|-------|-------------|--------|
| Core Dashboard MVP | 1 | 2026-02-15 | Completed |
| Google Sheets Integration | 2 | 2026-03-10 | Completed |
| Data Flow Builder | 3 | 2026-03-20 | Completed |
| Advanced Transformations | 4 | 2026-05-15 | In Progress |
| Dashboard Widgets | 5 | 2026-07-01 | Planned |
| Deployment & Export | 6 | 2026-09-01 | Planned |

## Feature Priorities

### High Priority (Next 4 Weeks)

1. Complex join/merge in Flow Builder
2. More aggregate functions (median, stddev, percentile)
3. Date transformation stage
4. Stage error handling and validation messages

### Medium Priority (4-8 Weeks)

5. Dashboard widget framework
6. KPI and chart widget types
7. Data table widget with sorting
8. CSV export functionality

### Low Priority (8+ Weeks)

9. Advanced analytics (correlation, regression)
10. ML-based data quality suggestions
11. Data lineage tracking
12. Collaboration features

## Known Constraints

- **ES5 Only**: No modern JS syntax; must support older browsers
- **No Build Tool**: Script tags only; no bundler or transpiler
- **localStorage Limits**: ~5MB per origin; may need IndexedDB for large pipelines
- **CORS**: External API calls subject to browser CORS policy
- **No Backend**: All processing in-browser; scalability limited to client resources

## Next Steps

1. **Immediate (This Week)**: Validate Data Flow Builder with user testing; collect feedback
2. **Short Term (Next 2 Weeks)**: Implement join/merge enhancements and additional aggregation functions
3. **Medium Term (Next 4 Weeks)**: Begin dashboard widget implementation
4. **Long Term (Next 8 Weeks)**: Plan export/deployment strategy and collaboration features

## Success Metrics

- **User Adoption**: 50+ active users creating datasets
- **Feature Usage**: 80%+ users leverage at least 3 transformation stages
- **Data Throughput**: Support pipelines with 100K+ rows
- **Uptime**: 99.9% availability (localStorage-backed, no server deps)
- **Performance**: Flow execution under 5 seconds for 100K rows
