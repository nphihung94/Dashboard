/**
 * dataset-source-api.js
 * Sub-component for "API Endpoint" source type.
 * Supports GET/POST, auth (None/Bearer/API Key), custom headers, JSON + CSV responses.
 *
 * Contract: render($container), getValue(), destroy()
 */
var DatasetSourceApi = (function () {
  'use strict';

  var _$container  = null;
  var _fetchedData = null;
  var _apiMeta     = null;

  function render($container) {
    _$container  = $container;
    _fetchedData = null;
    _apiMeta     = null;

    $container.html(
      /* URL + Method row */
      '<div style="display:flex;gap:var(--spacing-8);margin-bottom:var(--spacing-12)">' +
        '<input class="form-input" id="nds-api-url" placeholder="https://api.example.com/data" style="flex:1" />' +
        '<select class="form-select" id="nds-api-method" style="width:90px">' +
          '<option value="GET">GET</option><option value="POST">POST</option>' +
        '</select>' +
      '</div>' +
      /* Auth */
      '<div class="form-group">' +
        '<label class="form-label">Authentication</label>' +
        '<select class="form-select" id="nds-api-auth">' +
          '<option value="none">None</option>' +
          '<option value="bearer">Bearer Token</option>' +
          '<option value="apikey">API Key</option>' +
        '</select>' +
      '</div>' +
      '<div id="nds-api-auth-fields"></div>' +
      /* Headers */
      '<div class="form-group">' +
        '<label class="form-label" style="display:flex;justify-content:space-between">' +
          'Headers' +
          '<button class="btn btn--ghost btn--sm" id="nds-api-add-header" type="button">+ Add</button>' +
        '</label>' +
        '<div id="nds-api-headers"></div>' +
      '</div>' +
      /* Body (POST only) */
      '<div class="form-group" id="nds-api-body-group" style="display:none">' +
        '<label class="form-label">Request Body (JSON)</label>' +
        '<textarea class="form-input" id="nds-api-body" rows="3" ' +
          'placeholder=\'{"key":"value"}\'></textarea>' +
      '</div>' +
      /* Fetch button */
      '<div style="display:flex;align-items:center;gap:var(--spacing-8);margin-bottom:var(--spacing-12)">' +
        '<button class="btn btn--ghost btn--sm" id="nds-api-fetch">Fetch &amp; Preview</button>' +
        '<span id="nds-api-status" style="font-size:var(--font-size-xs);color:var(--color-text-3)"></span>' +
      '</div>' +
      '<div id="nds-api-preview"></div>'
    );

    _bindEvents($container);
  }

  function _bindEvents($c) {
    /* Show/hide body textarea for POST */
    $c.on('change', '#nds-api-method', function () {
      $('#nds-api-body-group').toggle($(this).val() === 'POST');
    });

    /* Auth type change — render conditional fields */
    $c.on('change', '#nds-api-auth', _renderAuthFields);

    /* Add header row */
    $c.on('click', '#nds-api-add-header', function (e) {
      e.preventDefault();
      $('#nds-api-headers').append(
        '<div class="nds-kv-row">' +
          '<input class="form-input nds-hdr-key" placeholder="Header name" />' +
          '<input class="form-input nds-hdr-val" placeholder="Value" />' +
          '<button class="nds-hdr-remove" type="button" title="Remove">×</button>' +
        '</div>'
      );
    });

    /* Remove header row */
    $c.on('click', '.nds-hdr-remove', function () {
      $(this).closest('.nds-kv-row').remove();
    });

    /* Fetch & Preview */
    $c.on('click', '#nds-api-fetch', _doFetch);
  }

  function _renderAuthFields() {
    var type   = $('#nds-api-auth').val();
    var $fields = $('#nds-api-auth-fields');
    if (type === 'bearer') {
      $fields.html(
        '<div class="form-group">' +
          '<input class="form-input" id="nds-api-token" placeholder="Enter bearer token" />' +
        '</div>'
      );
    } else if (type === 'apikey') {
      $fields.html(
        '<div class="nds-kv-row">' +
          '<input class="form-input" id="nds-api-key-name" placeholder="Header name (e.g. X-API-Key)" />' +
          '<input class="form-input" id="nds-api-key-value" placeholder="API key value" />' +
        '</div>'
      );
    } else {
      $fields.empty();
    }
  }

  function _buildHeaders() {
    var headers  = {};
    var authType = $('#nds-api-auth').val();
    if (authType === 'bearer') {
      var token = $('#nds-api-token').val().trim();
      if (token) headers['Authorization'] = 'Bearer ' + token;
    } else if (authType === 'apikey') {
      var kn = $('#nds-api-key-name').val().trim();
      if (kn) headers[kn] = $('#nds-api-key-value').val().trim();
    }
    $('#nds-api-headers .nds-kv-row').each(function () {
      var k = $(this).find('.nds-hdr-key').val().trim();
      var v = $(this).find('.nds-hdr-val').val().trim();
      if (k) headers[k] = v;
    });
    return headers;
  }

  function _doFetch() {
    var url = $('#nds-api-url').val().trim();
    if (!url) { $('#nds-api-url').focus(); return; }

    var method  = $('#nds-api-method').val();
    var headers = _buildHeaders();
    var opts    = { method: method, headers: headers };

    if (method === 'POST') {
      opts.body = $('#nds-api-body').val();
      if (!headers['Content-Type']) headers['Content-Type'] = 'application/json';
    }

    _setStatus('Fetching…');
    _fetchedData = null;
    $('#nds-api-preview').empty();

    fetch(url, opts)
      .then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status + ' ' + res.statusText);
        var ct = res.headers.get('content-type') || '';
        if (ct.indexOf('json') !== -1) {
          return res.json().then(function (j) { return { type: 'json', data: j }; });
        }
        return res.text().then(function (t) { return { type: 'text', data: t }; });
      })
      .then(function (result) {
        var arr;
        if (result.type === 'json') {
          arr = Array.isArray(result.data) ? result.data
              : (result.data && Array.isArray(result.data.data)) ? result.data.data
              : null;
          if (!arr) throw new Error('Response JSON is not an array. Wrap it in a "data" property.');
        } else {
          var parsed = Papa.parse(result.data, { header: true, dynamicTyping: true, skipEmptyLines: true });
          if (!parsed.data.length) throw new Error('Could not parse response as CSV.');
          arr = parsed.data;
        }
        _fetchedData = arr;
        _apiMeta     = { type: 'api', url: url, method: method };
        _setStatus(arr.length + ' rows fetched');
        _renderPreview(arr);
      })
      .catch(function (err) {
        var msg = err.message;
        if (msg.indexOf('Failed to fetch') !== -1 || msg.indexOf('NetworkError') !== -1) {
          msg = 'Request blocked (CORS or network error). Use a backend proxy for cross-origin APIs.';
        }
        _setStatus(msg, true);
      });
  }

  function _renderPreview(data) {
    if (!data || !data.length) return;
    var cols  = Object.keys(data[0]);
    var rows  = data.slice(0, 5);
    var thead = '<tr>' + cols.map(function (c) { return '<th>' + _esc(c) + '</th>'; }).join('') + '</tr>';
    var tbody = rows.map(function (row) {
      return '<tr>' + cols.map(function (c) {
        return '<td>' + _esc(String(row[c] != null ? row[c] : '')) + '</td>';
      }).join('') + '</tr>';
    }).join('');
    $('#nds-api-preview').html(
      '<div class="nds-preview-wrap"><table class="nds-preview-table"><thead>' + thead + '</thead><tbody>' + tbody + '</tbody></table></div>' +
      '<div class="nds-preview-info">Showing 5 of ' + data.length + ' rows · ' + cols.length + ' columns</div>'
    );
  }

  function _setStatus(msg, isError) {
    var color = isError ? 'var(--color-error-text)' : 'var(--color-text-3)';
    $('#nds-api-status').html('<span style="color:' + color + '">' + _esc(msg) + '</span>');
  }

  function _esc(s) { return $('<span>').text(String(s == null ? '' : s)).html(); }

  function getValue() {
    if (!_fetchedData || !_fetchedData.length) return null;
    return { data: _fetchedData, meta: _apiMeta || {} };
  }

  function destroy() {
    if (_$container) _$container.off('click change input');
    _$container = null; _fetchedData = null; _apiMeta = null;
  }

  return { render: render, getValue: getValue, destroy: destroy };
}());

window.DatasetSourceApi = DatasetSourceApi;
