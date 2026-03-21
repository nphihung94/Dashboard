/**
 * dataset-source-database.js
 * Sub-component for "Database Connection" source type.
 * Supports MySQL and PostgreSQL connection config (coming soon — no real query execution).
 *
 * Contract: render($container), getValue(), destroy()
 */
var DatasetSourceDatabase = (function () {
  'use strict';

  var _$container = null;

  function render($container) {
    _$container = $container;

    $container.html(
      '<div class="form-group">' +
        '<label class="form-label">Database Type</label>' +
        '<select class="form-select" id="nds-db-type">' +
          '<option value="mysql">MySQL</option>' +
          '<option value="postgresql">PostgreSQL</option>' +
        '</select>' +
      '</div>' +
      '<div class="form-group">' +
        '<label class="form-label">Host</label>' +
        '<input class="form-input" id="nds-db-host" placeholder="localhost" />' +
      '</div>' +
      '<div style="display:flex;gap:var(--spacing-8)">' +
        '<div class="form-group" style="flex:1">' +
          '<label class="form-label">Port</label>' +
          '<input class="form-input" id="nds-db-port" placeholder="3306" />' +
        '</div>' +
        '<div class="form-group" style="flex:2">' +
          '<label class="form-label">Database Name</label>' +
          '<input class="form-input" id="nds-db-name" placeholder="my_database" />' +
        '</div>' +
      '</div>' +
      '<div class="form-group">' +
        '<label class="form-label">Username</label>' +
        '<input class="form-input" id="nds-db-user" placeholder="root" />' +
      '</div>' +
      '<div class="form-group">' +
        '<label class="form-label">Password</label>' +
        '<input class="form-input" id="nds-db-pass" type="password" placeholder="••••••••" />' +
      '</div>' +
      '<div style="font-size:var(--font-size-xs);color:var(--color-text-3);margin-bottom:var(--spacing-12)">' +
        'Password is held in memory only and never saved.' +
      '</div>' +
      '<div style="display:flex;align-items:center;gap:var(--spacing-8)">' +
        '<button class="btn btn--ghost btn--sm" disabled id="nds-db-connect">' +
          'Test Connection <span class="nds-coming-soon">Coming Soon</span>' +
        '</button>' +
      '</div>'
    );

    /* Update default port when type changes */
    $container.on('change', '#nds-db-type', function () {
      var port = $(this).val() === 'postgresql' ? '5432' : '3306';
      var $p = $('#nds-db-port');
      if (!$p.val() || $p.val() === '3306' || $p.val() === '5432') $p.val(port);
    });
  }

  function getValue() {
    var host = $('#nds-db-host').val().trim();
    if (!host) return null;
    return {
      data: [],
      meta: {
        type:     'database',
        dbType:   $('#nds-db-type').val(),
        host:     host,
        port:     $('#nds-db-port').val().trim() || '3306',
        database: $('#nds-db-name').val().trim(),
        user:     $('#nds-db-user').val().trim()
      }
    };
  }

  function destroy() {
    if (_$container) _$container.off('change');
    _$container = null;
  }

  return { render: render, getValue: getValue, destroy: destroy };
}());

window.DatasetSourceDatabase = DatasetSourceDatabase;
