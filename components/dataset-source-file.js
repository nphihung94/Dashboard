/**
 * dataset-source-file.js
 * Sub-component for "File Upload" source type: CSV, Excel (.xlsx/.xls), MySQL Export (.sql).
 * CSV parsed via PapaParse (already global). Excel via lazy SheetJS CDN load.
 * MySQL Export: parses mysqldump INSERT statements into tabular rows.
 *
 * Contract: render($container), getValue(), destroy()
 */
var DatasetSourceFile = (function () {
  'use strict';

  var _$container = null;
  var _activeTab  = 'csv';   // 'csv' | 'excel' | 'mysql-export'
  var _parsedData = null;
  var _fileMeta   = null;
  var _workbook   = null;
  var _fileName   = '';

  /* ── Public API ── */

  function render($container) {
    _$container = $container;
    _parsedData = null;
    _fileMeta   = null;
    _workbook   = null;
    _activeTab  = 'csv';

    $container.html(
      '<div class="modal-tabs" id="nds-file-tabs">' +
        '<button class="modal-tab is-active" data-tab="csv">CSV</button>' +
        '<button class="modal-tab" data-tab="excel">Excel</button>' +
        '<button class="modal-tab" data-tab="mysql-export">MySQL Export</button>' +
      '</div>' +
      '<div id="nds-file-tab-content"></div>'
    );

    _renderTab('csv');

    $container.on('click', '.modal-tab', function () {
      var tab = $(this).data('tab');
      $container.find('.modal-tab').removeClass('is-active');
      $(this).addClass('is-active');
      _parsedData = null;
      _fileMeta   = null;
      _activeTab  = tab;
      _renderTab(tab);
    });
  }

  function _renderTab(tab) {
    var $c = $('#nds-file-tab-content');
    if (tab === 'csv')          { $c.html(_dropzoneHtml('.csv', 'CSV files up to 10MB'));            _bindDropzone('csv'); }
    if (tab === 'excel')        { $c.html(_dropzoneHtml('.xlsx,.xls', 'Excel files up to 10MB'));    _bindDropzone('excel'); }
    if (tab === 'mysql-export') { $c.html(_dropzoneHtml('.sql', 'MySQL dump (.sql) up to 10MB') +
      '<div style="font-size:var(--font-size-xs);color:var(--color-text-3);margin-top:var(--spacing-4)">' +
        'Parses INSERT statements from a mysqldump export file.' +
      '</div>'); _bindDropzone('mysql-export'); }
  }

  function _dropzoneHtml(accept, hint) {
    return '<div class="nds-dropzone" id="nds-dropzone">' +
      '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" style="margin-bottom:8px;color:var(--color-text-3)"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17,8 12,3 7,8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>' +
      '<div>Drop file here or <label class="nds-dropzone__link">browse' +
        '<input type="file" id="nds-file-input" accept="' + accept + '" hidden />' +
      '</label></div>' +
      '<div style="font-size:10px;color:var(--color-text-3);margin-top:4px">' + hint + '</div>' +
    '</div>' +
    '<div id="nds-file-status" style="font-size:var(--font-size-xs);color:var(--color-text-3);margin-top:var(--spacing-8)"></div>' +
    '<div id="nds-file-preview"></div>';
  }

  function _bindDropzone(type) {
    var $zone  = $('#nds-dropzone');
    var $input = $('#nds-file-input');

    $zone.on('click', function () { $input.click(); });
    $input.on('change', function () {
      var file = this.files && this.files[0];
      if (file) _handleFile(file, type);
    });
    $zone.on('dragover', function (e) { e.preventDefault(); $zone.addClass('is-dragover'); });
    $zone.on('dragleave drop', function (e) {
      e.preventDefault();
      $zone.removeClass('is-dragover');
      if (e.type === 'drop') {
        var file = e.originalEvent.dataTransfer.files[0];
        if (file) _handleFile(file, type);
      }
    });
  }

  function _handleFile(file, type) {
    if (file.size > 10 * 1024 * 1024) { _showStatus('File exceeds 10MB limit', true); return; }
    _fileName = file.name;
    _showStatus('Parsing ' + _esc(file.name) + '…');
    if (type === 'csv') {
      _parseCSV(file);
    } else if (type === 'mysql-export') {
      _parseSQLFile(file);
    } else {
      _ensureSheetJS(function () { _parseExcel(file); });
    }
  }

  function _parseCSV(file) {
    if (!window.Papa) { _showStatus('PapaParse not loaded', true); return; }
    Papa.parse(file, {
      header: true, dynamicTyping: true, skipEmptyLines: true,
      complete: function (r) {
        _parsedData = r.data;
        _fileMeta   = { sourceFile: _fileName, format: 'csv' };
        _showStatus(_parsedData.length + ' rows parsed');
        _renderPreview();
      },
      error: function (err) { _showStatus('Parse error: ' + err.message, true); }
    });
  }

  function _parseSQLFile(file) {
    var reader = new FileReader();
    reader.onload = function (e) {
      try {
        var result = _parseSQLDump(e.target.result);
        if (!result || !result.length) {
          _showStatus('No INSERT statements found in SQL file.', true);
          return;
        }
        _parsedData = result;
        _fileMeta   = { sourceFile: _fileName, format: 'sql' };
        _showStatus(_parsedData.length + ' rows parsed');
        _renderPreview();
      } catch (ex) { _showStatus('SQL parse error: ' + ex.message, true); }
    };
    reader.readAsText(file);
  }

  /**
   * Parse mysqldump INSERT statements into row objects.
   * Handles: INSERT INTO `table` (col1, col2) VALUES (v1, v2), (v3, v4);
   */
  function _parseSQLDump(sql) {
    var rows   = [];
    var cols   = [];
    var colsFound = false;

    /* Normalize line endings */
    sql = sql.replace(/\r\n/g, '\n');

    /* Extract column list from first INSERT INTO ... (cols) VALUES */
    var colsMatch = sql.match(/INSERT INTO\s+`?\w+`?\s*\(([^)]+)\)\s+VALUES/i);
    if (colsMatch) {
      cols = colsMatch[1].split(',').map(function (c) {
        return c.trim().replace(/^`|`$/g, '');
      });
      colsFound = true;
    }

    /* Parse all VALUES (...) groups */
    var insertRe = /INSERT INTO\s+`?\w+`?(?:\s*\([^)]+\))?\s+VALUES\s*([\s\S]+?);/gi;
    var insertMatch;
    while ((insertMatch = insertRe.exec(sql)) !== null) {
      var valuesBlock = insertMatch[1];
      /* Split individual row tuples */
      var rowRe = /\(([^)]*(?:'[^']*'[^)]*)*)\)/g;
      var rowMatch;
      while ((rowMatch = rowRe.exec(valuesBlock)) !== null) {
        var values = _splitSQLValues(rowMatch[1]);
        if (!colsFound || !cols.length) {
          /* Generate col names col1, col2... */
          cols = values.map(function (_, i) { return 'col' + (i + 1); });
          colsFound = true;
        }
        var row = {};
        cols.forEach(function (c, i) { row[c] = values[i] !== undefined ? values[i] : null; });
        rows.push(row);
      }
    }
    return rows;
  }

  /**
   * Split a SQL VALUES row string into individual values,
   * handling quoted strings with escaped quotes.
   */
  function _splitSQLValues(str) {
    var values = [];
    var cur = '';
    var inStr = false;
    var i = 0;
    while (i < str.length) {
      var ch = str[i];
      if (!inStr && ch === "'") { inStr = true; i++; continue; }
      if (inStr && ch === "'" && str[i + 1] === "'") { cur += "'"; i += 2; continue; }
      if (inStr && ch === "'") { inStr = false; i++; continue; }
      if (!inStr && ch === ',') { values.push(_coerce(cur.trim())); cur = ''; i++; continue; }
      cur += ch; i++;
    }
    values.push(_coerce(cur.trim()));
    return values;
  }

  function _coerce(v) {
    if (v === 'NULL' || v === 'null') return null;
    var n = Number(v);
    return isNaN(n) || v === '' ? v : n;
  }

  function _parseExcel(file) {
    var reader = new FileReader();
    reader.onload = function (e) {
      try {
        var wb = window.XLSX.read(new Uint8Array(e.target.result), { type: 'array' });
        _workbook = wb;
        _selectSheet(wb.SheetNames[0]);
        if (wb.SheetNames.length > 1) _renderSheetSelector(wb.SheetNames);
      } catch (ex) { _showStatus('Excel parse error: ' + ex.message, true); }
    };
    reader.readAsArrayBuffer(file);
  }

  function _selectSheet(name) {
    var sheet = _workbook.Sheets[name];
    _parsedData = window.XLSX.utils.sheet_to_json(sheet, { defval: '' });
    _fileMeta   = { sourceFile: _fileName, format: 'xlsx', sheet: name };
    _showStatus(_parsedData.length + ' rows parsed from sheet "' + name + '"');
    _renderPreview();
  }

  function _renderSheetSelector(names) {
    var opts = names.map(function (n) { return '<option>' + _esc(n) + '</option>'; }).join('');
    $('#nds-file-preview').prepend(
      '<div class="form-group" style="margin-bottom:var(--spacing-8)">' +
        '<label class="form-label">Sheet</label>' +
        '<select class="form-select" id="nds-sheet-select">' + opts + '</select>' +
      '</div>'
    );
    $('#nds-sheet-select').on('change', function () { _selectSheet($(this).val()); });
  }

  function _ensureSheetJS(cb) {
    if (window.XLSX) { cb(); return; }
    var s = document.createElement('script');
    s.src = 'https://cdn.sheetjs.com/xlsx-latest/package/dist/xlsx.full.min.js';
    s.onload  = cb;
    s.onerror = function () { _showStatus('Failed to load Excel parser. Try CSV instead.', true); };
    document.head.appendChild(s);
  }

  function _renderPreview() {
    if (!_parsedData || !_parsedData.length) return;
    var cols  = Object.keys(_parsedData[0]);
    var rows  = _parsedData.slice(0, 5);
    var thead = '<tr>' + cols.map(function (c) { return '<th>' + _esc(c) + '</th>'; }).join('') + '</tr>';
    var tbody = rows.map(function (row) {
      return '<tr>' + cols.map(function (c) { return '<td>' + _esc(String(row[c] != null ? row[c] : '')) + '</td>'; }).join('') + '</tr>';
    }).join('');
    $('#nds-file-preview').html(
      '<div class="nds-preview-wrap"><table class="nds-preview-table"><thead>' + thead + '</thead><tbody>' + tbody + '</tbody></table></div>' +
      '<div class="nds-preview-info">Showing 5 of ' + _parsedData.length + ' rows · ' + cols.length + ' columns</div>'
    );
  }

  function _showStatus(msg, isError) {
    var style = isError ? 'color:var(--color-error-text)' : 'color:var(--color-text-3)';
    $('#nds-file-status').html('<span style="' + style + '">' + _esc(msg) + '</span>');
  }

  function _esc(s) { return $('<span>').text(String(s == null ? '' : s)).html(); }

  function getValue() {
    if (!_parsedData || !_parsedData.length) return null;
    return { data: _parsedData, meta: _fileMeta || {} };
  }

  function destroy() {
    if (_$container) _$container.off('click change dragover dragleave drop');
    _$container = null; _parsedData = null; _fileMeta = null; _workbook = null;
  }

  return { render: render, getValue: getValue, destroy: destroy };
}());

window.DatasetSourceFile = DatasetSourceFile;
