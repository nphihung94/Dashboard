/**
 * demo-datasets.js
 * Three demo pipelines with raw source data + pipeline configs.
 * Registers sources and pipeline configs into DatasetStore on load.
 *
 * Pipelines:
 *   1. Sales ETL        — CSV source → clean → group → compute → sort → output: sales-etl-out
 *   2. User Events      — JSON array → filter → group → sort → output: user-events-out
 *   3. Funnel Analysis  — JSON array → addColumn → sort → output: funnel-out
 */

var DemoDatasets = (function () {
  'use strict';

  /* ── Raw source data ── */

  var _salesRaw = [
    { id: 'S001', date: '2026-01-05', category: 'Electronics', region: 'North', amount: 1200, cost: 800, status: 'completed' },
    { id: 'S002', date: '2026-01-08', category: 'Apparel',     region: 'South', amount: 450,  cost: 200, status: 'completed' },
    { id: 'S003', date: '2026-01-12', category: 'Electronics', region: 'East',  amount: 980,  cost: 600, status: 'completed' },
    { id: 'S004', date: '2026-01-15', category: 'Food',        region: 'West',  amount: 320,  cost: 150, status: 'completed' },
    { id: 'S005', date: '2026-01-18', category: 'Apparel',     region: 'North', amount: 670,  cost: 310, status: 'pending'   },
    { id: 'S006', date: '2026-01-22', category: 'Electronics', region: 'South', amount: 2100, cost: 1400, status: 'completed' },
    { id: 'S007', date: '2026-02-01', category: 'Food',        region: 'East',  amount: 890,  cost: 420, status: 'completed' },
    { id: 'S008', date: '2026-02-05', category: 'Electronics', region: 'West',  amount: 1500, cost: 950, status: 'completed' },
    { id: 'S009', date: '2026-02-09', category: 'Apparel',     region: 'North', amount: 340,  cost: 160, status: 'completed' },
    { id: 'S010', date: '2026-02-14', category: 'Food',        region: 'South', amount: 560,  cost: 270, status: 'completed' },
    { id: 'S011', date: '2026-02-18', category: 'Electronics', region: 'East',  amount: 1750, cost: 1100, status: 'completed' },
    { id: 'S012', date: '2026-02-22', category: 'Apparel',     region: 'West',  amount: 820,  cost: 380, status: 'completed' },
    { id: 'S013', date: '2026-03-01', category: 'Food',        region: 'North', amount: 410,  cost: 190, status: 'completed' },
    { id: 'S014', date: '2026-03-05', category: 'Electronics', region: 'South', amount: 3200, cost: 2100, status: 'completed' },
    { id: 'S015', date: '2026-03-08', category: 'Apparel',     region: 'East',  amount: 590,  cost: 280, status: 'completed' },
    { id: 'S016', date: '2026-03-12', category: 'Food',        region: 'West',  amount: 730,  cost: 340, status: 'completed' },
    { id: 'S017', date: '2026-03-15', category: 'Electronics', region: 'North', amount: 1100, cost: 720, status: 'pending'   },
    { id: 'S018', date: '2026-03-18', category: 'Apparel',     region: 'South', amount: 460,  cost: 210, status: 'completed' },
    { id: 'S019', date: '2026-03-19', category: 'Food',        region: 'East',  amount: 680,  cost: 320, status: 'completed' },
    { id: 'S020', date: '2026-03-19', category: 'Electronics', region: 'West',  amount: 2400, cost: 1600, status: 'completed' }
  ];

  var _userEventsRaw = [
    { event_id: 'E001', user_id: 'U10', event_type: 'signup',    user_segment: 'new',      value: 1,  timestamp: '2026-03-01T09:00:00Z' },
    { event_id: 'E002', user_id: 'U11', event_type: 'purchase',  user_segment: 'returning', value: 89, timestamp: '2026-03-01T10:30:00Z' },
    { event_id: 'E003', user_id: 'U12', event_type: 'pageview',  user_segment: 'new',      value: 1,  timestamp: '2026-03-02T08:00:00Z' },
    { event_id: 'E004', user_id: 'U10', event_type: 'purchase',  user_segment: 'new',      value: 45, timestamp: '2026-03-02T11:00:00Z' },
    { event_id: 'E005', user_id: 'U13', event_type: 'signup',    user_segment: 'new',      value: 1,  timestamp: '2026-03-03T14:00:00Z' },
    { event_id: 'E006', user_id: 'U11', event_type: 'pageview',  user_segment: 'returning', value: 1,  timestamp: '2026-03-04T09:30:00Z' },
    { event_id: 'E007', user_id: 'U14', event_type: 'purchase',  user_segment: 'returning', value: 120, timestamp: '2026-03-05T15:00:00Z' },
    { event_id: 'E008', user_id: 'U15', event_type: 'signup',    user_segment: 'new',      value: 1,  timestamp: '2026-03-06T10:00:00Z' },
    { event_id: 'E009', user_id: 'U13', event_type: 'purchase',  user_segment: 'new',      value: 67, timestamp: '2026-03-07T13:00:00Z' },
    { event_id: 'E010', user_id: 'U16', event_type: 'pageview',  user_segment: 'returning', value: 1,  timestamp: '2026-03-08T08:30:00Z' },
    { event_id: 'E011', user_id: 'U14', event_type: 'pageview',  user_segment: 'returning', value: 1,  timestamp: '2026-03-09T11:00:00Z' },
    { event_id: 'E012', user_id: 'U17', event_type: 'signup',    user_segment: 'new',      value: 1,  timestamp: '2026-03-10T09:00:00Z' },
    { event_id: 'E013', user_id: 'U15', event_type: 'purchase',  user_segment: 'new',      value: 95, timestamp: '2026-03-11T16:00:00Z' },
    { event_id: 'E014', user_id: 'U18', event_type: 'pageview',  user_segment: 'returning', value: 1,  timestamp: '2026-03-12T10:00:00Z' },
    { event_id: 'E015', user_id: 'U17', event_type: 'purchase',  user_segment: 'new',      value: 55, timestamp: '2026-03-13T14:30:00Z' }
  ];

  var _funnelRaw = [
    { stage: 'Awareness',    visitors: 10000, conversions: 4200, date: '2026-03-01' },
    { stage: 'Interest',     visitors: 4200,  conversions: 1890, date: '2026-03-01' },
    { stage: 'Consideration', visitors: 1890, conversions: 756,  date: '2026-03-01' },
    { stage: 'Intent',       visitors: 756,   conversions: 302,  date: '2026-03-01' },
    { stage: 'Purchase',     visitors: 302,   conversions: 181,  date: '2026-03-01' },
    { stage: 'Awareness',    visitors: 11200, conversions: 4800, date: '2026-03-08' },
    { stage: 'Interest',     visitors: 4800,  conversions: 2100, date: '2026-03-08' },
    { stage: 'Consideration', visitors: 2100, conversions: 840,  date: '2026-03-08' },
    { stage: 'Intent',       visitors: 840,   conversions: 336,  date: '2026-03-08' },
    { stage: 'Purchase',     visitors: 336,   conversions: 201,  date: '2026-03-08' }
  ];

  /* ── Pipeline configs ── */

  var _pipelines = [
    {
      id: 'sales-etl',
      name: 'Sales Data ETL',
      type: 'ETL',
      description: 'Clean and aggregate sales transaction data by category.',
      tags: ['sales', 'etl', 'revenue'],
      status: 'healthy',
      schedule: { enabled: true, frequency: 'daily', time: '06:00' },
      stages: [
        { id: 's1', type: 'source',        config: { sourceId: 'sales-raw' } },
        { id: 's2', type: 'removeColumns', config: { keep: ['id','date','category','amount','cost','status','region'] } },
        { id: 's3', type: 'filterRows',    config: { logic: 'AND', conditions: [
          { field: 'status', operator: '=', value: 'completed' }
        ]}},
        { id: 's4', type: 'replaceValues', config: { column: 'category', replacements: [
          { find: 'Electronics', replace: 'Tech' },
          { find: 'Apparel',     replace: 'Clothing' }
        ]}},
        { id: 's5', type: 'groupBy',       config: { groupBy: ['category'], aggregates: [
          { field: 'amount', func: 'SUM',   as: 'amount_sum' },
          { field: 'id',     func: 'COUNT', as: 'id_count' },
          { field: 'amount', func: 'AVG',   as: 'amount_avg' },
          { field: 'cost',   func: 'SUM',   as: 'cost_sum' }
        ]}},
        { id: 's6', type: 'addColumn',     config: { columns: [
          { name: 'margin',     formula: 'amount_sum - cost_sum' },
          { name: 'margin_pct', formula: 'margin / amount_sum * 100' }
        ]}},
        { id: 's7', type: 'sort',          config: { field: 'amount_sum', direction: 'desc' } },
        { id: 's8', type: 'output',        config: { name: 'sales-etl-out' } }
      ]
    },
    {
      id: 'user-events',
      name: 'User Events Analysis',
      type: 'Analytics',
      description: 'Aggregate user events by type to identify engagement patterns.',
      tags: ['users', 'analytics', 'events'],
      status: 'healthy',
      schedule: { enabled: true, frequency: 'hourly', time: null },
      stages: [
        { id: 's1', type: 'source',     config: { sourceId: 'user-events-raw' } },
        { id: 's2', type: 'filterRows', config: { logic: 'OR', conditions: [
          { field: 'event_type', operator: '=', value: 'purchase' },
          { field: 'event_type', operator: '=', value: 'signup' },
          { field: 'event_type', operator: '=', value: 'pageview' }
        ]}},
        { id: 's3', type: 'groupBy',    config: { groupBy: ['event_type'], aggregates: [
          { field: 'value',    func: 'SUM',   as: 'value' },
          { field: 'event_id', func: 'COUNT', as: 'count' }
        ]}},
        { id: 's4', type: 'sort',       config: { field: 'count', direction: 'desc' } },
        { id: 's5', type: 'output',     config: { name: 'user-events-out' } }
      ]
    },
    {
      id: 'funnel-analysis',
      name: 'Funnel Analysis',
      type: 'Reporting',
      description: 'Calculate conversion rates across funnel stages.',
      tags: ['funnel', 'conversion', 'reporting'],
      status: 'warning',
      schedule: { enabled: false, frequency: 'weekly', time: '08:00' },
      stages: [
        { id: 's1', type: 'source',    config: { sourceId: 'funnel-raw' } },
        { id: 's2', type: 'groupBy',   config: { groupBy: ['stage'], aggregates: [
          { field: 'visitors',    func: 'SUM', as: 'visitors' },
          { field: 'conversions', func: 'SUM', as: 'conversions' }
        ]}},
        { id: 's3', type: 'addColumn', config: { columns: [
          { name: 'conversion_rate', formula: 'conversions / visitors * 100' }
        ]}},
        { id: 's4', type: 'output',    config: { name: 'funnel-out' } }
      ]
    }
  ];

  /* ── Registration ── */

  /**
   * Register all demo sources and pipeline configs into DatasetStore.
   * Called once during app init (after DatasetStore.init()).
   * Does NOT overwrite existing pipeline configs (allows user edits to persist).
   */
  function register() {
    var store = window.DatasetStore;
    if (!store) return;

    // Always register raw sources (in-memory only, no persistence needed)
    store.registerSource('sales-raw',       _salesRaw,      { name: 'Sales Raw',       sourcePipeline: 'sales-etl' });
    store.registerSource('user-events-raw', _userEventsRaw, { name: 'User Events Raw',  sourcePipeline: 'user-events' });
    store.registerSource('funnel-raw',      _funnelRaw,     { name: 'Funnel Raw',       sourcePipeline: 'funnel-analysis' });

    // Register pipeline configs only if not already saved in localStorage
    _pipelines.forEach(function (p) {
      if (!store.getPipeline(p.id)) {
        store.savePipeline(p);
      }
    });
  }

  return { register: register };
}());

window.DemoDatasets = DemoDatasets;
