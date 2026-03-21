/* dataset-source-integration.js — External Integration source for New Dataset wizard.
 * Multi-connection support via getByProvider(). Contract: render($c), getValue(), destroy() */
var DatasetSourceIntegration = (function () {
  'use strict';

  var _$container        = null;
  var _fetchedData       = null;
  var _provider          = null;
  var _selectedConnectionId = null;

  var _providers = [
    { key: 'google-sheets', name: 'Google Sheets', active: true },
    { key: 'google-drive',  name: 'Google Drive',  active: false },
    { key: 'powerbi',       name: 'Power BI',       active: false },
    { key: 'tableau',       name: 'Tableau',        active: false }
  ];

  function render($container) {
    _$container = $container; _fetchedData = null; _provider = null; _selectedConnectionId = null;
    var gsConns = window.IntegrationStore ? IntegrationStore.getByProvider('google-sheets') : [];
    var intro = gsConns.length
      ? 'Connected services are shown below. Select Google Sheets and load data.'
      : 'No integrations connected. <a href="#integrations" style="color:var(--color-brand)">Go to Integrations page</a> to connect an account.';
    $container.html(
      '<p style="font-size:var(--font-size-xs);color:var(--color-text-3);margin-bottom:var(--spacing-12)">' + intro + '</p>' +
      '<div style="display:flex;flex-direction:column;gap:var(--spacing-12)">' +
        _providers.map(function (p) { return _buildCard(p, p.key === 'google-sheets' ? gsConns : []); }).join('') +
      '</div>' +
      '<div id="nds-intg-status" style="font-size:var(--font-size-xs);margin-top:var(--spacing-8)"></div>'
    );
    _bindEvents($container);
  }

  function _buildCard(p, connections) {
    if (!p.active) {
      return '<div style="display:flex;align-items:center;justify-content:space-between;padding:var(--spacing-12);' +
        'border:1px solid var(--color-border);border-radius:var(--radius-8);opacity:0.6">' +
        '<span style="font-size:var(--font-size-sm)">' + p.name + '</span>' +
        '<span class="badge" style="font-size:10px">Coming Soon</span>' +
      '</div>';
    }

    /* No connections for this provider */
    if (!connections || connections.length === 0) {
      return '<div style="padding:var(--spacing-12);border:1px solid var(--color-border);border-radius:var(--radius-8)">' +
        '<div style="font-weight:600;font-size:var(--font-size-sm);margin-bottom:4px">' + p.name + '</div>' +
        '<div style="font-size:var(--font-size-xs);color:var(--color-text-3);margin-bottom:var(--spacing-8)">Not connected.</div>' +
        '<a href="#integrations" style="font-size:var(--font-size-xs);color:var(--color-brand)">Connect in Integrations page \u2192</a>' +
      '</div>';
    }

    /* Single connection: auto-select */
    if (connections.length === 1) {
      var c = connections[0];
      _selectedConnectionId = c.id;
      if (c.expiresAt <= Date.now()) {
        return _expiredCard(p.name);
      }
      return _connectedCard(p.name, null);
    }

    /* Multiple connections: default to first non-expired */
    var def = null;
    connections.forEach(function (c) { if (!def && c.expiresAt > Date.now()) def = c; });
    if (!def) def = connections[0];
    _selectedConnectionId = def.id;
    var opts = connections.map(function (c) {
      return '<option value="' + _esc(c.id) + '"' + (c.id === def.id ? ' selected' : '') + '>' +
        _esc(c.name) + (c.expiresAt <= Date.now() ? ' (Expired)' : '') + '</option>';
    }).join('');
    return _connectedCard(p.name,
      '<div class="form-group"><label class="form-label">Connection</label>' +
      '<select class="form-input" id="nds-intg-conn-select" style="height:auto">' + opts + '</select></div>');
  }

  function _expiredCard(name) {
    return '<div style="padding:var(--spacing-12);border:1px solid var(--color-warning);border-radius:var(--radius-8)">' +
      '<div style="font-weight:600;font-size:var(--font-size-sm);margin-bottom:4px">' + name + '</div>' +
      '<div style="font-size:var(--font-size-xs);color:var(--color-warning-text);margin-bottom:var(--spacing-8)">Token expired.</div>' +
      '<a href="#integrations" style="font-size:var(--font-size-xs);color:var(--color-brand)">Reconnect in Integrations page \u2192</a></div>';
  }

  function _connectedCard(name, extra) {
    return '<div style="padding:var(--spacing-12);border:1px solid var(--color-brand);border-radius:var(--radius-8)">' +
      '<div style="display:flex;align-items:center;gap:var(--spacing-8);margin-bottom:var(--spacing-12)">' +
        '<span style="font-weight:600;font-size:var(--font-size-sm)">' + name + '</span>' +
        '<span style="font-size:10px;color:var(--color-success-text)">&#10003; Connected</span></div>' +
      (extra || '') +
      '<div class="form-group"><label class="form-label">Spreadsheet URL</label>' +
        '<input class="form-input" id="nds-intg-sheet-url" placeholder="https://docs.google.com/spreadsheets/d/..." /></div>' +
      '<div class="form-group"><label class="form-label">Range</label>' +
        '<input class="form-input" id="nds-intg-sheet-range" placeholder="A1:Z1000" value="A1:Z1000" style="width:140px" /></div>' +
      '<button class="btn btn--ghost btn--sm" id="btn-load-sheet">Load Data</button></div>';
  }

  function _bindEvents($c) {
    $c.on('click', '#btn-load-sheet', function () { _loadSheetData(); });
    $c.on('change', '#nds-intg-conn-select', function () {
      _selectedConnectionId = $(this).val();
    });
  }

  function _loadSheetData() {
    if (!_selectedConnectionId) {
      _setStatus('Select a connection', true);
      return;
    }

    var url   = _$container.find('#nds-intg-sheet-url').val().trim();
    var range = _$container.find('#nds-intg-sheet-range').val().trim() || 'A1:Z1000';

    if (!url) { _$container.find('#nds-intg-sheet-url').focus(); return; }

    var match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
    if (!match) {
      _setStatus('Invalid Spreadsheet URL. Paste the full URL from your browser.', true);
      return;
    }
    var spreadsheetId = match[1];

    var entry = window.IntegrationStore ? IntegrationStore.get(_selectedConnectionId) : null;
    if (!entry || !entry.accessToken) {
      _setStatus('Google Sheets not connected. Go to Integrations page.', true);
      return;
    }
    if (entry.expiresAt <= Date.now()) {
      _setStatus('Token expired. Reconnect Google Sheets in the Integrations page.', true);
      return;
    }

    var $btn = _$container.find('#btn-load-sheet');
    $btn.text('Loading\u2026').prop('disabled', true);
    _setStatus('Fetching\u2026');
    var xhr = new XMLHttpRequest();
    xhr.open('GET', 'https://sheets.googleapis.com/v4/spreadsheets/' +
      encodeURIComponent(spreadsheetId) + '/values/' + encodeURIComponent(range), true);
    xhr.setRequestHeader('Authorization', 'Bearer ' + entry.accessToken);
    xhr.onload = function () {
      $btn.text('Load Data').prop('disabled', false);
      if (xhr.status === 401) { _setStatus('Token invalid or revoked. Reconnect in Integrations page.', true); return; }
      if (xhr.status !== 200) { _setStatus('API error ' + xhr.status + ': ' + xhr.statusText, true); return; }
      try {
        var resp = JSON.parse(xhr.responseText);
        var rows = _parseSheetValues(resp.values || []);
        if (!rows.length) { _setStatus('No data found in the specified range.', true); return; }
        _fetchedData = rows; _provider = 'google-sheets';
        _setStatus(rows.length + ' rows loaded \u00b7 ' + Object.keys(rows[0]).length + ' columns');
      } catch (ex) { _setStatus('Failed to parse response: ' + ex.message, true); }
    };
    xhr.onerror = function () { $btn.text('Load Data').prop('disabled', false); _setStatus('Network error. Check your connection.', true); };
    xhr.send();
  }

  function _parseSheetValues(values) {
    if (!values || values.length < 2) return [];
    var headers = values[0];
    return values.slice(1).map(function (row) {
      var obj = {};
      headers.forEach(function (h, i) { obj[h] = row[i] !== undefined ? row[i] : ''; });
      return obj;
    });
  }

  function _setStatus(msg, isError) {
    var color = isError ? 'var(--color-error-text)' : 'var(--color-text-3)';
    _$container.find('#nds-intg-status').html('<span style="color:' + color + '">' + _esc(msg) + '</span>');
  }

  function _esc(s) { return $('<span>').text(String(s == null ? '' : s)).html(); }

  function getValue() {
    if (!_fetchedData || !_fetchedData.length) return null;
    return { data: _fetchedData, meta: { type: 'integration', provider: _provider, status: 'connected' } };
  }

  function destroy() {
    if (_$container) _$container.off('click change');
    _$container           = null;
    _fetchedData          = null;
    _provider             = null;
    _selectedConnectionId = null;
  }

  return { render: render, getValue: getValue, destroy: destroy };
}());

window.DatasetSourceIntegration = DatasetSourceIntegration;
