/**
 * flow-builder-left-panel.js
 * Left panel for Data Flow Builder: vertical accordion stage list,
 * Run Flow button, and Add Stage button.
 * HTML building delegated to FlowBuilderLeftPanelHtml.
 *
 * API:
 *   FlowBuilderLeftPanel.render($container, flowDef, callbacks)
 *   callbacks: { onStageClick(stage, idx), onAddStage(event), onRunFlow(),
 *                onReorder(stageId, dir), onDuplicate(stageId) }
 *   FlowBuilderLeftPanel.collapseStage(stageId)
 *   FlowBuilderLeftPanel.expandStage(stageId)
 *   FlowBuilderLeftPanel.setActive(stageId)
 */
var FlowBuilderLeftPanel = (function () {
  'use strict';

  var _$container = null;
  var _flowDef    = null;
  var _callbacks  = null;
  var _expandedId = null;

  var _runSvg  = '<svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor"><polygon points="3,2 13,8 3,14"/></svg>';
  var _plusSvg = '<svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><line x1="10" y1="4" x2="10" y2="16"/><line x1="4" y1="10" x2="16" y2="10"/></svg>';

  function render($container, flowDef, callbacks) {
    _$container = $container;
    _flowDef    = flowDef;
    _callbacks  = callbacks || {};

    var stages      = flowDef.stages || [];
    var totalStages = stages.length;
    var stagesHtml  = stages.map(function (stage, idx) {
      return FlowBuilderLeftPanelHtml.renderItem(stage, idx, totalStages, _expandedId);
    }).join('');

    $container.html(
      '<div class="flow-left__header">' +
        '<button class="btn btn--primary btn--sm flow-run-btn" id="flp-run-flow">' + _runSvg + ' Run Flow</button>' +
      '</div>' +
      '<div class="flow-left__stages">' + stagesHtml + '</div>' +
      '<div class="flow-left__footer">' +
        '<button class="flow-add-stage-btn" id="flp-add-stage">' + _plusSvg + ' Add Stage</button>' +
      '</div>'
    );

    _bindEvents($container);
  }

  function _bindEvents($c) {
    $c.off('click.flp');

    /* Reorder: up/down arrow buttons */
    $c.on('click.flp', '.flow-stage-move-btn', function (e) {
      e.stopPropagation();
      var stageId = $(this).closest('.flow-left__stage-item').data('stageId');
      var dir     = $(this).data('dir');
      if (_callbacks.onReorder) _callbacks.onReorder(stageId, dir);
    });

    /* Opts button: toggle mini-menu */
    $c.on('click.flp', '.flow-stage-opts-btn', function (e) {
      e.stopPropagation();
      var $wrap = $(this).closest('.flow-stage-opts-wrap');
      $c.find('.flow-stage-mini-menu').not($wrap.find('.flow-stage-mini-menu')).hide();
      $wrap.find('.flow-stage-mini-menu').toggle();
    });

    /* Mini-menu: Duplicate */
    $c.on('click.flp', '.flow-stage-dup-item', function (e) {
      e.stopPropagation();
      var stageId = $(this).closest('.flow-left__stage-item').data('stageId');
      $(this).closest('.flow-stage-mini-menu').hide();
      if (_callbacks.onDuplicate) _callbacks.onDuplicate(stageId);
    });

    /* Close mini-menu on outside click */
    $(document).off('click.flp-menu').on('click.flp-menu', function () {
      $c.find('.flow-stage-mini-menu').hide();
    });

    $c.on('click.flp', '.flow-left__stage-header', function (e) {
      /* Ignore clicks from buttons inside the header */
      if ($(e.target).closest('.flow-stage-move-btn, .flow-stage-opts-wrap').length) return;

      var $item   = $(this).closest('.flow-left__stage-item');
      var stageId = $item.data('stageId');
      var idx     = parseInt($item.data('stageIdx'), 10);
      var stage   = _flowDef && _flowDef.stages && _flowDef.stages[idx];
      if (!stage) return;

      $c.find('.flow-left__stage-item').not($item).each(function () {
        $(this).find('.flow-left__stage-body').slideUp(150);
        $(this).removeClass('is-expanded');
      });

      if ($item.hasClass('is-expanded')) {
        $item.find('.flow-left__stage-body').slideUp(150);
        $item.removeClass('is-expanded');
        _expandedId = null;
      } else {
        $item.find('.flow-left__stage-body').slideDown(150);
        $item.addClass('is-expanded');
        _expandedId = stageId;
        if (_callbacks.onStageClick) _callbacks.onStageClick(stage, idx);
      }
    });

    $c.on('click.flp', '#flp-run-flow',  function () { if (_callbacks.onRunFlow)  _callbacks.onRunFlow(); });
    $c.on('click.flp', '#flp-add-stage', function (e) { if (_callbacks.onAddStage) _callbacks.onAddStage(e); });
  }

  /* Collapse a stage accordion item by id */
  function collapseStage(stageId) {
    if (!_$container) return;
    var $item = _$container.find('.flow-left__stage-item[data-stage-id="' + stageId + '"]');
    $item.find('.flow-left__stage-body').slideUp(150);
    $item.removeClass('is-expanded');
    if (_expandedId === stageId) _expandedId = null;
  }

  /* Expand a stage, collapsing all others */
  function expandStage(stageId) {
    if (!_$container) return;
    _$container.find('.flow-left__stage-item').not('[data-stage-id="' + stageId + '"]').each(function () {
      $(this).find('.flow-left__stage-body').slideUp(150);
      $(this).removeClass('is-expanded');
    });
    var $item = _$container.find('.flow-left__stage-item[data-stage-id="' + stageId + '"]');
    $item.find('.flow-left__stage-body').slideDown(150);
    $item.addClass('is-expanded');
    _expandedId = stageId;
  }

  /* Highlight active stage without re-render */
  function setActive(stageId) {
    if (!_$container) return;
    _$container.find('.flow-left__stage-item').removeClass('is-active');
    _$container.find('.flow-left__stage-item[data-stage-id="' + stageId + '"]').addClass('is-active');
  }

  function destroy() {
    $(document).off('click.flp-menu');
  }

  return { render: render, collapseStage: collapseStage, expandStage: expandStage, setActive: setActive, destroy: destroy };
}());

window.FlowBuilderLeftPanel = FlowBuilderLeftPanel;
