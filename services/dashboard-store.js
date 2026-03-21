/**
 * dashboard-store.js
 * Multi-dashboard persistence layer using localStorage.
 * Replaces LayoutStore as the primary widget/layout store.
 *
 * Schema per dashboard:
 *   { id, name, createdAt, ownerId, widgets, permissions, sharedToken }
 *
 * API:
 *   DashboardStore.init()
 *   DashboardStore.list()
 *   DashboardStore.get(id)
 *   DashboardStore.getActive()
 *   DashboardStore.setActive(id)
 *   DashboardStore.create(name)
 *   DashboardStore.rename(id, name)
 *   DashboardStore.remove(id)
 *   DashboardStore.addWidget(cfg)
 *   DashboardStore.removeWidget(id)
 *   DashboardStore.updatePositions(items)
 *   DashboardStore.save()
 *   DashboardStore.addPermission(dashboardId, userId, role)
 *   DashboardStore.removePermission(dashboardId, userId)
 *   DashboardStore.getMyRole(dashboardId)
 *   DashboardStore.generateShareToken(id)
 *   DashboardStore.revokeShareToken(id)
 *   DashboardStore.generateId()
 */

var DashboardStore = (function () {
  'use strict';

  var LS_KEY        = 'vibe-dashboards';
  var LS_ACTIVE_KEY = 'vibe-active-dashboard';
  var LS_LEGACY_KEY = 'vibe-dashboard-layout';
  var LS_SEED_VER   = 'vibe-seed-v3';        /* bump to re-seed on next load */
  var LOCAL_USER_ID = 'user-local';

  /* Default demo widgets — mirrors original LayoutStore defaults */
  var _defaultWidgets = [
    { id: 'w-sales-bar',   title: 'Revenue by Category', pipelineOutputId: 'sales-etl-out',   view: 'bar',   xAxis: 'category',   yAxis: 'amount_sum', x: 0, y: 0, w: 6, h: 5 },
    { id: 'w-sales-table', title: 'Sales Detail Table',  pipelineOutputId: 'sales-etl-out',   view: 'table', xAxis: 'category',   yAxis: 'amount_sum', x: 6, y: 0, w: 6, h: 5 },
    { id: 'w-events-pie',  title: 'Events by Type',      pipelineOutputId: 'user-events-out', view: 'pie',   xAxis: 'event_type', yAxis: 'value',      x: 0, y: 5, w: 4, h: 5 },
    { id: 'w-funnel-line', title: 'Funnel Conversion',   pipelineOutputId: 'funnel-out',      view: 'bar',   xAxis: 'stage',      yAxis: 'visitors',   x: 4, y: 5, w: 8, h: 5 }
  ];

  var _dashboards = [];
  var _activeId   = null;

  /* ── ID generation ── */

  function generateId() {
    return 'db-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  }

  /* ── Persistence helpers ── */

  function _saveAll() {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(_dashboards));
      if (_activeId) {
        localStorage.setItem(LS_ACTIVE_KEY, _activeId);
      }
    } catch (e) {
      console.warn('[DashboardStore] save failed:', e);
    }
  }

  function _makeDashboard(name, widgets, description, icon, iconColor) {
    var now = new Date().toISOString();
    return {
      id:           generateId(),
      name:         name || 'Untitled Dashboard',
      description:  description || '',
      icon:         icon || 'grid',
      iconColor:    iconColor || '#1E88E5',
      createdAt:    now,
      updatedAt:    now,
      lastOpenedAt: null,
      ownerId:      LOCAL_USER_ID,
      widgets:      widgets || [],
      permissions:  [{ userId: LOCAL_USER_ID, role: 'owner' }],
      sharedToken:  null
    };
  }

  /* ── Init ── */

  function init() {
    /* If seed version doesn't match, wipe old data and re-seed */
    if (localStorage.getItem(LS_SEED_VER) !== 'done') {
      localStorage.removeItem(LS_KEY);
      localStorage.removeItem(LS_ACTIVE_KEY);
      localStorage.removeItem(LS_LEGACY_KEY);
    }

    /* Load existing store */
    try {
      var raw = localStorage.getItem(LS_KEY);
      if (raw) {
        var parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length) {
          _dashboards = parsed;
          var savedActive = localStorage.getItem(LS_ACTIVE_KEY);
          var found = _dashboards.filter(function (d) { return d.id === savedActive; });
          _activeId = found.length ? savedActive : _dashboards[0].id;
          return;
        }
      }
    } catch (e) { /* fall through */ }

    /* One-time migration from legacy LayoutStore key */
    var legacyWidgets = null;
    try {
      var legacyRaw = localStorage.getItem(LS_LEGACY_KEY);
      if (legacyRaw) {
        var legacyParsed = JSON.parse(legacyRaw);
        if (Array.isArray(legacyParsed) && legacyParsed.length) {
          legacyWidgets = legacyParsed;
        }
      }
    } catch (e) { /* ignore */ }

    /* Discard legacy single-widget fallback — use seeded widgets below */
    void legacyWidgets;

    /* ── Seed with realistic CEO-level dashboards ── */
    var now = Date.now();
    var min = 60000;
    var hr  = 3600000;
    var day = 86400000;

    function _ts(msAgo) { return new Date(now - msAgo).toISOString(); }

    var seeds = [
      {
        name: 'Executive Summary',
        description: 'Company-wide KPIs for the CEO: revenue by category, event breakdown, funnel overview, and sales detail.',
        icon: 'grid', iconColor: '#1E88E5',
        createdAt: _ts(30 * day), updatedAt: _ts(2 * hr), lastOpenedAt: _ts(20 * min),
        widgets: [
          { id: 'ex-w1', title: 'Revenue by Category',   pipelineOutputId: 'sales-etl-out',   view: 'bar',   xAxis: 'category',   yAxis: 'amount_sum',       x: 0, y: 0, w: 6, h: 5 },
          { id: 'ex-w2', title: 'Events by Type',         pipelineOutputId: 'user-events-out', view: 'pie',   xAxis: 'event_type', yAxis: 'value',            x: 6, y: 0, w: 6, h: 5 },
          { id: 'ex-w3', title: 'Funnel Overview',        pipelineOutputId: 'funnel-out',      view: 'bar',   xAxis: 'stage',      yAxis: 'visitors',         x: 0, y: 5, w: 8, h: 5 },
          { id: 'ex-w4', title: 'Sales Detail Table',     pipelineOutputId: 'sales-etl-out',   view: 'table', xAxis: 'category',   yAxis: 'amount_sum',       x: 8, y: 5, w: 4, h: 5 }
        ]
      },
      {
        name: 'Revenue & Sales Pipeline',
        description: 'Monthly revenue vs target, margin by category, top accounts, and full sales transaction detail.',
        icon: 'bar', iconColor: '#43A047',
        createdAt: _ts(25 * day), updatedAt: _ts(1 * day), lastOpenedAt: _ts(3 * hr),
        widgets: [
          { id: 'rv-w1', title: 'Revenue by Category',   pipelineOutputId: 'sales-etl-out', view: 'bar',   xAxis: 'category', yAxis: 'amount_sum', x: 0, y: 0, w: 7, h: 5 },
          { id: 'rv-w2', title: 'Gross Margin by Category', pipelineOutputId: 'sales-etl-out', view: 'bar', xAxis: 'category', yAxis: 'margin',     x: 7, y: 0, w: 5, h: 5 },
          { id: 'rv-w3', title: 'Sales Transactions',    pipelineOutputId: 'sales-etl-out', view: 'table', xAxis: 'category', yAxis: 'amount_sum', x: 0, y: 5, w: 12, h: 5 }
        ]
      },
      {
        name: 'Marketing Performance',
        description: 'Campaign ROI, lead acquisition by channel, conversion funnel, and cost-per-lead trend.',
        icon: 'line', iconColor: '#8E24AA',
        createdAt: _ts(20 * day), updatedAt: _ts(3 * day), lastOpenedAt: _ts(1 * day),
        widgets: [
          { id: 'mk-w1', title: 'Events by Type (Pie)',  pipelineOutputId: 'user-events-out', view: 'pie',   xAxis: 'event_type', yAxis: 'value',            x: 0, y: 0, w: 4, h: 5 },
          { id: 'mk-w2', title: 'Event Volume (Bar)',    pipelineOutputId: 'user-events-out', view: 'bar',   xAxis: 'event_type', yAxis: 'count',            x: 4, y: 0, w: 8, h: 5 },
          { id: 'mk-w3', title: 'Funnel Conversion',    pipelineOutputId: 'funnel-out',      view: 'bar',   xAxis: 'stage',      yAxis: 'conversion_rate',  x: 0, y: 5, w: 8, h: 5 },
          { id: 'mk-w4', title: 'Funnel Stages Table',  pipelineOutputId: 'funnel-out',      view: 'table', xAxis: 'stage',      yAxis: 'visitors',         x: 8, y: 5, w: 4, h: 5 }
        ]
      },
      {
        name: 'Financial Overview',
        description: 'Revenue distribution, cost vs revenue by category, margin analysis, and full P&L breakdown.',
        icon: 'pie', iconColor: '#F57C00',
        createdAt: _ts(18 * day), updatedAt: _ts(4 * day), lastOpenedAt: null,
        widgets: [
          { id: 'fi-w1', title: 'Revenue Distribution',  pipelineOutputId: 'sales-etl-out', view: 'pie',   xAxis: 'category', yAxis: 'amount_sum', x: 0, y: 0, w: 4, h: 5 },
          { id: 'fi-w2', title: 'Cost by Category',      pipelineOutputId: 'sales-etl-out', view: 'bar',   xAxis: 'category', yAxis: 'cost_sum',   x: 4, y: 0, w: 8, h: 5 },
          { id: 'fi-w3', title: 'Margin % by Category',  pipelineOutputId: 'sales-etl-out', view: 'bar',   xAxis: 'category', yAxis: 'margin_pct', x: 0, y: 5, w: 6, h: 5 },
          { id: 'fi-w4', title: 'Revenue vs Cost Table', pipelineOutputId: 'sales-etl-out', view: 'table', xAxis: 'category', yAxis: 'amount_sum', x: 6, y: 5, w: 6, h: 5 }
        ]
      },
      {
        name: 'Operations & Delivery',
        description: 'On-time delivery rate, support ticket SLA, team utilization, and incident summary by stage.',
        icon: 'table', iconColor: '#00897B',
        createdAt: _ts(15 * day), updatedAt: _ts(5 * day), lastOpenedAt: null,
        widgets: [
          { id: 'op-w1', title: 'Funnel Stage Volumes',  pipelineOutputId: 'funnel-out',      view: 'bar',   xAxis: 'stage',      yAxis: 'visitors',   x: 0, y: 0, w: 8, h: 5 },
          { id: 'op-w2', title: 'Events Overview Table', pipelineOutputId: 'user-events-out', view: 'table', xAxis: 'event_type', yAxis: 'count',      x: 8, y: 0, w: 4, h: 5 },
          { id: 'op-w3', title: 'Conversion Rate Table', pipelineOutputId: 'funnel-out',      view: 'table', xAxis: 'stage',      yAxis: 'conversion_rate', x: 0, y: 5, w: 12, h: 5 }
        ]
      },
      {
        name: 'Product & Growth Metrics',
        description: 'DAU/MAU ratio, feature adoption by event type, retention cohorts, and funnel drop-off analysis.',
        icon: 'star', iconColor: '#E53935',
        createdAt: _ts(10 * day), updatedAt: _ts(6 * hr), lastOpenedAt: _ts(2 * day),
        widgets: [
          { id: 'pg-w1', title: 'User Event Trend',     pipelineOutputId: 'user-events-out', view: 'bar',   xAxis: 'event_type', yAxis: 'count',           x: 0, y: 0, w: 6, h: 5 },
          { id: 'pg-w2', title: 'Engagement Breakdown', pipelineOutputId: 'user-events-out', view: 'pie',   xAxis: 'event_type', yAxis: 'value',           x: 6, y: 0, w: 6, h: 5 },
          { id: 'pg-w3', title: 'Funnel Drop-off',      pipelineOutputId: 'funnel-out',      view: 'bar',   xAxis: 'stage',      yAxis: 'conversion_rate', x: 0, y: 5, w: 12, h: 5 }
        ]
      }
    ];

    _dashboards = seeds.map(function (s) {
      var db = _makeDashboard(s.name, s.widgets, s.description, s.icon, s.iconColor);
      db.createdAt    = s.createdAt;
      db.updatedAt    = s.updatedAt;
      db.lastOpenedAt = s.lastOpenedAt;
      return db;
    });
    _activeId = _dashboards[0].id;
    _saveAll();
    try { localStorage.setItem(LS_SEED_VER, 'done'); } catch (e) { /* ignore */ }
  }

  /* ── List / Get ── */

  function list() {
    return _dashboards.slice();
  }

  function get(id) {
    var found = _dashboards.filter(function (d) { return d.id === id; });
    return found.length ? found[0] : null;
  }

  function getActive() {
    return get(_activeId);
  }

  function setActive(id) {
    var db = get(id);
    if (db) {
      _activeId = id;
      db.lastOpenedAt = new Date().toISOString();
      try { localStorage.setItem(LS_ACTIVE_KEY, id); } catch (e) { /* ignore */ }
      _saveAll();
    }
  }

  /* ── CRUD ── */

  function create(name, description, icon, iconColor) {
    var db = _makeDashboard(name || 'Untitled Dashboard', [], description || '', icon || 'grid', iconColor || '#1E88E5');
    _dashboards.push(db);
    _activeId = db.id;
    _saveAll();
    return db;
  }

  function rename(id, name) {
    var db = get(id);
    if (!db || !name) return;
    db.name = name;
    db.updatedAt = new Date().toISOString();
    _saveAll();
  }

  function remove(id) {
    _dashboards = _dashboards.filter(function (d) { return d.id !== id; });
    if (_activeId === id) {
      _activeId = _dashboards.length ? _dashboards[0].id : null;
      try { localStorage.setItem(LS_ACTIVE_KEY, _activeId || ''); } catch (e) { /* ignore */ }
    }
    _saveAll();
  }

  /* ── Widget ops (operate on active dashboard) ── */

  function addWidget(cfg) {
    var db = getActive();
    if (!db || !cfg || !cfg.id) return;
    db.widgets = db.widgets.filter(function (w) { return w.id !== cfg.id; });
    db.widgets.push(cfg);
    db.updatedAt = new Date().toISOString();
    _saveAll();
  }

  function removeWidget(id) {
    var db = getActive();
    if (!db) return;
    db.widgets = db.widgets.filter(function (w) { return w.id !== id; });
    db.updatedAt = new Date().toISOString();
    _saveAll();
  }

  function updatePositions(items) {
    var db = getActive();
    if (!db || !Array.isArray(items)) return;
    items.forEach(function (item) {
      var stored = db.widgets.filter(function (w) { return w.id === item.id; });
      if (stored.length) {
        var w = stored[0];
        if (item.x !== undefined) w.x = item.x;
        if (item.y !== undefined) w.y = item.y;
        if (item.w !== undefined) w.w = item.w;
        if (item.h !== undefined) w.h = item.h;
      }
    });
    db.updatedAt = new Date().toISOString();
    _saveAll();
  }

  function save() {
    _saveAll();
  }

  /* ── Permission ops ── */

  function addPermission(dashboardId, userId, role) {
    var db = get(dashboardId);
    if (!db || !userId || !role) return;
    /* Remove existing entry for userId */
    db.permissions = db.permissions.filter(function (p) { return p.userId !== userId; });
    db.permissions.push({ userId: userId, role: role });
    _saveAll();
  }

  function removePermission(dashboardId, userId) {
    var db = get(dashboardId);
    if (!db || !userId) return;
    /* Never remove the owner */
    db.permissions = db.permissions.filter(function (p) {
      return p.userId !== userId || p.role === 'owner';
    });
    _saveAll();
  }

  function getMyRole(dashboardId) {
    var db = get(dashboardId);
    if (!db) return null;
    var mine = db.permissions.filter(function (p) { return p.userId === LOCAL_USER_ID; });
    return mine.length ? mine[0].role : null;
  }

  /* ── Share token ── */

  function _randomToken() {
    var arr = new Uint8Array(6);
    (window.crypto || window.msCrypto).getRandomValues(arr);
    return Array.prototype.map.call(arr, function(b) { return (b < 16 ? '0' : '') + b.toString(16); }).join('');
  }

  function generateShareToken(id) {
    var db = get(id);
    if (!db) return null;
    if (!db.sharedToken) {
      db.sharedToken = _randomToken();
      _saveAll();
    }
    return db.sharedToken;
  }

  function revokeShareToken(id) {
    var db = get(id);
    if (!db) return;
    db.sharedToken = null;
    _saveAll();
  }

  function getRecentlyOpened(limit) {
    var sorted = _dashboards
      .filter(function (d) { return !!d.lastOpenedAt; })
      .sort(function (a, b) { return b.lastOpenedAt > a.lastOpenedAt ? 1 : -1; });
    return limit ? sorted.slice(0, limit) : sorted;
  }

  return {
    init:               init,
    list:               list,
    get:                get,
    getActive:          getActive,
    setActive:          setActive,
    create:             create,
    rename:             rename,
    remove:             remove,
    addWidget:          addWidget,
    removeWidget:       removeWidget,
    updatePositions:    updatePositions,
    save:               save,
    addPermission:      addPermission,
    removePermission:   removePermission,
    getMyRole:          getMyRole,
    generateShareToken: generateShareToken,
    revokeShareToken:   revokeShareToken,
    generateId:         generateId,
    getRecentlyOpened:  getRecentlyOpened
  };
}());

window.DashboardStore = DashboardStore;
