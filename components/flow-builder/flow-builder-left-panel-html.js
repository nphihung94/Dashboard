/**
 * flow-builder-left-panel-html.js
 * Pure HTML-building helpers for FlowBuilderLeftPanel.
 * No DOM manipulation — returns HTML strings only.
 * Loaded before flow-builder-left-panel.js.
 */
var FlowBuilderLeftPanelHtml = (function () {
  'use strict';

  var _headClass = {
    source: 'head-source',    filter: 'head-filter-rows',  select: 'head-remove-columns',
    aggregate: 'head-group-by', sort: 'head-sort',         limit: 'head-output',
    formula: 'head-add-column', pivot: 'head-pivot',       unpivot: 'head-unpivot'
  };
  var _typeLabel = {
    source: 'Source', filter: 'Filter', select: 'Select', aggregate: 'Aggregate',
    sort: 'Sort', limit: 'Limit', formula: 'Formula', pivot: 'Pivot', unpivot: 'Unpivot'
  };

  function _esc(str) { return $('<span>').text(String(str == null ? '' : str)).html(); }

  /** Body section of a stage accordion item. */
  function renderBody(stage, label, isExpanded) {
    var hasSaved = stage.outputSchema ? '' : ' disabled';
    var parts = [];
    parts.push('<p class="flow-left__stage-summary">' + _esc(stage.displayText || label) + '</p>');
    if (stage._lastExecData && stage._lastExecData.length > 0) {
      parts.push('<span class="flow-row-count">&rarr; <span class="flow-row-count__value">' +
        stage._lastExecData.length + '</span> rows</span>');
    }
    if (stage.status === 'error' && stage.error) {
      parts.push('<p class="flow-stage-error-text">' + _esc(stage.error) + '</p>');
    }
    parts.push('<button class="btn btn--ghost btn--xs flow-review-btn" data-stage-id="' +
      _esc(stage.id) + '"' + hasSaved + '>Review Output</button>');
    return '<div class="flow-left__stage-body"' + (isExpanded ? '' : ' style="display:none"') + '>' +
      parts.join('') + '</div>';
  }

  /** Full accordion item HTML for one stage. */
  function renderItem(stage, idx, totalStages, expandedId) {
    var hc          = _headClass[stage.type] || 'head-source';
    var label       = _typeLabel[stage.type] || stage.type;
    var statusClass = stage.status === 'saved' ? 'is-saved' : (stage.status === 'error' ? 'is-error' : '');
    var isExpanded  = stage.id === expandedId;
    var isSource    = (idx === 0);

    var stepIndex = '<span class="flow-step-index">' + (idx + 1) + '/' + totalStages + '</span>';

    var reorderBtns = '';
    var optsBtn     = '';
    if (!isSource) {
      var upDis   = idx <= 1 ? ' disabled' : '';
      var downDis = idx >= totalStages - 1 ? ' disabled' : '';
      reorderBtns =
        '<button class="flow-stage-move-btn flow-stage-move-btn--up" data-dir="up"' +
          upDis + ' title="Move up">&#9650;</button>' +
        '<button class="flow-stage-move-btn flow-stage-move-btn--down" data-dir="down"' +
          downDis + ' title="Move down">&#9660;</button>';
      optsBtn = '<div class="flow-stage-opts-wrap" style="position:relative">' +
        '<button class="flow-stage-opts-btn" title="Options">&#8943;</button>' +
        '<div class="flow-stage-mini-menu" style="display:none">' +
          '<div class="flow-stage-mini-menu__item flow-stage-dup-item">Duplicate</div>' +
        '</div>' +
      '</div>';
    }

    return (
      '<div class="flow-left__stage-item ' + statusClass + (isExpanded ? ' is-expanded' : '') +
          '" data-stage-id="' + _esc(stage.id) + '" data-stage-idx="' + idx + '">' +
        '<div class="flow-left__stage-header">' +
          stepIndex +
          '<span class="flow-left__stage-icon ' + hc + '"></span>' +
          '<span class="flow-left__stage-name">' + _esc(label) + '</span>' +
          '<span class="flow-status-dot ' + _esc(statusClass) + '"></span>' +
          reorderBtns +
          optsBtn +
          '<span class="flow-left__chevron">&#9660;</span>' +
        '</div>' +
        renderBody(stage, label, isExpanded) +
      '</div>'
    );
  }

  return { renderItem: renderItem, typeLabel: _typeLabel };
}());

window.FlowBuilderLeftPanelHtml = FlowBuilderLeftPanelHtml;
