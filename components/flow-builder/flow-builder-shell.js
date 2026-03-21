/** flow-builder-shell.js — top-level 2-column shell for the Data Flow Builder. */
var FlowBuilderShell = (function () {
  'use strict';

  var _runSvg = '<svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor"><polygon points="3,2 13,8 3,14"/></svg>';
  var _$container = null; /* stored on render so destroy() can access it */
  var _typeLabel = {
    source: 'Source', filter: 'Filter', select: 'Select', aggregate: 'Aggregate',
    sort: 'Sort', limit: 'Limit', formula: 'Formula', pivot: 'Pivot', unpivot: 'Unpivot'
  };
  /* Empty-state guide shown when all stages are still in draft */
  var _EMPTY_GUIDE =
    '<div class="flow-empty-guide">' +
      '<p class="flow-empty-guide__step">\u2460 Select a dataset in the Source stage on the left</p>' +
      '<p class="flow-empty-guide__step">\u2461 Save the source to start your pipeline</p>' +
      '<p class="flow-empty-guide__step">\u2462 Add transform stages to shape your data</p>' +
    '</div>';
  var _EMPTY_STATE = '<div class="flow-empty-state">Click a stage in the left panel to configure it.</div>';

  function render($container, pipeline, callbacks) {
    _$container = $container;
    callbacks   = callbacks || {};
    var store   = window.DatasetStore;
    var flowDef = store ? store.getFlowDef(pipeline.id) : null;
    if (!flowDef) {
      flowDef = { id: 'flow-' + pipeline.id, pipelineId: pipeline.id, stages: [
        { id: 'fs1', type: 'source', rules: { sourceIds: [], mergeType: null, mergeConfig: {} },
          displayText: 'Source', inputRef: null, outputSchema: null, status: 'draft' }
      ]};
    }

    var hasSaved = flowDef.stages.some(function (s) { return s.status === 'saved'; });
    var initialContent = hasSaved ? _EMPTY_STATE : _EMPTY_GUIDE;

    $container.html(
      '<div class="flow-builder" tabindex="0">' +
        '<div class="flow-builder__left" id="fbs-left"></div>' +
        '<div class="flow-builder__right" id="fbs-right">' +
          '<div class="flow-config-panel">' +
            '<div class="flow-config-header" id="fbs-config-header">' +
              '<span class="flow-config-title" id="fbs-config-title">Select a stage to configure</span>' +
              '<div class="flow-config-header__actions">' +
                '<button class="btn btn--ghost btn--sm flow-expand-btn" id="fbs-expand">&#x26F6; Expand</button>' +
              '</div>' +
            '</div>' +
            '<div class="fbs-panel-host" id="fbs-panel-host">' +
              initialContent +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>'
    );

    _renderLeft($container, flowDef, pipeline, callbacks);
    _bindShellEvents($container, flowDef, pipeline, callbacks);
  }

  /* ── Left panel ── */

  function _renderLeft($container, flowDef, pipeline, callbacks) {
    FlowBuilderLeftPanel.render($container.find('#fbs-left'), flowDef, {
      onStageClick: function (stage, idx) { _loadConfig($container, stage, flowDef, pipeline, callbacks); },
      onAddStage:   function (e) {
        FlowBuilderOverlays.showContextMenu($container, e, function (type) {
          FlowBuilderStageOps.addStage(flowDef, type, _typeLabel);
          FlowBuilderStageOps.saveFlow(flowDef);
          _renderLeft($container, flowDef, pipeline, callbacks);
        });
      },
      onRunFlow: function () { FlowBuilderStageOps.runFlow($container, flowDef, _runSvg); },
      onReorder: function (stageId, dir) {
        if (FlowBuilderStageOps.reorderStage(flowDef, stageId, dir)) {
          FlowBuilderStageOps.saveFlow(flowDef);
          _renderLeft($container, flowDef, pipeline, callbacks);
        }
      },
      onDuplicate: function (stageId) {
        var newStage = FlowBuilderStageOps.duplicateStage(flowDef, stageId);
        if (newStage) {
          FlowBuilderStageOps.saveFlow(flowDef);
          _renderLeft($container, flowDef, pipeline, callbacks);
          if (window.Toast) Toast.success('Stage duplicated');
        }
      }
    });
  }

  /* ── Config panel loading ── */

  function _loadConfig($container, stage, flowDef, pipeline, callbacks) {
    var stageIdx = flowDef.stages.indexOf(stage) + 1;
    var stageTotal = flowDef.stages.length;
    var stageLabel = (_typeLabel[stage.type] || stage.type) + ' Stage';
    $container.find('#fbs-config-title').text('Step ' + stageIdx + ' of ' + stageTotal + ' \u2014 ' + stageLabel);

    /* Delete + Duplicate buttons (non-source only) */
    var $actions = $container.find('.flow-config-header__actions');
    $actions.find('.fbs-delete-stage, .fbs-duplicate-stage').remove();
    if (stage.type !== 'source') {
      $actions.prepend(
        '<button class="btn btn--ghost btn--sm fbs-duplicate-stage" data-stage-id="' + _esc(stage.id) + '">Duplicate</button>' +
        '<button class="btn btn--danger btn--sm fbs-delete-stage" data-stage-id="' + _esc(stage.id) + '">Delete</button>'
      );
    }

    var panelCbs = {
      onSave: function (updatedStage) {
        FlowBuilderStageOps.invalidateDownstream(flowDef, updatedStage);
        FlowBuilderStageOps.saveFlow(flowDef);
        _renderLeft($container, flowDef, pipeline, callbacks);
        FlowBuilderLeftPanel.collapseStage(updatedStage.id);
        FlowBuilderLeftPanel.setActive(updatedStage.id);
        if (window.Toast) Toast.success('Stage saved');
      },
      onEdit: function (updatedStage) {
        FlowBuilderStageOps.invalidateDownstream(flowDef, updatedStage);
        FlowBuilderStageOps.saveFlow(flowDef);
      }
    };

    var $host = $container.find('#fbs-panel-host');
    if (stage.type === 'source') {
      SourceStagePanel.render($host, stage, flowDef, panelCbs);
    } else {
      TransformStagePanel.render($host, stage, flowDef, panelCbs);
    }
    FlowBuilderLeftPanel.setActive(stage.id);
  }

  /* ── Shell events ── */

  function _bindShellEvents($container, flowDef, pipeline, callbacks) {
    $container.off('click.fbs');

    /* Expand / collapse toggle */
    $container.on('click.fbs', '#fbs-expand', function () {
      var $fb = $container.find('.flow-builder');
      var expanded = $fb.hasClass('is-expanded');
      $fb.toggleClass('is-expanded', !expanded);
      $(this).html(expanded ? '&#x26F6; Expand' : '&#8592; Collapse');
    });

    /* Duplicate stage (from config header) */
    $container.on('click.fbs', '.fbs-duplicate-stage', function () {
      var newStage = FlowBuilderStageOps.duplicateStage(flowDef, $(this).data('stageId'));
      if (newStage) {
        FlowBuilderStageOps.saveFlow(flowDef);
        _renderLeft($container, flowDef, pipeline, callbacks);
        if (window.Toast) Toast.success('Stage duplicated');
      }
    });

    /* Delete stage */
    $container.on('click.fbs', '.fbs-delete-stage', function () {
      if (!confirm('Delete this stage?')) return;
      FlowBuilderStageOps.removeStage(flowDef, $(this).data('stageId'));
      FlowBuilderStageOps.saveFlow(flowDef);
      _renderLeft($container, flowDef, pipeline, callbacks);
      $container.find('#fbs-panel-host').html('<div class="flow-empty-state">Click a stage to configure it.</div>');
      $container.find('#fbs-config-title').text('Select a stage to configure');
      $container.find('.fbs-delete-stage').remove();
    });

    /* Review Output drawer + close */
    $container.on('click.fbs', '.flow-review-btn', function () {
      var stage = _findStage(flowDef, $(this).data('stageId'));
      if (stage) FlowBuilderOverlays.openDrawer($container, stage);
    });
    $container.on('click.fbs', '.flow-preview-drawer__close', function () { FlowBuilderOverlays.closeDrawer($container); });
    $(document).off('keydown.fbsescape').on('keydown.fbsescape', function (e) {
      if (e.key === 'Escape') { FlowBuilderOverlays.closeDrawer($container); FlowBuilderOverlays.dismissContextMenu(); }
    });
    FlowBuilderOverlays.bindKeyboard($container);
  }

  function _findStage(flowDef, stageId) {
    if (!flowDef || !flowDef.stages) return null;
    for (var i = 0; i < flowDef.stages.length; i++) {
      if (flowDef.stages[i].id === stageId) return flowDef.stages[i];
    }
    return null;
  }

  function destroy() {
    $(document).off('keydown.fbsescape');
    $(document).off('mousedown.flowctx');
    if (_$container) FlowBuilderOverlays.unbindKeyboard(_$container);
    FlowBuilderOverlays.dismissContextMenu();
    FlowBuilderLeftPanel.destroy();
  }

  function _esc(str) { return $('<span>').text(String(str == null ? '' : str)).html(); }

  return { render: render, destroy: destroy };
}());

window.FlowBuilderShell = FlowBuilderShell;
