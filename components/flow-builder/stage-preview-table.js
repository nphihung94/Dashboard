/**
 * stage-preview-table.js
 * Renders a compact data preview table for a flow stage output.
 * Supports row-limit selector (10/25/50/100). Reuses dataset-preview CSS.
 *
 * API:
 *   StagePreviewTable.render($container, data, schema, limit)
 *   StagePreviewTable.renderEmpty($container, message)
 *   StagePreviewTable.renderForStage($container, stage)
 */

var StagePreviewTable = (function () {
  'use strict';

  var PAGE_SIZES = [10, 25, 50, 100];

  /**
   * Render preview table with optional row limit selector.
   * @param {jQuery} $container
   * @param {Array}  data    - array of row objects
   * @param {Object} schema  - { columns: [{name, type}] }
   * @param {number} limit   - rows to show (default 10)
   */
  function render($container, data, schema, limit) {
    if (!data || !data.length) {
      renderEmpty($container, 'No rows returned');
      return;
    }

    limit = limit || $container.data('previewLimit') || 10;
    $container.data('previewLimit', limit);

    var cols = schema && schema.columns && schema.columns.length
      ? schema.columns.map(function (c) { return c.name; })
      : Object.keys(data[0]);

    var preview = data.slice(0, limit);
    var total   = data.length;

    var thead = '<tr>' + cols.map(function (c) {
      var badge = '';
      if (schema && schema.columns) {
        for (var j = 0; j < schema.columns.length; j++) {
          if (schema.columns[j].name === c) {
            var t = schema.columns[j].type || '';
            var icons = { string: 'T', number: '#', date: 'D', boolean: 'B' };
            var letter = icons[t] || (t ? t.charAt(0).toUpperCase() : '');
            var mod = t === 'number' ? '--number' : (t === 'date' ? '--date' : (t === 'boolean' ? '--boolean' : ''));
            if (letter) badge = '<span class="flow-type-badge' + (mod ? ' flow-type-badge' + mod : '') + '">' + letter + '</span> ';
            break;
          }
        }
      }
      return '<th>' + badge + _esc(c) + '</th>';
    }).join('') + '</tr>';

    var tbody = preview.map(function (row) {
      return '<tr>' + cols.map(function (c) {
        var v = row[c];
        if (typeof v === 'number') v = Math.round(v * 100) / 100;
        return '<td>' + _esc(String(v !== null && v !== undefined ? v : '')) + '</td>';
      }).join('') + '</tr>';
    }).join('');

    var summary = 'Showing ' + preview.length + ' of ' + total + ' rows &nbsp;&middot;&nbsp; ' + cols.length + ' columns';

    var pagOpts = PAGE_SIZES.map(function (s) {
      return '<option value="' + s + '"' + (s === limit ? ' selected' : '') + '>' + s + ' rows</option>';
    }).join('');

    $container.html(
      '<div class="flow-preview dataset-preview">' +
        '<div class="dataset-preview__header flow-preview-stats">' +
          '<span>' + summary + '</span>' +
          '<select class="flow-preview-limit">' + pagOpts + '</select>' +
        '</div>' +
        '<table class="dataset-preview__table">' +
          '<thead>' + thead + '</thead>' +
          '<tbody>' + tbody + '</tbody>' +
        '</table>' +
      '</div>'
    );

    /* Bind page-size change — store data ref via closure */
    $container.off('change.previewPage').on('change.previewPage', '.flow-preview-limit', function () {
      var newLimit = parseInt($(this).val(), 10) || 10;
      render($container, data, schema, newLimit);
    });
  }

  /**
   * Render an empty / error state.
   * @param {jQuery} $container
   * @param {string} message
   */
  function renderEmpty($container, message) {
    $container.html(
      '<div class="flow-preview dataset-preview">' +
        '<div class="dataset-preview__header" style="color:#F44336">' +
          _esc(message || 'No data') +
        '</div>' +
      '</div>'
    );
  }

  /**
   * Convenience: render cached output from a saved stage object.
   */
  function renderForStage($container, stage) {
    if (!stage._lastExecData || !stage._lastExecData.length) {
      renderEmpty($container, 'No output data \u2014 save this stage first');
      return;
    }
    render($container, stage._lastExecData, stage.outputSchema, 10);
  }

  function _esc(str) {
    return $('<span>').text(String(str || '')).html();
  }

  return { render: render, renderEmpty: renderEmpty, renderForStage: renderForStage };
}());

window.StagePreviewTable = StagePreviewTable;
