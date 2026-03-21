/**
 * sidebar.js
 * Renders the 220px dark sidebar with General nav items (including Dashboards
 * as a subsection), and Pipeline groups. Re-renders when store changes via update().
 *
 * API:
 *   VibeSidebar.render($el, state)
 *   VibeSidebar.update(state)
 *
 * State shape:
 *   { activePage, activePipelineId, pipelines, dashboards, activeDashboardId }
 */

var VibeSidebar = (function () {
  'use strict';

  var _$el = null;
  var _lastState = {};

  /* Collapsible state */
  var _dashCollapsed = false;
  var _pipelineCollapsed = {};

  /* Chevron SVGs */
  var _chevronDownSvg  = '<svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><polyline points="2,4 6,8 10,4"/></svg>';
  var _chevronRightSvg = '<svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><polyline points="4,2 8,6 4,10"/></svg>';

  /* SVG icons */
  var _navIcons = {
    home:         '<svg class="sidebar__item-icon" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M2 6.5L8 2l6 4.5V14a1 1 0 01-1 1H3a1 1 0 01-1-1z"/><path d="M6 15V9h4v6"/></svg>',
    dashboard:    '<svg class="sidebar__item-icon" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="1" width="6" height="7" rx="1"/><rect x="9" y="1" width="6" height="4" rx="1"/><rect x="9" y="7" width="6" height="7" rx="1"/><rect x="1" y="10" width="6" height="5" rx="1"/></svg>',
    dataset:      '<svg class="sidebar__item-icon" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><ellipse cx="8" cy="4" rx="6" ry="2"/><path d="M2 4v4c0 1.1 2.7 2 6 2s6-.9 6-2V4"/><path d="M2 8v4c0 1.1 2.7 2 6 2s6-.9 6-2V8"/></svg>',
    settings:     '<svg class="sidebar__item-icon" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><circle cx="8" cy="8" r="2.5"/><path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.05 3.05l1.41 1.41M11.54 11.54l1.41 1.41M3.05 12.95l1.41-1.41M11.54 4.46l1.41-1.41"/></svg>',
    integrations: '<svg class="sidebar__item-icon" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 10a2.5 2.5 0 0 0 3.54 0l1.5-1.5a2.5 2.5 0 0 0-3.54-3.54L6.5 6"/><path d="M10 6a2.5 2.5 0 0 0-3.54 0l-1.5 1.5a2.5 2.5 0 0 0 3.54 3.54L9.5 10"/></svg>',
    pipeline:     '<svg class="sidebar__item-icon" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 1.5L4.5 8.5H8L5.5 14.5L14 7H10z"/></svg>',
    plus:         '<svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><line x1="6" y1="1" x2="6" y2="11"/><line x1="1" y1="6" x2="11" y2="6"/></svg>'
  };

  var _typeColors = {
    'ETL':       '#1E88E5',
    'Analytics': '#00897B',
    'Reporting': '#7B1FA2'
  };

  /* Pipe/flow SVG icon for pipeline type headers — zap/lightning bolt */
  var _pipeIconSvg = '<svg class="sidebar__pipe-icon" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10 1L4.5 9H9L6 15l9-8.5H10.5z"/></svg>';

  /* Small inline icons for dashboard type indicators */
  var _dashIcons = {
    grid:  '<svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor"><rect x="1" y="1" width="5" height="5" rx="1"/><rect x="10" y="1" width="5" height="5" rx="1"/><rect x="1" y="10" width="5" height="5" rx="1"/><rect x="10" y="10" width="5" height="5" rx="1"/></svg>',
    bar:   '<svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="1" y="6" width="3" height="9" rx="1"/><rect x="6" y="3" width="3" height="12" rx="1"/><rect x="11" y="8" width="3" height="7" rx="1"/></svg>',
    line:  '<svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><polyline points="1,12 5,6 8,9 12,4 15,7"/></svg>',
    pie:   '<svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M8 8L8 1.5A6.5 6.5 0 0 1 14.5 8Z" fill="currentColor" opacity="0.4" stroke="none"/><circle cx="8" cy="8" r="6.5"/></svg>',
    table: '<svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="1" y="1" width="14" height="14" rx="1"/><line x1="1" y1="5" x2="15" y2="5"/><line x1="6" y1="5" x2="6" y2="15"/></svg>',
    star:  '<svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor"><path d="M8 1l1.8 4H14l-3.4 2.5 1.3 4L8 9l-3.9 2.5 1.3-4L2 5h4.2z"/></svg>'
  };

  var _statusIcons = {
    healthy: '<svg class="sidebar__status-icon sidebar__status-icon--healthy" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="7" fill="#22c55e" opacity="0.15"/><circle cx="8" cy="8" r="7" stroke="#22c55e" stroke-width="1.5"/><polyline points="5,8.5 7,10.5 11,6" stroke="#22c55e" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    warning: '<svg class="sidebar__status-icon sidebar__status-icon--warning" viewBox="0 0 16 16" fill="none"><path d="M8 2L14.5 13H1.5Z" fill="#f97316" opacity="0.15" stroke="#f97316" stroke-width="1.5" stroke-linejoin="round"/><line x1="8" y1="6.5" x2="8" y2="9.5" stroke="#f97316" stroke-width="1.5" stroke-linecap="round"/><circle cx="8" cy="11.5" r="0.75" fill="#f97316"/></svg>',
    error:   '<svg class="sidebar__status-icon sidebar__status-icon--error" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="7" fill="#ef4444" opacity="0.15"/><circle cx="8" cy="8" r="7" stroke="#ef4444" stroke-width="1.5"/><line x1="5.5" y1="5.5" x2="10.5" y2="10.5" stroke="#ef4444" stroke-width="1.5" stroke-linecap="round"/><line x1="10.5" y1="5.5" x2="5.5" y2="10.5" stroke="#ef4444" stroke-width="1.5" stroke-linecap="round"/></svg>'
  };

  /* General nav — Dashboards is included here as a nav item with subsection */
  var _generalNav = [
    { label: 'Home',         hash: 'home',         icon: 'home' },
    { label: 'Dashboards',   hash: 'dashboard',    icon: 'dashboard' },
    { label: 'Dataset',      hash: 'dataset',      icon: 'dataset' },
    { label: 'Integrations', hash: 'integrations', icon: 'integrations' },
    { label: 'Settings',     hash: 'settings',     icon: 'settings' }
  ];

  /* ── Render ── */

  function render($el, state) {
    _$el = $el;
    state = state || {};
    _lastState = state;
    var activePage       = state.activePage || '';
    var activePipelineId = state.activePipelineId || null;
    var pipelines        = state.pipelines || [];
    var dashboards       = state.dashboards || [];
    var activeDashId     = state.activeDashboardId || null;

    var html = _buildHTML(activePage, activePipelineId, pipelines, dashboards, activeDashId);
    $el.html(html);
    _bindEvents($el);
  }

  function update(state) {
    if (_$el) render(_$el, state);
  }

  /* ── HTML builder ── */

  function _buildHTML(activePage, activePipelineId, pipelines, dashboards, activeDashId) {
    var parts = [];

    /* Determine if dashboard section is active — covers list page AND single-board page */
    var dashIsActive = (activePage === 'dashboard') ||
                       (activePage === 'dashboards-list') ||
                       (activePage && activePage.indexOf('dashboard/') === 0);

    parts.push('<div class="sidebar__body">');

    _generalNav.forEach(function (item) {
      var isActive = (activePage === item.hash) && !activePipelineId;
      /* For dashboard, also mark active when on a dashboard/:id route */
      if (item.hash === 'dashboard') {
        isActive = dashIsActive && !activePipelineId;
      }

      var addBtn = (item.hash === 'dashboard')
        ? '<button class="sidebar__add-btn sidebar__item-add-btn" title="New Dashboard">' + _navIcons.plus + '</button>'
        : '';

      var chevronBtn = (item.hash === 'dashboard')
        ? '<button class="sidebar__chevron-btn sidebar__dash-chevron" title="Toggle dashboards">' +
            (_dashCollapsed ? _chevronRightSvg : _chevronDownSvg) +
          '</button>'
        : '';

      parts.push(
        '<div class="sidebar__item' + (isActive ? ' is-active' : '') +
          '" data-hash="' + item.hash + '" title="' + item.label + '">' +
          _navIcons[item.icon] +
          '<span class="sidebar__item-label">' + item.label + '</span>' +
          addBtn +
          chevronBtn +
        '</div>'
      );

      /* Dashboards subsection: shown/hidden based on collapse state */
      if (item.hash === 'dashboard') {
        parts.push(_buildDashboardsSubsection(dashboards, activeDashId, activePage, _dashCollapsed));
      }
    });

    /* ── Pipelines section ─────────────────────────────────── */
    parts.push(
      '<div class="sidebar__section-label sidebar__section-label--spaced sidebar__section-label--actions">' +
        '<span>Pipelines</span>' +
        '<button class="sidebar__add-btn sidebar__pipeline-type-add-btn" id="btn-new-pipeline-type" title="New Pipeline Type" style="opacity:1">' +
          _navIcons.plus +
        '</button>' +
      '</div>'
    );

    var groups = {};
    var groupOrder = [];
    pipelines.forEach(function (p) {
      var t = p.type || 'Other';
      if (!groups[t]) { groups[t] = []; groupOrder.push(t); }
      groups[t].push(p);
    });

    if (!groupOrder.length) {
      parts.push('<div class="sidebar__pipelines-empty">No pipelines yet</div>');
    }

    groupOrder.forEach(function (type) {
      var color = _typeColors[type] || '#8F8F8F';
      var typeCollapsed = !!_pipelineCollapsed[type];
      var itemsStyle = typeCollapsed ? ' style="display:none"' : '';
      var isGroupActive = (activePage === 'pipeline-group' && activePage.indexOf(type) !== -1);

      /* Type header — clicking navigates to group management page */
      parts.push(
        '<div class="sidebar__pipeline-type' + (isGroupActive ? ' is-active' : '') + '" data-pipeline-type="' + _esc(type) + '" title="Manage ' + _esc(type) + ' pipelines">' +
          '<span class="sidebar__pipe-icon-wrap" style="color:' + color + '">' + _pipeIconSvg + '</span>' +
          '<span class="sidebar__pipeline-type-label">' + _esc(type) + '</span>' +
          '<button class="sidebar__add-btn" data-type="' + _esc(type) + '" title="New ' + _esc(type) + ' pipeline">' +
            _navIcons.plus +
          '</button>' +
          '<button class="sidebar__chevron-btn sidebar__pipeline-chevron" data-pipeline-type="' + _esc(type) + '" title="Toggle ' + _esc(type) + '">' +
            (typeCollapsed ? _chevronRightSvg : _chevronDownSvg) +
          '</button>' +
        '</div>'
      );

      /* Pipeline items — children of the type group */
      parts.push('<div class="sidebar__pipeline-items"' + itemsStyle + '>');
      groups[type].forEach(function (p) {
        var isActive = activePipelineId === p.id;
        var statusIcon = _statusIcons[p.status] || _statusIcons.healthy;
        parts.push(
          '<div class="sidebar__pipeline-item' + (isActive ? ' is-active' : '') +
            '" data-pipeline-id="' + p.id + '" title="' + _esc(p.name) + '">' +
            statusIcon +
            '<span class="sidebar__pipeline-name">' + _esc(p.name) + '</span>' +
          '</div>'
        );
      });
      parts.push('</div>'); /* end pipeline-items */
    });

    parts.push('</div>'); /* end sidebar__body */

    parts.push(
      '<div class="sidebar__footer">' +
        '<button class="sidebar__footer-btn" id="btn-new-pipeline-group">' +
          _navIcons.plus + ' New Pipeline Group' +
        '</button>' +
      '</div>'
    );

    return parts.join('');
  }

  /* Builds the indented dashboards subsection shown under the Dashboards nav item */
  function _buildDashboardsSubsection(dashboards, activeDashId, activePage, collapsed) {
    var parts = [];
    var style = collapsed ? ' style="display:none"' : '';

    parts.push('<div class="sidebar__dashboards-subsection"' + style + '>');

    if (!dashboards.length) {
      parts.push('<div class="sidebar__dashboards-empty">No dashboards</div>');
    }

    dashboards.forEach(function (db) {
      /* Only highlight sub-item on the detail route (#dashboard/:id), not the list page */
      var isActive = (activePage === 'dashboard') && (activeDashId === db.id);
      var iconKey = db.icon || 'grid';
      var iconSvg = _dashIcons[iconKey] || _dashIcons.grid;
      var iconColor = db.iconColor || 'currentColor';
      parts.push(
        '<a class="sidebar__dashboard-item' + (isActive ? ' is-active' : '') + '"' +
          ' href="#dashboard/' + db.id + '"' +
          ' data-dashboard-id="' + db.id + '"' +
          ' title="' + _esc(db.name) + '">' +
          '<span class="sidebar__dash-icon" style="color:' + _esc(iconColor) + '">' + iconSvg + '</span>' +
          '<span class="sidebar__dashboard-name">' + _esc(db.name) + '</span>' +
        '</a>'
      );
    });

    parts.push('</div>');
    return parts.join('');
  }

  /* ── Events ── */

  function _bindEvents($el) {
    /* Remove previous handlers to prevent stacking on re-render */
    $el.off('.sidebar');

    /* General nav items */
    $el.on('click.sidebar', '.sidebar__item', function () {
      var hash = $(this).data('hash');
      if (hash) location.hash = '#' + hash;
    });

    /* Dashboard items — set active before navigation */
    $el.on('click.sidebar', '.sidebar__dashboard-item', function (e) {
      e.preventDefault();
      var id = $(this).data('dashboardId');
      if (id && window.DashboardStore) DashboardStore.setActive(id);
      var href = $(this).attr('href');
      if (href) location.hash = href;
    });

    /* New dashboard button (inline with Dashboards nav item) */
    $el.on('click.sidebar', '.sidebar__item-add-btn', function (e) {
      e.stopPropagation(); /* prevent nav item click / navigation */
      if (window.NewDashboardModal) {
        NewDashboardModal.open(function () {});
      }
    });

    /* Pipeline items */
    $el.on('click.sidebar', '.sidebar__pipeline-item', function () {
      var id = $(this).data('pipelineId');
      if (id) location.hash = '#pipeline/' + id;
    });

    /* + New pipeline button per group */
    $el.on('click.sidebar', '.sidebar__add-btn', function (e) {
      e.stopPropagation();
      if (window.Toast) Toast.info('Create pipeline coming soon');
    });

    /* New Pipeline Group (footer button) */
    $el.on('click.sidebar', '#btn-new-pipeline-group', function () {
      if (window.Toast) Toast.info('Pipeline groups coming soon');
    });

    /* New Pipeline Type (section label "+" button) */
    $el.on('click.sidebar', '#btn-new-pipeline-type', function (e) {
      e.stopPropagation();
      if (window.Toast) Toast.info('New pipeline type coming soon');
    });

    /* Pipeline type group header → navigate to group management page */
    $el.on('click.sidebar', '.sidebar__pipeline-type', function (e) {
      if ($(e.target).closest('.sidebar__add-btn, .sidebar__chevron-btn').length) return;
      var type = $(this).data('pipelineType');
      if (type) location.hash = '#pipeline-group/' + encodeURIComponent(type);
    });

    /* Dashboards chevron toggle */
    $el.on('click.sidebar', '.sidebar__dash-chevron', function (e) {
      e.stopPropagation();
      _dashCollapsed = !_dashCollapsed;
      if (_$el) render(_$el, _lastState);
    });

    /* Pipeline type chevron toggle */
    $el.on('click.sidebar', '.sidebar__pipeline-chevron', function (e) {
      e.stopPropagation();
      var type = $(this).data('pipelineType');
      if (type) {
        _pipelineCollapsed[type] = !_pipelineCollapsed[type];
        if (_$el) render(_$el, _lastState);
      }
    });
  }

  function _esc(str) {
    return $('<span>').text(str).html();
  }

  return { render: render, update: update };
}());

window.VibeSidebar = VibeSidebar;
