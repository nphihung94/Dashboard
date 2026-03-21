/**
 * page-dataset.js
 * Dataset page: table listing all raw sources + pipeline outputs.
 * Supports row-expand preview and CSV export.
 *
 * API:
 *   PageDataset.render($container)
 *   PageDataset.destroy()
 */

var PageDataset = (function () {
  'use strict';

  function render($container) {
    var datasets = window.DatasetStore ? DatasetStore.list() : [];

    $container.html(
      '<div class="page-header">' +
        '<div class="page-header__breadcrumb">Home › Datasets</div>' +
        '<div class="page-header__title">Datasets</div>' +
        '<div class="page-header__spacer"></div>' +
        '<input type="text" class="form-input" id="dataset-search" ' +
          'placeholder="Search datasets…" style="width:220px;height:30px;margin-right:8px" />' +
        '<div class="page-header__actions">' +
          '<button class="btn btn--primary" id="btn-new-dataset">' +
            '<svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">' +
              '<line x1="8" y1="2" x2="8" y2="14"/><line x1="2" y1="8" x2="14" y2="8"/>' +
            '</svg>' +
            ' New Dataset' +
          '</button>' +
        '</div>' +
      '</div>' +
      '<div class="page-content">' +
        '<div class="card" style="overflow:hidden">' +
          '<table class="data-table" id="dataset-table">' +
            '<thead><tr>' +
              '<th>Name</th><th>Type</th><th style="text-align:right">Rows</th>' +
              '<th style="text-align:right">Columns</th><th>Source Pipeline</th>' +
              '<th>Last Updated</th><th>Actions</th>' +
            '</tr></thead>' +
            '<tbody id="dataset-tbody">' + _buildRows(datasets) + '</tbody>' +
          '</table>' +
          (!datasets.length ? '<div class="empty-state"><div class="empty-state__title">No datasets found</div>' +
            '<div class="empty-state__desc">Run a pipeline to generate output datasets.</div></div>' : '') +
        '</div>' +
      '</div>'
    );

    _bindEvents($container, datasets);
  }

  function _buildRows(datasets) {
    if (!datasets.length) return '';
    return datasets.map(function (d) {
      var typeBadge = d.type === 'source'
        ? '<span class="badge badge--blue">Source</span>'
        : '<span class="badge badge--green">Output</span>';
      var updated = d.updatedAt ? new Date(d.updatedAt).toLocaleString() : '—';
      var pipeline = d.sourcePipeline
        ? '<a href="#pipeline/' + _esc(d.sourcePipeline) + '" style="color:var(--color-brand)">' +
            _esc(d.sourcePipeline) + '</a>'
        : '<span style="color:#C2C2C2">—</span>';

      return '<tr class="dataset-row" data-id="' + _esc(d.id) + '">' +
        '<td style="font-weight:500">' + _esc(d.name || d.id) + '</td>' +
        '<td>' + typeBadge + '</td>' +
        '<td style="text-align:right;font-variant-numeric:tabular-nums">' + (d.rows || 0) + '</td>' +
        '<td style="text-align:right">' + (d.cols || 0) + '</td>' +
        '<td>' + pipeline + '</td>' +
        '<td style="font-size:12px;color:#8F8F8F">' + _esc(updated) + '</td>' +
        '<td>' +
          '<div style="display:flex;gap:4px">' +
            '<button class="btn btn--ghost btn--sm btn-preview" data-id="' + _esc(d.id) + '">Preview</button>' +
            '<button class="btn btn--ghost btn--sm btn-export"  data-id="' + _esc(d.id) + '">Export CSV</button>' +
          '</div>' +
        '</td>' +
      '</tr>' +
      /* Preview row (hidden) */
      '<tr class="dataset-preview-row" id="preview-' + _esc(d.id) + '" style="display:none">' +
        '<td colspan="7" style="padding:0">' +
          '<div class="dataset-preview" style="margin:0;border-radius:0;border-left:none;border-right:none">' +
            '<div class="dataset-preview__header" id="preview-hdr-' + _esc(d.id) + '">Loading…</div>' +
            '<div id="preview-body-' + _esc(d.id) + '"></div>' +
          '</div>' +
        '</td>' +
      '</tr>';
    }).join('');
  }

  function _buildPreview(id) {
    var data = window.DatasetStore ? DatasetStore.get(id) : null;
    if (!data || !data.length) return { header: 'No data', body: '' };

    var cols  = Object.keys(data[0]);
    var rows  = data.slice(0, 10);
    var thead = '<tr>' + cols.map(function (c) { return '<th>' + _esc(c) + '</th>'; }).join('') + '</tr>';
    var tbody = rows.map(function (row) {
      return '<tr>' + cols.map(function (c) {
        var v = row[c];
        if (typeof v === 'number') v = Math.round(v * 100) / 100;
        return '<td>' + _esc(String(v !== null && v !== undefined ? v : '')) + '</td>';
      }).join('') + '</tr>';
    }).join('');

    var header = _esc(id) + ' &nbsp;·&nbsp; ' + data.length + ' rows &nbsp;·&nbsp; ' + cols.length + ' columns (showing 10)';
    var body   = '<table class="dataset-preview__table"><thead>' + thead + '</thead><tbody>' + tbody + '</tbody></table>';
    return { header: header, body: body };
  }

  function _exportCSV(id) {
    var data = window.DatasetStore ? DatasetStore.get(id) : null;
    if (!data || !data.length) {
      if (window.Toast) Toast.error('No data to export');
      return;
    }

    var cols = Object.keys(data[0]);
    var csv  = [cols.join(',')].concat(data.map(function (row) {
      return cols.map(function (c) {
        var v = String(row[c] !== null && row[c] !== undefined ? row[c] : '');
        return v.indexOf(',') !== -1 || v.indexOf('"') !== -1 || v.indexOf('\n') !== -1
          ? '"' + v.replace(/"/g, '""') + '"' : v;
      }).join(',');
    })).join('\n');

    var blob = new Blob([csv], { type: 'text/csv' });
    var url  = URL.createObjectURL(blob);
    var $a   = $('<a>').attr({ href: url, download: id + '.csv' }).appendTo('body');
    $a[0].click();
    $a.remove();
    URL.revokeObjectURL(url);
    if (window.Toast) Toast.success('Exported ' + id + '.csv');
  }

  function _bindEvents($container, datasets) {
    /* New Dataset button */
    $container.on('click', '#btn-new-dataset', function () {
      if (window.NewDatasetModal) {
        NewDatasetModal.open(function () { render($container); });
      }
    });

    /* Search filter */
    $container.on('input', '#dataset-search', function () {
      var q = $(this).val().toLowerCase();
      $container.find('.dataset-row').each(function () {
        var name = $(this).find('td:first').text().toLowerCase();
        var show = !q || name.indexOf(q) !== -1;
        $(this).toggle(show);
        var id = $(this).data('id');
        $('#preview-' + id).toggle(false); // hide preview on filter
      });
    });

    /* Preview toggle */
    $container.on('click', '.btn-preview', function () {
      var id   = $(this).data('id');
      var $row = $('#preview-' + id);
      if ($row.is(':visible')) {
        $row.hide();
        $(this).text('Preview');
        return;
      }
      var preview = _buildPreview(id);
      $('#preview-hdr-' + id).html(preview.header);
      $('#preview-body-' + id).html(preview.body);
      $row.show();
      $(this).text('Hide');
    });

    /* CSV export */
    $container.on('click', '.btn-export', function () {
      _exportCSV($(this).data('id'));
    });
  }

  function _esc(str) {
    return $('<span>').text(String(str || '')).html();
  }

  function destroy() { /* stateless */ }

  return { render: render, destroy: destroy };
}());

window.PageDataset = PageDataset;
