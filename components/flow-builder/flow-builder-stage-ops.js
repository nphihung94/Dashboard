/**
 * flow-builder-stage-ops.js
 * Stage management helpers for FlowBuilderShell:
 * add, remove, reorder, invalidate downstream, persist.
 * Loaded before flow-builder-shell.js.
 *
 * API (consumed internally by FlowBuilderShell):
 *   FlowBuilderStageOps.addStage(flowDef, type, typeLabel)
 *   FlowBuilderStageOps.removeStage(flowDef, stageId)
 *   FlowBuilderStageOps.invalidateDownstream(flowDef, changedStage)
 *   FlowBuilderStageOps.saveFlow(flowDef)
 *   FlowBuilderStageOps.runFlow($container, flowDef, runSvg)
 */

var FlowBuilderStageOps = (function () {
  'use strict';

  function addStage(flowDef, type, typeLabel) {
    var stages = flowDef.stages;
    var prevId = stages.length ? stages[stages.length - 1].id : null;
    stages.push({
      id: 'fs' + Date.now(),
      type: type,
      rules: {},
      displayText: (typeLabel && typeLabel[type]) || type,
      inputRef: prevId,
      outputSchema: null,
      status: 'draft',
      error: null
    });
  }

  function removeStage(flowDef, stageId) {
    var stages = flowDef.stages;
    var idx = -1;
    for (var i = 0; i < stages.length; i++) {
      if (stages[i].id === stageId) { idx = i; break; }
    }
    if (idx < 1) return; // source (idx 0) cannot be removed
    stages.splice(idx, 1);
    for (var j = idx; j < stages.length; j++) {
      stages[j].inputRef = j > 0 ? stages[j - 1].id : null;
    }
  }

  function invalidateDownstream(flowDef, changedStage) {
    var stages = flowDef.stages;
    var found = false;
    for (var i = 0; i < stages.length; i++) {
      if (found) { stages[i].status = 'draft'; stages[i].outputSchema = null; }
      if (stages[i].id === changedStage.id) found = true;
    }
  }

  function saveFlow(flowDef) {
    if (window.DatasetStore) DatasetStore.saveFlowDef(flowDef);
  }

  function runFlow($container, flowDef, runSvg) {
    var $btn = $container.find('#fbs-run-flow');
    $btn.prop('disabled', true).text('Running\u2026');
    try {
      var result = window.PipelineEngine
        ? PipelineEngine.runFlow(flowDef)
        : { output: [], log: [], error: 'PipelineEngine not loaded' };
      if (result.error) {
        if (window.Toast) Toast.error('Flow error: ' + result.error);
      } else {
        if (window.Toast) Toast.success('Flow ran \u2014 ' + result.output.length + ' rows');
      }
    } catch (e) {
      if (window.Toast) Toast.error('Flow failed: ' + e.message);
    } finally {
      $btn.prop('disabled', false).html(runSvg + ' Run Flow');
    }
  }

  /* ── Reorder helpers ── */

  /** Rebuild inputRef chain: stages[i].inputRef = stages[i-1].id. Source gets null. */
  function _rebuildInputRefs(flowDef) {
    var stages = flowDef.stages;
    if (stages.length > 0) stages[0].inputRef = null;
    for (var i = 1; i < stages.length; i++) {
      stages[i].inputRef = stages[i - 1].id;
    }
  }

  /** Reset status/output for stages from fromIdx onward. */
  function _invalidateFrom(flowDef, fromIdx) {
    var stages = flowDef.stages;
    for (var i = fromIdx; i < stages.length; i++) {
      stages[i].status = 'draft';
      stages[i].outputSchema = null;
      stages[i]._lastExecData = null;
      stages[i].error = null;
    }
  }

  /**
   * Move stage up or down. Source (idx 0) is pinned — cannot move or be displaced.
   * Returns true if swap occurred.
   */
  function reorderStage(flowDef, stageId, direction) {
    var stages = flowDef.stages;
    var idx = -1;
    for (var i = 0; i < stages.length; i++) {
      if (stages[i].id === stageId) { idx = i; break; }
    }
    if (idx < 1) return false; // source (0) cannot move
    var targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 1 || targetIdx >= stages.length) return false;
    var tmp = stages[idx]; stages[idx] = stages[targetIdx]; stages[targetIdx] = tmp;
    _rebuildInputRefs(flowDef);
    _invalidateFrom(flowDef, Math.min(idx, targetIdx));
    return true;
  }

  /**
   * Deep-copy a non-source stage and insert it immediately after the original.
   * Returns the new stage object or null if stageId is source.
   */
  function duplicateStage(flowDef, stageId) {
    var stages = flowDef.stages;
    var idx = -1;
    for (var i = 0; i < stages.length; i++) {
      if (stages[i].id === stageId) { idx = i; break; }
    }
    if (idx < 1) return null; // cannot duplicate source
    var src = stages[idx];
    var dup = {
      id: 'fs' + Date.now() + Math.floor(Math.random() * 1000),
      type: src.type,
      rules: JSON.parse(JSON.stringify(src.rules || {})),
      displayText: (src.displayText || src.type) + ' (copy)',
      inputRef: null,
      outputSchema: null,
      status: 'draft',
      _lastExecData: null,
      error: null
    };
    stages.splice(idx + 1, 0, dup);
    _rebuildInputRefs(flowDef);
    _invalidateFrom(flowDef, idx + 1);
    return dup;
  }

  return {
    addStage: addStage, removeStage: removeStage,
    invalidateDownstream: invalidateDownstream,
    saveFlow: saveFlow, runFlow: runFlow,
    reorderStage: reorderStage, duplicateStage: duplicateStage
  };
}());

window.FlowBuilderStageOps = FlowBuilderStageOps;
