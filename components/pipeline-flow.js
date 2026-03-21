/**
 * pipeline-flow.js
 * Renders the pipeline Flow tab: horizontal stage node canvas + output preview table.
 *
 * API:
 *   PipelineFlow.render($container, pipeline, options)
 *   options: { onStageSelect(stageId), onAddStage() }
 */

var PipelineFlow = (function () {
  'use strict';

  /* Stage type → CSS class for colored header */
  var _headClass = {
    source:         'head-source',
    removeColumns:  'head-remove-columns',
    filterRows:     'head-filter-rows',
    replaceValues:  'head-replace-values',
    groupBy:        'head-group-by',
    addColumn:      'head-add-column',
    sort:           'head-sort',
    merge:          'head-merge',
    pivot:          'head-pivot',
    unpivot:        'head-unpivot',
    output:         'head-output'
  };

  /* Stage type → short display label */
  var _typeLabel = {
    source:        'Source',
    removeColumns: 'Remove Cols',
    filterRows:    'Filter Rows',
    replaceValues: 'Replace',
    groupBy:       'Group By',
    addColumn:     'Add Column',
    sort:          'Sort',
    merge:         'Merge',
    pivot:         'Pivot',
    unpivot:       'Unpivot',
    output:        'Output'
  };

  /* Small SVG icons per stage type */
  var _stageIcon = {
    source:        '<svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><ellipse cx="8" cy="5" rx="6" ry="2.5"/><path d="M2 5v6c0 1.38 2.69 2.5 6 2.5s6-1.12 6-2.5V5"/></svg>',
    removeColumns: '<svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><line x1="4" y1="4" x2="12" y2="12"/><line x1="12" y1="4" x2="4" y2="12"/></svg>',
    filterRows:    '<svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h12l-5 6v4l-2-1V9L2 3z"/></svg>',
    replaceValues: '<svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M1 8h10M8 5l3 3-3 3"/><path d="M15 4v3h-3"/></svg>',
    groupBy:       '<svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><rect x="2" y="2" width="5" height="5" rx="1"/><rect x="9" y="2" width="5" height="5" rx="1"/><rect x="5.5" y="9" width="5" height="5" rx="1"/></svg>',
    addColumn:     '<svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><line x1="8" y1="1" x2="8" y2="15"/><line x1="1" y1="8" x2="15" y2="8"/></svg>',
    sort:          '<svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><line x1="2" y1="5" x2="14" y2="5"/><line x1="2" y1="8" x2="10" y2="8"/><line x1="2" y1="11" x2="6" y2="11"/></svg>',
    merge:         '<svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3v4l6 3 6-3V3"/><line x1="8" y1="10" x2="8" y2="14"/></svg>',
    pivot:         '<svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><rect x="2" y="2" width="12" height="12" rx="1"/><line x1="2" y1="6" x2="14" y2="6"/><line x1="6" y1="2" x2="6" y2="14"/></svg>',
    unpivot:       '<svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><rect x="2" y="2" width="12" height="12" rx="1"/><line x1="2" y1="6" x2="14" y2="6"/><line x1="2" y1="10" x2="14" y2="10"/></svg>',
    output:        '<svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M10 3l4 5-4 5"/><line x1="2" y1="8" x2="13" y2="8"/></svg>'
  };

  var _arrowSvg = '<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#C2C2C2" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><line x1="2" y1="10" x2="16" y2="10"/><polyline points="12,6 16,10 12,14"/></svg>';
  var _plusSvg  = '<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><line x1="10" y1="4" x2="10" y2="16"/><line x1="4" y1="10" x2="16" y2="10"/></svg>';

  /**
   * Build human-readable config summary for a stage node body.
   */
  function _stageSummary(stage) {
    var c = stage.config || {};
    switch (stage.type) {
      case 'source':        return 'From: ' + (c.sourceId || '—');
      case 'removeColumns': return 'Keep: ' + (c.keep || []).join(', ');
      case 'filterRows':    return (c.logic || 'AND') + ' · ' + (c.conditions || []).length + ' condition(s)';
      case 'replaceValues': return 'Col: ' + (c.column || '—') + ' · ' + (c.replacements || []).length + ' rule(s)';
      case 'groupBy':       return 'By: ' + (c.groupBy || []).join(', ') + ' · ' + (c.aggregates || []).length + ' agg(s)';
      case 'addColumn':     return (c.columns || []).map(function (x) { return x.name; }).join(', ');
      case 'sort':          return (c.field || '—') + ' ' + (c.direction || 'asc');
      case 'merge':         return 'Join: ' + (c.datasetId || '—') + ' on ' + (c.leftKey || '—');
      case 'pivot':         return 'Pivot: ' + (c.pivotCol || '—');
      case 'unpivot':       return 'Cols: ' + (c.valueCols || []).join(', ');
      case 'output':        return 'Name: ' + (c.name || '—');
      default:              return '';
    }
  }

  function render($container, pipeline, options) {
    options = options || {};
    var stages = pipeline.stages || [];

    /* Build stage nodes HTML */
    var nodesHtml = stages.map(function (stage, idx) {
      var hClass  = _headClass[stage.type] || 'head-source';
      var icon    = _stageIcon[stage.type] || '';
      var label   = _typeLabel[stage.type] || stage.type;
      var summary = _stageSummary(stage);
      var arrow   = idx < stages.length ? '<div class="stage-arrow">' + _arrowSvg + '</div>' : '';

      return (idx > 0 ? '<div class="stage-arrow">' + _arrowSvg + '</div>' : '') +
        '<div class="stage-node" data-stage-id="' + stage.id + '">' +
          '<div class="stage-node__head ' + hClass + '">' +
            '<span class="stage-node__icon">' + icon + '</span>' +
            '<span class="stage-node__type-label">' + label + '</span>' +
          '</div>' +
          '<div class="stage-node__body">' + _esc(summary) + '</div>' +
        '</div>';
    }).join('');

    /* Add stage dashed card */
    nodesHtml += (stages.length ? '<div class="stage-arrow">' + _arrowSvg + '</div>' : '') +
      '<button class="stage-add" id="btn-add-stage">' +
        _plusSvg + '<span>Add Stage</span>' +
      '</button>';

    /* Output preview */
    var outputName = _findOutputName(stages);
    var previewHtml = _buildPreview(outputName, pipeline);

    $container.html(
      '<div class="flow-canvas-wrap"><div class="flow-canvas">' + nodesHtml + '</div></div>' +
      previewHtml
    );

    _bindEvents($container, options);
  }

  function _findOutputName(stages) {
    for (var i = stages.length - 1; i >= 0; i--) {
      if (stages[i].type === 'output' && stages[i].config && stages[i].config.name) {
        return stages[i].config.name;
      }
    }
    return null;
  }

  function _buildPreview(outputName, pipeline) {
    if (!outputName || !window.DatasetStore) {
      return '<div class="dataset-preview"><div class="dataset-preview__header">Output Preview — run pipeline to see results</div></div>';
    }
    var data = DatasetStore.get(outputName);
    if (!data || !data.length) {
      return '<div class="dataset-preview"><div class="dataset-preview__header">Output: <b>' + _esc(outputName) +
        '</b> — no data yet. Click "Run Pipeline".</div></div>';
    }

    var cols = Object.keys(data[0]);
    var rows = data.slice(0, 8);

    var thead = '<tr>' + cols.map(function (c) { return '<th>' + _esc(c) + '</th>'; }).join('') + '</tr>';
    var tbody = rows.map(function (row) {
      return '<tr>' + cols.map(function (c) {
        var v = row[c];
        if (typeof v === 'number') v = Math.round(v * 100) / 100;
        return '<td>' + _esc(String(v !== null && v !== undefined ? v : '')) + '</td>';
      }).join('') + '</tr>';
    }).join('');

    return '<div class="dataset-preview">' +
      '<div class="dataset-preview__header">Output: <b>' + _esc(outputName) + '</b> &nbsp;·&nbsp; ' +
        data.length + ' rows &nbsp;·&nbsp; ' + cols.length + ' columns</div>' +
      '<table class="dataset-preview__table"><thead>' + thead + '</thead><tbody>' + tbody + '</tbody></table>' +
    '</div>';
  }

  function _bindEvents($container, options) {
    $container.on('click', '.stage-node', function () {
      $container.find('.stage-node').removeClass('is-active');
      $(this).addClass('is-active');
      if (options.onStageSelect) options.onStageSelect($(this).data('stageId'));
    });

    $container.on('click', '#btn-add-stage', function (e) {
      e.stopPropagation();
      if (options.onAddStage) options.onAddStage();
    });
  }

  function _esc(str) {
    return $('<span>').text(String(str || '')).html();
  }

  return { render: render };
}());

window.PipelineFlow = PipelineFlow;
