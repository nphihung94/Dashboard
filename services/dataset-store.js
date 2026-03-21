/**
 * dataset-store.js
 * Singleton registry for raw data sources, pipeline outputs, and pipeline configs.
 * Persists pipeline configs and run logs to localStorage.
 *
 * API:
 *   DatasetStore.init()
 *   DatasetStore.registerSource(id, data, metadata?)
 *   DatasetStore.registerOutput(id, data, metadata?)
 *   DatasetStore.get(id) → Array
 *   DatasetStore.list() → [{id, type, rows, cols, sourcePipeline, updatedAt}]
 *   DatasetStore.getPipelines() → Array of pipeline configs
 *   DatasetStore.savePipeline(config)
 *   DatasetStore.deletePipeline(id)
 *   DatasetStore.appendRunLog(pipelineId, entry)
 *   DatasetStore.getRunLog(pipelineId) → Array
 */

var DatasetStore = (function () {
  'use strict';

  var LS_KEY_PIPELINES = 'vibe-dashboard-pipelines';
  var LS_KEY_RUNLOGS   = 'vibe-dashboard-runlogs';
  var LS_KEY_FLOWS     = 'vibe-dashboard-flows';

  // In-memory flow definitions
  var _flows = {};

  // In-memory registries
  var _sources   = {};  // id → { data: [], meta: {} }
  var _outputs   = {};  // id → { data: [], meta: {} }
  var _pipelines = {};  // id → pipeline config
  var _runLogs   = {};  // pipelineId → [run entries]

  /* ── localStorage helpers ── */

  function _lsGet(key) {
    try {
      var raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  }

  function _lsSet(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) {
      console.warn('[DatasetStore] localStorage write failed:', e);
    }
  }

  /* ── Init ── */

  /**
   * Load persisted pipeline configs and run logs from localStorage.
   * Call once on app startup before registering demo data.
   */
  function init() {
    var saved = _lsGet(LS_KEY_PIPELINES);
    if (saved && typeof saved === 'object') {
      Object.keys(saved).forEach(function (id) {
        _pipelines[id] = saved[id];
      });
    }
    var logs = _lsGet(LS_KEY_RUNLOGS);
    if (logs && typeof logs === 'object') {
      Object.keys(logs).forEach(function (id) {
        _runLogs[id] = logs[id];
      });
    }
    var flows = _lsGet(LS_KEY_FLOWS);
    if (flows && typeof flows === 'object') {
      Object.keys(flows).forEach(function (id) {
        _flows[id] = flows[id];
      });
    }
  }

  /* ── Source / Output registration ── */

  function registerSource(id, data, metadata) {
    _sources[id] = {
      data: Array.isArray(data) ? data : [],
      meta: Object.assign({ id: id, type: 'source', updatedAt: Date.now() }, metadata || {})
    };
  }

  function registerOutput(id, data, metadata) {
    _outputs[id] = {
      data: Array.isArray(data) ? data : [],
      meta: Object.assign({ id: id, type: 'output', updatedAt: Date.now() }, metadata || {})
    };
  }

  function registerIntegration(id, config, metadata) {
    _sources[id] = {
      data: [],
      meta: Object.assign({ id: id, type: 'integration', updatedAt: Date.now() }, metadata || {}, { integrationConfig: config })
    };
  }

  /* ── Data retrieval ── */

  function get(id) {
    if (_outputs[id]) return _outputs[id].data;
    if (_sources[id]) return _sources[id].data;
    return null;
  }

  /**
   * List all datasets (sources + outputs) with summary metadata.
   * @returns {Array<{id, name, type, rows, cols, sourcePipeline, updatedAt, status}>}
   */
  function list() {
    var result = [];

    Object.keys(_sources).forEach(function (id) {
      var entry = _sources[id];
      var data  = entry.data;
      result.push(Object.assign({
        id:             id,
        name:           id,
        type:           'source',
        rows:           data.length,
        cols:           data.length ? Object.keys(data[0]).length : 0,
        sourcePipeline: null,
        updatedAt:      entry.meta.updatedAt || null,
        status:         'ready'
      }, entry.meta));
    });

    Object.keys(_outputs).forEach(function (id) {
      var entry = _outputs[id];
      var data  = entry.data;
      result.push(Object.assign({
        id:             id,
        name:           id,
        type:           'output',
        rows:           data.length,
        cols:           data.length ? Object.keys(data[0]).length : 0,
        sourcePipeline: entry.meta.sourcePipeline || null,
        updatedAt:      entry.meta.updatedAt || null,
        status:         'ready'
      }, entry.meta));
    });

    return result;
  }

  /* ── Pipeline CRUD ── */

  function getPipelines() {
    return Object.keys(_pipelines).map(function (id) { return _pipelines[id]; });
  }

  function savePipeline(config) {
    if (!config || !config.id) return;
    _pipelines[config.id] = config;
    _lsSet(LS_KEY_PIPELINES, _pipelines);
  }

  function deletePipeline(id) {
    delete _pipelines[id];
    _lsSet(LS_KEY_PIPELINES, _pipelines);
  }

  function getPipeline(id) {
    return _pipelines[id] || null;
  }

  /* ── Run log ── */

  function appendRunLog(pipelineId, entry) {
    if (!pipelineId) return;
    if (!_runLogs[pipelineId]) _runLogs[pipelineId] = [];
    _runLogs[pipelineId].unshift(entry);  // newest first
    // Keep last 50 entries per pipeline
    if (_runLogs[pipelineId].length > 50) _runLogs[pipelineId].length = 50;
    _lsSet(LS_KEY_RUNLOGS, _runLogs);
  }

  function getRunLog(pipelineId) {
    return _runLogs[pipelineId] || [];
  }

  /* ── Column schema helper ── */

  function getColumns(id) {
    var data = get(id);
    if (!data || !data.length) return [];
    return Object.keys(data[0]);
  }

  /* ── Flow definition persistence ── */

  function saveFlowDef(flowDef) {
    if (!flowDef || !flowDef.pipelineId) return;
    _flows[flowDef.pipelineId] = flowDef;
    _lsSet(LS_KEY_FLOWS, _flows);
  }

  function getFlowDef(pipelineId) {
    return _flows[pipelineId] || null;
  }

  function deleteFlowDef(pipelineId) {
    delete _flows[pipelineId];
    _lsSet(LS_KEY_FLOWS, _flows);
  }

  return {
    init:                init,
    registerSource:      registerSource,
    registerOutput:      registerOutput,
    registerIntegration: registerIntegration,
    get:              get,
    list:             list,
    getColumns:       getColumns,
    getPipelines:     getPipelines,
    getPipeline:      getPipeline,
    savePipeline:     savePipeline,
    deletePipeline:   deletePipeline,
    appendRunLog:     appendRunLog,
    getRunLog:        getRunLog,
    saveFlowDef:      saveFlowDef,
    getFlowDef:       getFlowDef,
    deleteFlowDef:    deleteFlowDef
  };
}());

window.DatasetStore = DatasetStore;
