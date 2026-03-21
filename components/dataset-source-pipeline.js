/**
 * dataset-source-pipeline.js
 * Sub-component for "Pipeline Output" source type in the New Dataset wizard.
 * Lists available pipelines, runs them on demand, previews output.
 *
 * Contract: render($container), getValue(), destroy()
 */
var DatasetSourcePipeline = (function () {
  'use strict';

  var _$container    = null;
  var _selectedId    = null;
  var _outputData    = null;

  function render($container) {
    _$container = $container;
    _selectedId = null;
    _outputData = null;

    var pipelines = window.DatasetStore ? DatasetStore.getPipelines() : [];

    if (!pipelines.length) {
      $container.html(
        '<div class="empty-state" style="padding:var(--spacing-24) 0">' +
          '<div class="empty-state__title">No pipelines available</div>' +
          '<div class="empty-state__desc">Create a pipeline in the Pipelines tab first.</div>' +
        '</div>'
      );
      return;
    }

    var options = pipelines.map(function (p) {
      return '<option value="' + _esc(p.id) + '">' + _esc(p.name || p.id) + '</option>';
    }).join('');

    $container.html(
      '<div class="form-group">' +
        '<label class="form-label">Select Pipeline</label>' +
        '<select class="form-select" id="nds-pl-select">' +
          '<option value="">— Choose a pipeline —</option>' + options +
        '</select>' +
      '</div>' +
      '<div style="display:flex;align-items:center;gap:var(--spacing-8);margin-bottom:var(--spacing-12)">' +
        '<button class="btn btn--ghost btn--sm" id="nds-pl-run" disabled>Run Pipeline</button>' +
        '<span id="nds-pl-status" style="font-size:var(--font-size-xs);color:var(--color-text-3)"></span>' +
      '</div>' +
      '<div id="nds-pl-preview"></div>'
    );

    $container.on('change', '#nds-pl-select', function () {
      _selectedId = $(this).val() || null;
      _outputData = null;
      $('#nds-pl-run').prop('disabled', !_selectedId);
      $('#nds-pl-preview').empty();
      $('#nds-pl-status').text('');

      if (_selectedId) {
        /* Check if output already registered */
        var existing = DatasetStore.get(_selectedId + '-out');
        if (existing && existing.length) {
          _outputData = existing;
          $('#nds-pl-status').text(existing.length + ' rows available (from last run)');
          _renderPreview();
        } else {
          $('#nds-pl-status').text('No output yet — click Run Pipeline');
        }
      }
    });

    $container.on('click', '#nds-pl-run', function () {
      if (!_selectedId) return;
      var config = DatasetStore.getPipeline(_selectedId);
      if (!config) return;
      $('#nds-pl-status').text('Running…');
      $('#nds-pl-run').prop('disabled', true);

      var result = window.PipelineEngine ? PipelineEngine.run(config) : { error: 'PipelineEngine not available' };

      if (result.error) {
        $('#nds-pl-status').html('<span style="color:var(--color-error-text)">' + _esc(result.error) + '</span>');
      } else {
        _outputData = result.output;
        $('#nds-pl-status').text(_outputData.length + ' rows generated');
        _renderPreview();
      }
      $('#nds-pl-run').prop('disabled', false);
    });
  }

  function _renderPreview() {
    if (!_outputData || !_outputData.length) {
      $('#nds-pl-preview').html('<div style="color:var(--color-text-3);font-size:var(--font-size-xs)">No rows to preview.</div>');
      return;
    }
    var cols  = Object.keys(_outputData[0]);
    var rows  = _outputData.slice(0, 5);
    var thead = '<tr>' + cols.map(function (c) { return '<th>' + _esc(c) + '</th>'; }).join('') + '</tr>';
    var tbody = rows.map(function (row) {
      return '<tr>' + cols.map(function (c) {
        return '<td>' + _esc(String(row[c] != null ? row[c] : '')) + '</td>';
      }).join('') + '</tr>';
    }).join('');
    $('#nds-pl-preview').html(
      '<div class="nds-preview-wrap"><table class="nds-preview-table"><thead>' + thead + '</thead><tbody>' + tbody + '</tbody></table></div>' +
      '<div class="nds-preview-info">Showing 5 of ' + _outputData.length + ' rows · ' + cols.length + ' columns</div>'
    );
  }

  function _esc(s) { return $('<span>').text(String(s == null ? '' : s)).html(); }

  function getValue() {
    if (!_outputData || !_outputData.length) return null;
    return { data: _outputData, meta: { sourcePipeline: _selectedId, type: 'source' } };
  }

  function destroy() {
    if (_$container) _$container.off('change input click');
    _$container = null;
    _selectedId = null;
    _outputData = null;
  }

  return { render: render, getValue: getValue, destroy: destroy };
}());

window.DatasetSourcePipeline = DatasetSourcePipeline;
