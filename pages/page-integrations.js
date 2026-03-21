/**
 * page-integrations.js
 * Integrations page: data-table listing of all named connections.
 * Follows page-dataset.js pattern (page-header + .data-table inside .card).
 *
 * API: PageIntegrations.render($container), PageIntegrations.destroy()
 */
var PageIntegrations = (function () {
  'use strict';

  var _$container = null;

  function render($container) {
    _$container = $container;

    $container.html(
      '<div class="page-header">' +
        '<div class="page-header__breadcrumb">Home \u203a Integrations</div>' +
        '<div class="page-header__title">Integrations</div>' +
        '<div class="page-header__spacer"></div>' +
        '<input type="text" class="form-input" id="intg-search" ' +
          'placeholder="Search connections\u2026" style="width:220px;height:30px;margin-right:8px" />' +
        '<div class="page-header__actions">' +
          '<button class="btn btn--primary" id="btn-new-connection">' +
            '<svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">' +
              '<line x1="8" y1="2" x2="8" y2="14"/><line x1="2" y1="8" x2="14" y2="8"/>' +
            '</svg>' +
            ' New Connection' +
          '</button>' +
        '</div>' +
      '</div>' +
      '<div class="page-content">' +
        '<div class="card" style="overflow:hidden">' +
          '<table class="data-table" id="intg-table">' +
            '<thead><tr>' +
              '<th>Name</th>' +
              '<th>Provider</th>' +
              '<th>Status</th>' +
              '<th>Connected At</th>' +
              '<th>Actions</th>' +
            '</tr></thead>' +
            '<tbody id="intg-tbody"></tbody>' +
          '</table>' +
          '<div id="intg-empty" class="empty-state" style="display:none">' +
            '<div class="empty-state__title">No connections</div>' +
            '<div class="empty-state__desc">Click New Connection to add one.</div>' +
          '</div>' +
        '</div>' +
      '</div>'
    );

    _renderRows();
    _bindEvents($container);
  }

  function _renderRows(filter) {
    if (!_$container) return;
    var connections = window.IntegrationStore ? IntegrationStore.list() : [];
    var q = (filter || '').toLowerCase();

    if (q) {
      connections = connections.filter(function (c) {
        return (c.name || '').toLowerCase().indexOf(q) !== -1 ||
               (c.provider || '').toLowerCase().indexOf(q) !== -1 ||
               (c.email || '').toLowerCase().indexOf(q) !== -1;
      });
    }

    var $tbody = _$container.find('#intg-tbody');
    var $empty = _$container.find('#intg-empty');
    var $table = _$container.find('#intg-table');

    if (!connections.length) {
      $tbody.empty();
      $table.hide();
      $empty.show();
      return;
    }

    $empty.hide();
    $table.show();

    var rows = connections.map(function (c) {
      var isActive  = c.expiresAt && c.expiresAt > Date.now();
      var statusBadge = isActive
        ? '<span class="badge badge--green" style="background:var(--color-success-bg,#d1fae5);color:var(--color-success-text,#065f46)">Active</span>'
        : '<span class="badge" style="background:var(--color-warning-bg,#fef3c7);color:var(--color-warning-text,#92400e)">Expired</span>';
      var connectedAt = c.connectedAt ? new Date(c.connectedAt).toLocaleString() : '\u2014';
      var reconnectBtn = !isActive
        ? '<button class="btn btn--ghost btn--sm intg-reconnect-btn" data-id="' + _esc(c.id) + '" style="margin-right:4px">Reconnect</button>'
        : '';
      var emailLine = c.email
        ? '<div style="font-size:10px;color:var(--color-text-3)">' + _esc(c.email) + '</div>'
        : '';
      var modeBadge = '<span class="badge" style="font-size:9px;margin-left:4px;padding:1px 4px">' +
        (c.authMode === 'sso' ? 'SSO' : 'Token') + '</span>';
      return '<tr>' +
        '<td>' + _esc(c.name || c.id) + emailLine + '</td>' +
        '<td><span class="badge">' + _esc(c.provider || '') + '</span>' + modeBadge + '</td>' +
        '<td>' + statusBadge + '</td>' +
        '<td>' + _esc(connectedAt) + '</td>' +
        '<td>' +
          reconnectBtn +
          '<button class="btn btn--ghost btn--sm intg-disconnect-btn" data-id="' + _esc(c.id) + '">Disconnect</button>' +
        '</td>' +
      '</tr>';
    });

    $tbody.html(rows.join(''));
  }

  function _bindEvents($c) {
    $c.on('click', '#btn-new-connection', function () {
      if (window.NewConnectionModal) {
        NewConnectionModal.open(function () { _renderRows(); });
      }
    });

    $c.on('click', '.intg-disconnect-btn', function () {
      var id = $(this).data('id');
      if (window.IntegrationStore) IntegrationStore.remove(id);
      _renderRows(_$container.find('#intg-search').val());
      if (window.Toast) Toast.info('Connection removed.');
    });

    $c.on('click', '.intg-reconnect-btn', function () {
      if (window.NewConnectionModal) {
        NewConnectionModal.open(function () { _renderRows(); });
      }
    });

    $c.on('input', '#intg-search', function () {
      _renderRows($(this).val());
    });
  }

  function _esc(s) {
    return $('<span>').text(String(s == null ? '' : s)).html();
  }

  function destroy() {
    if (_$container) _$container.off('click input');
    _$container = null;
  }

  return { render: render, destroy: destroy };
}());

window.PageIntegrations = PageIntegrations;
