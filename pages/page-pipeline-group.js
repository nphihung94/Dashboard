/**
 * page-pipeline-group.js
 * Manages all pipelines within a pipeline type group (ETL, Analytics, Reporting, etc.)
 * Route: #pipeline-group/:type
 *
 * API: PagePipelineGroup.render($container, type), PagePipelineGroup.destroy()
 */
var PagePipelineGroup = (function () {
  'use strict';

  var _$container = null;
  var _type = null;

  var _statusColors = {
    healthy: { bg: 'var(--color-success-bg,#d1fae5)', text: 'var(--color-success-text,#065f46)' },
    warning: { bg: 'var(--color-warning-bg,#fef3c7)', text: 'var(--color-warning-text,#92400e)' },
    error:   { bg: 'var(--color-error-bg,#fee2e2)',   text: 'var(--color-error-text,#991b1b)' }
  };

  function render($container, type) {
    _$container = $container;
    _type = type || 'Unknown';
    _renderPage();
    _bindEvents($container);
  }

  function _renderPage() {
    _$container.html(
      '<div class="page-header">' +
        '<div class="page-header__breadcrumb">Home \u203a Pipelines \u203a ' + _esc(_type) + '</div>' +
        '<div class="page-header__title">' + _esc(_type) + ' Pipelines</div>' +
        '<div class="page-header__spacer"></div>' +
        '<div class="page-header__actions">' +
          '<button class="btn btn--primary" id="btn-new-pipeline">' +
            '<svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">' +
              '<line x1="8" y1="2" x2="8" y2="14"/><line x1="2" y1="8" x2="14" y2="8"/>' +
            '</svg>' +
            ' New Pipeline' +
          '</button>' +
        '</div>' +
      '</div>' +
      '<div class="page-content">' +
        '<div class="card" style="overflow:hidden">' +
          '<table class="data-table" id="pg-table">' +
            '<thead><tr>' +
              '<th>Name</th>' +
              '<th>Status</th>' +
              '<th>Last Run</th>' +
              '<th>Actions</th>' +
            '</tr></thead>' +
            '<tbody id="pg-tbody"></tbody>' +
          '</table>' +
          '<div id="pg-empty" class="empty-state" style="display:none">' +
            '<div class="empty-state__title">No pipelines</div>' +
            '<div class="empty-state__desc">Click New Pipeline to create one in this group.</div>' +
          '</div>' +
        '</div>' +
      '</div>'
    );
    _renderRows();
  }

  function _renderRows() {
    if (!_$container) return;
    var all = window.DatasetStore ? DatasetStore.getPipelines() : [];
    var pipelines = all.filter(function (p) { return (p.type || 'Other') === _type; });

    var $tbody = _$container.find('#pg-tbody');
    var $empty = _$container.find('#pg-empty');
    var $table = _$container.find('#pg-table');

    if (!pipelines.length) {
      $tbody.empty(); $table.hide(); $empty.show(); return;
    }
    $empty.hide(); $table.show();

    var rows = pipelines.map(function (p) {
      var s = p.status || 'healthy';
      var sc = _statusColors[s] || _statusColors.healthy;
      var badge = '<span class="badge" style="background:' + sc.bg + ';color:' + sc.text + '">' + _esc(s) + '</span>';
      var lastRun = p.lastRun ? new Date(p.lastRun).toLocaleString() : '\u2014';
      return '<tr>' +
        '<td><a href="#pipeline/' + _esc(p.id) + '" style="color:var(--color-brand);text-decoration:none">' + _esc(p.name) + '</a></td>' +
        '<td>' + badge + '</td>' +
        '<td>' + _esc(lastRun) + '</td>' +
        '<td>' +
          '<a href="#pipeline/' + _esc(p.id) + '" class="btn btn--ghost btn--sm" style="margin-right:4px">Open</a>' +
          '<button class="btn btn--ghost btn--sm pg-run-btn" data-id="' + _esc(p.id) + '">Run</button>' +
        '</td>' +
      '</tr>';
    });

    $tbody.html(rows.join(''));
  }

  function _bindEvents($c) {
    $c.on('click', '#btn-new-pipeline', function () {
      if (window.Toast) Toast.info('Create pipeline coming soon');
    });
    $c.on('click', '.pg-run-btn', function () {
      var id = $(this).data('id');
      if (window.Toast) Toast.info('Run pipeline: ' + id);
    });
  }

  function _esc(s) {
    return $('<span>').text(String(s == null ? '' : s)).html();
  }

  function destroy() {
    if (_$container) _$container.off('click');
    _$container = null;
    _type = null;
  }

  return { render: render, destroy: destroy };
}());

window.PagePipelineGroup = PagePipelineGroup;
