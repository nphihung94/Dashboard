/**
 * app.js
 * Application entry point: init sequence, hash router, keyboard shortcuts.
 *
 * Init order:
 *   DatasetStore.init() → DashboardStore.init() → DemoDatasets.register()
 *   → PipelineEngine.runAll() → LayoutStore.init()
 *   → render header + sidebar → Router.start()
 *
 * Routes:
 *   #home                   → PageHome
 *   #dashboard              → PageDashboardsList
 *   #dashboard/:id          → PageDashboard (with id param)
 *   #pipeline/:id           → PagePipeline
 *   #dataset                → PageDataset
 *   #settings               → PageSettings
 */

(function ($) {
  'use strict';

  var _currentRoute  = null;
  var _currentParams = {};

  /* ── Route parsing ── */

  /**
   * Parse window.location.hash into { page, params }.
   * '#dashboard/db-abc123' → { page: 'dashboard', params: { id: 'db-abc123' } }
   * '#dashboard'           → { page: 'dashboards-list', params: {} }
   * '#pipeline/sales-etl'  → { page: 'pipeline', params: { id: 'sales-etl' } }
   */
  function _parseHash() {
    var raw  = (location.hash || '#dashboard').replace(/^#\/?/, '');
    if (!raw) raw = 'dashboard';

    /* Strip query string for routing purposes */
    var withoutQuery = raw.split('?')[0];
    var parts = withoutQuery.split('/');
    var base  = parts[0] || 'dashboard';
    var params = {};

    if (base === 'dashboard' && parts[1]) {
      /* #dashboard/:id → single dashboard view */
      params.id = parts[1];
      return { page: 'dashboard', params: params };
    }

    if (base === 'dashboard') {
      return { page: 'dashboards-list', params: {} };
    }

    if (base === 'pipeline' && parts[1]) {
      params.id = parts[1];
    }

    if (base === 'pipeline-group' && parts[1]) {
      params.id = decodeURIComponent(parts[1]);
      return { page: 'pipeline-group', params: params };
    }

    return { page: base, params: params };
  }

  /* ── Page registry ── */

  var _pages = {
    'home':            { $el: null, render: function ($el)     { PageHome.render($el); },             destroy: function () { PageHome.destroy(); } },
    'dashboard':       { $el: null, render: function ($el, id) { PageDashboard.render($el, id); },    destroy: function () { PageDashboard.destroy(); } },
    'dashboards-list': { $el: null, render: function ($el)     { PageDashboardsList.render($el); },   destroy: function () {} },
    'dataset':         { $el: null, render: function ($el)     { PageDataset.render($el); },          destroy: function () { PageDataset.destroy(); } },
    'settings':        { $el: null, render: function ($el)     { PageSettings.render($el); },         destroy: function () { PageSettings.destroy(); } },
    'pipeline':        { $el: null, render: function ($el, id)   { PagePipeline.render($el, id); },         destroy: function () { PagePipeline.destroy(); } },
    'pipeline-group':  { $el: null, render: function ($el, id)   { PagePipelineGroup.render($el, id); },    destroy: function () { PagePipelineGroup.destroy(); } },
    'integrations':    { $el: null, render: function ($el)       { PageIntegrations.render($el); },         destroy: function () { PageIntegrations.destroy(); } }
  };

  /* ── Router ── */

  function _navigate() {
    var route    = _parseHash();
    var pageName = route.page;

    /* Unknown route → dashboard list */
    if (!_pages[pageName]) {
      location.hash = '#dashboard';
      return;
    }

    /* Destroy current page if changing */
    if (_currentRoute && _currentRoute !== pageName && _pages[_currentRoute]) {
      try { _pages[_currentRoute].destroy(); } catch (e) { /* ignore */ }
    }

    _currentRoute  = pageName;
    _currentParams = route.params;

    /* Hide all pages, show target.
       dashboard and dashboards-list both reuse #page-dashboard element. */
    $('.page').removeClass('is-active');
    var domId = (pageName === 'dashboards-list') ? 'page-dashboard' : ('page-' + pageName);
    var $target = $('#' + domId);
    if ($target.length) $target.addClass('is-active');

    /* Render the page */
    try {
      _pages[pageName].render($target, route.params.id);
    } catch (e) {
      console.error('[App] Page render error (' + pageName + '):', e);
      $target.html(
        '<div class="empty-state">' +
          '<div class="empty-state__title">Page error</div>' +
          '<div class="empty-state__desc">' + e.message + '</div>' +
        '</div>'
      );
    }

    /* Update sidebar */
    _updateSidebar(pageName, route.params.id);
  }

  function _updateSidebar(pageName, pipelineId) {
    if (!window.VibeSidebar || !window.DatasetStore) return;
    var activeDb   = window.DashboardStore ? DashboardStore.getActive() : null;
    var dashboards = window.DashboardStore ? DashboardStore.list() : [];

    VibeSidebar.update({
      activePage:        pageName,
      activePipelineId:  pipelineId || null,
      pipelines:         DatasetStore.getPipelines(),
      dashboards:        dashboards,
      activeDashboardId: activeDb ? activeDb.id : null
    });
  }

  /* ── Init sequence ── */

  function _init() {
    /* 1. Bootstrap data layer */
    if (window.DatasetStore)      DatasetStore.init();
    if (window.DashboardStore)    DashboardStore.init();
    if (window.IntegrationStore)  IntegrationStore.init();
    if (window.DemoDatasets)   DemoDatasets.register();
    if (window.PipelineEngine) PipelineEngine.runAll();
    if (window.LayoutStore)    LayoutStore.init();

    /* 2. Render shell components */
    if (window.VibeMasterHeader) VibeMasterHeader.render($('#app-header'));

    if (window.VibeSidebar && window.DatasetStore) {
      var activeDb   = window.DashboardStore ? DashboardStore.getActive() : null;
      var dashboards = window.DashboardStore ? DashboardStore.list() : [];
      VibeSidebar.render($('#app-sidebar'), {
        activePage:        'dashboard',
        activePipelineId:  null,
        pipelines:         DatasetStore.getPipelines(),
        dashboards:        dashboards,
        activeDashboardId: activeDb ? activeDb.id : null
      });
    }

    /* 3. Wire keyboard shortcuts */
    if (window.SearchOverlay) SearchOverlay.init();

    /* 4. Start router */
    $(window).on('hashchange', _navigate);
    _navigate();
  }

  /* ── DOM ready ── */
  $(document).ready(function () {
    try {
      _init();
    } catch (e) {
      console.error('[App] Init failed:', e);
    }
  });

})(jQuery);
