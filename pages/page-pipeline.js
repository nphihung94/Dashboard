/**
 * page-pipeline.js
 * Pipeline page controller: 3 tabs (Flow / Configuration / Run Log).
 * Wires PipelineFlow, PipelineConfig, PipelineRunLog, StageTypePicker,
 * StageConfigPanel components together.
 *
 * API:
 *   PagePipeline.render($container, pipelineId)
 *   PagePipeline.destroy()
 */

var PagePipeline = (function () {
  'use strict';

  var _currentPipeline = null;
  var _activeTab = 'flow';

  var _statusColors = { healthy: '#4CAF50', warning: '#FF9800', error: '#F44336' };

  var _runSvg = '<svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor"><polygon points="3,2 13,8 3,14"/></svg>';

  function render($container, pipelineId) {
    _activeTab = 'flow';

    if (!pipelineId || !window.DatasetStore) {
      $container.html('<div class="empty-state"><div class="empty-state__title">Pipeline not found</div></div>');
      return;
    }

    var pipeline = DatasetStore.getPipeline(pipelineId);
    if (!pipeline) {
      $container.html('<div class="empty-state"><div class="empty-state__title">Pipeline "' + pipelineId + '" not found</div></div>');
      return;
    }

    _currentPipeline = pipeline;
    var dotColor = _statusColors[pipeline.status] || _statusColors.healthy;

    $container.html(
      /* Page header */
      '<div class="page-header">' +
        '<div class="page-header__breadcrumb">' +
          '<a href="#home">Home</a> › Pipelines › ' + _esc(pipeline.type || '') +
        '</div>' +
        '<div class="page-header__title">' + _esc(pipeline.name) + '</div>' +
        '<span style="display:inline-flex;align-items:center;gap:5px;padding:2px 8px;border-radius:10px;' +
          'background:rgba(0,0,0,0.04);font-size:11px;color:#5B5B5B">' +
          '<span style="width:7px;height:7px;border-radius:50%;background:' + dotColor + ';display:inline-block"></span>' +
          (pipeline.status || 'healthy') +
        '</span>' +
        '<div class="page-header__spacer"></div>' +
        '<button class="btn btn--primary" id="btn-run-pipeline">' + _runSvg + ' Run Pipeline</button>' +
      '</div>' +

      /* Tab bar */
      '<div class="pipeline-tab-bar">' +
        '<button class="pipeline-tab is-active" data-tab="flow">Flow</button>' +
        '<button class="pipeline-tab" data-tab="dataflow">Data Flow</button>' +
        '<button class="pipeline-tab" data-tab="config">Configuration</button>' +
        '<button class="pipeline-tab" data-tab="runlog">Run Log</button>' +
      '</div>' +

      /* Tab content containers */
      '<div class="pipeline-tab-content is-active" id="tab-flow"></div>' +
      '<div class="pipeline-tab-content" id="tab-dataflow"></div>' +
      '<div class="pipeline-tab-content" id="tab-config"></div>' +
      '<div class="pipeline-tab-content" id="tab-runlog"></div>'
    );

    _renderActiveTab($container, pipeline);
    _bindEvents($container, pipeline);
  }

  function _renderActiveTab($container, pipeline) {
    var $flow     = $container.find('#tab-flow');
    var $dataflow = $container.find('#tab-dataflow');
    var $config   = $container.find('#tab-config');
    var $runlog   = $container.find('#tab-runlog');

    if (_activeTab === 'flow') {
      PipelineFlow.render($flow, pipeline, {
        onStageSelect: function (stageId) { _openStageConfig(stageId, pipeline); },
        onAddStage:    function () { _addStage($container, pipeline); }
      });
    } else if (_activeTab === 'dataflow') {
      if (window.FlowBuilderShell) {
        FlowBuilderShell.render($dataflow, pipeline, {});
      } else {
        $dataflow.html('<div class="empty-state"><div class="empty-state__title">FlowBuilderShell not loaded</div></div>');
      }
    } else if (_activeTab === 'config') {
      PipelineConfig.render($config, pipeline, {
        onSave:   function (updated) { _currentPipeline = updated; },
        onDelete: function () { destroy(); }
      });
    } else if (_activeTab === 'runlog') {
      var runs = window.DatasetStore ? DatasetStore.getRunLog(pipeline.id) : [];
      PipelineRunLog.render($runlog, runs);
    }
  }

  function _bindEvents($container, pipeline) {
    /* Tab switching */
    $container.on('click', '.pipeline-tab', function () {
      var tab = $(this).data('tab');
      _activeTab = tab;

      $container.find('.pipeline-tab').removeClass('is-active');
      $(this).addClass('is-active');

      $container.find('.pipeline-tab-content').removeClass('is-active');
      $container.find('#tab-' + tab).addClass('is-active');

      _renderActiveTab($container, _currentPipeline);
    });

    /* Run Pipeline button */
    $container.on('click', '#btn-run-pipeline', function () {
      _runPipeline($container);
    });
  }

  function _runPipeline($container) {
    var $btn = $container.find('#btn-run-pipeline');
    $btn.prop('disabled', true).text('Running…');

    // PipelineEngine.run() is synchronous — no setTimeout needed.
    // Removed 50ms fake-async wrapper that created a mutation window where
    // _currentPipeline could be modified before the run completed.
    try {
      var result = PipelineEngine.run(_currentPipeline);
      if (result.error) {
        if (window.Toast) Toast.error('Pipeline error: ' + result.error);
      } else {
        if (window.Toast) Toast.success('Pipeline ran — ' + result.output.length + ' rows');
        /* Refresh flow tab output preview if active */
        if (_activeTab === 'flow') {
          var $flow = $container.find('#tab-flow');
          PipelineFlow.render($flow, _currentPipeline, {
            onStageSelect: function (stageId) { _openStageConfig(stageId, _currentPipeline); },
            onAddStage:    function () { _addStage($container, _currentPipeline); }
          });
        }
      }
    } catch (e) {
      if (window.Toast) Toast.error('Pipeline failed: ' + e.message);
      console.error('[PagePipeline] run error:', e);
    } finally {
      $btn.prop('disabled', false).html(_runSvg + ' Run Pipeline');
    }
  }

  function _openStageConfig(stageId, pipeline) {
    var stage = (pipeline.stages || []).filter(function (s) { return s.id === stageId; })[0];
    if (!stage) return;
    StageConfigPanel.open(stage, pipeline, function (updatedStage) {
      // stage is mutated in place by StageConfigPanel; re-render flow
      var $container = $('#page-pipeline');
      var $flow = $container.find('#tab-flow');
      if ($flow.is(':visible')) {
        PipelineFlow.render($flow, pipeline, {
          onStageSelect: function (id) { _openStageConfig(id, pipeline); },
          onAddStage:    function () { _addStage($container, pipeline); }
        });
      }
    });
  }

  function _addStage($container, pipeline) {
    var $btn = $container.find('#btn-add-stage');
    StageTypePicker.show($btn[0] || document.body, function (type) {
      var newStage = {
        id:     's' + (Date.now() % 10000),
        type:   type,
        config: {}
      };
      pipeline.stages = pipeline.stages || [];
      pipeline.stages.push(newStage);
      if (window.DatasetStore) DatasetStore.savePipeline(pipeline);
      /* Re-render flow */
      var $flow = $container.find('#tab-flow');
      PipelineFlow.render($flow, pipeline, {
        onStageSelect: function (id) { _openStageConfig(id, pipeline); },
        onAddStage:    function () { _addStage($container, pipeline); }
      });
      if (window.Toast) Toast.success('Stage added: ' + type);
    });
  }

  function destroy() {
    StageConfigPanel.close();
    if (window.FlowBuilderShell) FlowBuilderShell.destroy();
    _currentPipeline = null;
  }

  function _esc(str) {
    return $('<span>').text(String(str || '')).html();
  }

  return { render: render, destroy: destroy };
}());

window.PagePipeline = PagePipeline;
