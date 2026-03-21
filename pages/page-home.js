/**
 * page-home.js
 * Home page: welcome banner, quick stats cards, recent pipeline runs.
 *
 * API:
 *   PageHome.render($container)
 *   PageHome.destroy()
 */

var PageHome = (function () {
  'use strict';

  function render($container) {
    var pipelines = window.DatasetStore ? DatasetStore.getPipelines() : [];
    var datasets  = window.DatasetStore ? DatasetStore.list() : [];
    var widgets   = window.LayoutStore  ? LayoutStore.load() : [];

    var recentRuns = _getRecentRuns(pipelines);

    $container.html(
      '<div class="page-header">' +
        '<div class="page-header__breadcrumb">Home</div>' +
        '<div class="page-header__title">Welcome to Vibe Dashboard</div>' +
        '<div class="page-header__spacer"></div>' +
        '<button class="btn btn--primary" onclick="location.hash=\'#pipeline/new\'">+ New Pipeline</button>' +
      '</div>' +

      '<div class="page-content">' +

        /* Welcome banner */
        '<div class="card" style="margin-bottom:var(--spacing-20);padding:var(--spacing-20);' +
          'background:linear-gradient(135deg,#1E88E5 0%,#1565C0 100%);border:none;color:#fff">' +
          '<div style="font-size:18px;font-weight:700;margin-bottom:4px">Data widgets. Formula power. Your canvas.</div>' +
          '<div style="font-size:13px;opacity:0.85">Build pipelines, visualize data, and share insights — all in one place.</div>' +
          '<div style="margin-top:14px;display:flex;gap:8px">' +
            '<button class="btn" style="background:#fff;color:#1E88E5;border:none" ' +
              'onclick="location.hash=\'#dashboard\'">Go to Dashboard</button>' +
            '<button class="btn" style="background:rgba(255,255,255,0.2);color:#fff;border:1px solid rgba(255,255,255,0.4)" ' +
              'onclick="location.hash=\'#dataset\'">View Datasets</button>' +
          '</div>' +
        '</div>' +

        /* Stats row */
        '<div class="stats-row">' +
          _statCard(pipelines.length, 'Active Pipelines', '#1E88E5') +
          _statCard(datasets.length,  'Datasets',         '#00897B') +
          _statCard(widgets.length,   'Dashboard Widgets','#7B1FA2') +
        '</div>' +

        /* Recent runs */
        '<div class="card">' +
          '<div class="card__header">' +
            '<div class="card__title">Recent Pipeline Runs</div>' +
          '</div>' +
          '<div class="card__body" style="padding:0">' +
            (recentRuns.length ? _runsTable(recentRuns) : _noRuns()) +
          '</div>' +
        '</div>' +

      '</div>' /* end page-content */
    );
  }

  function _statCard(value, label, color) {
    return '<div class="stat-card">' +
      '<div class="stat-card__value" style="color:' + color + '">' + value + '</div>' +
      '<div class="stat-card__label">' + label + '</div>' +
    '</div>';
  }

  function _getRecentRuns(pipelines) {
    var runs = [];
    if (!window.DatasetStore) return runs;
    pipelines.forEach(function (p) {
      var log = DatasetStore.getRunLog(p.id);
      if (log && log.length) {
        runs.push(Object.assign({ pipelineName: p.name, pipelineId: p.id }, log[0]));
      }
    });
    // Sort by timestamp desc, take latest 5
    runs.sort(function (a, b) { return (b.timestamp || '') > (a.timestamp || '') ? 1 : -1; });
    return runs.slice(0, 5);
  }

  function _runsTable(runs) {
    var rows = runs.map(function (r) {
      var ts  = r.timestamp ? new Date(r.timestamp).toLocaleString() : '—';
      var dur = r.duration != null ? (r.duration / 1000).toFixed(2) + 's' : '—';
      var badge = r.status === 'success'
        ? '<span class="run-status-pill run-status-pill--success">✓ success</span>'
        : '<span class="run-status-pill run-status-pill--error">✗ error</span>';
      return '<tr>' +
        '<td><a href="#pipeline/' + r.pipelineId + '" style="color:var(--color-brand)">' +
          _esc(r.pipelineName) + '</a></td>' +
        '<td style="font-size:12px;color:#5B5B5B">' + _esc(ts) + '</td>' +
        '<td>' + badge + '</td>' +
        '<td style="text-align:right;font-size:12px">' + _esc(dur) + '</td>' +
        '<td style="text-align:right;font-size:12px">' + (r.outputRows != null ? r.outputRows : '—') + '</td>' +
      '</tr>';
    }).join('');

    return '<table class="data-table">' +
      '<thead><tr><th>Pipeline</th><th>Ran at</th><th>Status</th>' +
        '<th style="text-align:right">Duration</th><th style="text-align:right">Output rows</th></tr></thead>' +
      '<tbody>' + rows + '</tbody>' +
    '</table>';
  }

  function _noRuns() {
    return '<div class="empty-state" style="padding:var(--spacing-24)">' +
      '<div class="empty-state__title">No runs yet</div>' +
      '<div class="empty-state__desc">Run a pipeline to see activity here.</div>' +
    '</div>';
  }

  function _esc(str) {
    return $('<span>').text(String(str || '')).html();
  }

  function destroy() { /* stateless — nothing to clean up */ }

  return { render: render, destroy: destroy };
}());

window.PageHome = PageHome;
