/**
 * pipeline-engine.js
 * Orchestrates sequential execution of pipeline stages.
 * Uses PipelineStages for each stage type and DatasetStore for data I/O.
 *
 * Usage:
 *   var result = PipelineEngine.run(pipelineConfig);
 *   // result: { output: [...], log: [{stageId, type, inputRows, outputRows, durationMs}] }
 *
 *   PipelineEngine.runAll() — runs all pipelines registered in DatasetStore.
 */

var PipelineEngine = (function () {
  'use strict';

  /**
   * Run a single pipeline stage.
   * @param {Array}  data   - input data rows
   * @param {Object} stage  - { id, type, config }
   * @param {Object} store  - DatasetStore reference
   * @returns {{ data: Array, error: string|null }}
   */
  function runStage(data, stage, store) {
    var type = stage.type;
    var config = stage.config || {};
    var fn = PipelineStages[type];

    if (typeof fn !== 'function') {
      return { data: data, error: 'Unknown stage type: ' + type };
    }

    try {
      var result = fn(data, config, store);
      return { data: Array.isArray(result) ? result : data, error: null };
    } catch (e) {
      return { data: data, error: e.message };
    }
  }

  /**
   * Run an entire pipeline config sequentially.
   * Fires a 'pipeline:output-updated' event on document when complete.
   *
   * @param {Object} pipelineConfig - full pipeline config object with stages[]
   * @returns {{ output: Array, log: Array, error: string|null }}
   */
  function run(pipelineConfig) {
    var store  = window.DatasetStore;
    var stages = pipelineConfig.stages || [];
    var data   = [];
    var log    = [];
    var pipelineError = null;

    var startTime = Date.now();

    for (var i = 0; i < stages.length; i++) {
      var stage = stages[i];
      var stageStart = Date.now();
      var inputRows  = data.length;

      var result = runStage(data, stage, store);
      data = result.data;

      var entry = {
        stageId:    stage.id || ('s' + (i + 1)),
        type:       stage.type,
        inputRows:  inputRows,
        outputRows: data.length,
        durationMs: Date.now() - stageStart,
        error:      result.error || null
      };
      log.push(entry);

      if (result.error) {
        pipelineError = 'Stage ' + entry.stageId + ' (' + entry.type + '): ' + result.error;
        break;
      }
    }

    // Store run history in DatasetStore pipeline metadata
    if (store && typeof store.appendRunLog === 'function') {
      store.appendRunLog(pipelineConfig.id, {
        id:         'run-' + Date.now(),
        timestamp:  new Date().toISOString(),
        status:     pipelineError ? 'error' : 'success',
        duration:   Date.now() - startTime,
        inputRows:  log.length ? log[0].inputRows : 0,
        outputRows: data.length,
        error:      pipelineError
      });
    }

    // Notify dashboard widgets to refresh.
    // outputId follows the '<pipelineId>-out' convention; always included so
    // listeners have a single stable field to match against widget datasetId.
    if (!pipelineError) {
      $(document).trigger('pipeline:output-updated', {
        pipelineId: pipelineConfig.id,
        outputId:   pipelineConfig.id + '-out',
        outputData: data
      });
    }

    return { output: data, log: log, error: pipelineError };
  }

  /**
   * Run all registered pipelines in DatasetStore.
   * Logs results to console. Used during app init.
   */
  function runAll() {
    var store = window.DatasetStore;
    if (!store) return;
    var pipelines = store.getPipelines();
    pipelines.forEach(function (p) {
      try {
        var r = run(p);
        if (r.error) {
          console.warn('[PipelineEngine] Pipeline "' + p.id + '" error:', r.error);
        } else {
          console.log('[PipelineEngine] Pipeline "' + p.id + '" OK — ' + r.output.length + ' rows');
        }
      } catch (e) {
        console.error('[PipelineEngine] Fatal error in pipeline "' + p.id + '":', e);
      }
    });
  }

  /**
   * Run a flow definition (array of flow stages) sequentially.
   * Each stage is executed via FlowRuleEngine.executeFlowStage().
   * Fires 'pipeline:output-updated' on document when complete.
   *
   * @param {Object} flowDef - { pipelineId, stages: [...] }
   * @returns {{ output: Array, log: Array, error: string|null }}
   */
  function runFlow(flowDef) {
    var engine = window.FlowRuleEngine;
    if (!engine) return { output: [], log: [], error: 'FlowRuleEngine not loaded' };

    var store = window.DatasetStore;
    var stages = flowDef.stages || [];
    var data = [];
    var log = [];
    var flowError = null;

    for (var i = 0; i < stages.length; i++) {
      var stage = stages[i];
      var t0 = Date.now();
      var result = engine.executeFlowStage(stage, data, store);
      log.push({ stageId: stage.id, type: stage.type, inputRows: data.length, outputRows: (result.data || []).length, durationMs: Date.now() - t0, error: result.error || null });
      if (result.error) { flowError = 'Stage ' + stage.id + ': ' + result.error; break; }
      data = result.data || [];
    }

    if (!flowError) {
      $(document).trigger('pipeline:output-updated', { pipelineId: flowDef.pipelineId, outputId: flowDef.pipelineId + '-flow-out', outputData: data });
    }
    return { output: data, log: log, error: flowError };
  }

  return { run: run, runStage: runStage, runAll: runAll, runFlow: runFlow };
}());

window.PipelineEngine = PipelineEngine;
