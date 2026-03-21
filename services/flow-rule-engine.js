/**
 * flow-rule-engine.js
 * Translates flow stage rule JSON into PipelineStages-compatible configs.
 * Provides schema inference, display text generation, validation, and execution.
 *
 * API:
 *   FlowRuleEngine.translateStage(flowStage) → {type, config}
 *   FlowRuleEngine.inferSchema(data) → {columns:[{name,type}]}
 *   FlowRuleEngine.generateDisplayText(flowStage) → string
 *   FlowRuleEngine.validateStage(flowStage, inputSchema) → {valid, errors[]}
 *   FlowRuleEngine.executeFlowStage(flowStage, inputData, store) → {data, schema, error}
 */

var FlowRuleEngine = (function () {
  'use strict';

  /* ── Schema inference ── */

  function inferSchema(data) {
    var sample = data ? data.slice(0, 100) : [];
    if (!sample.length) return { columns: [] };
    var keys = Object.keys(sample[0]);
    var columns = keys.map(function (k) {
      var type = 'string';
      for (var i = 0; i < sample.length; i++) {
        var v = sample[i][k];
        if (v !== null && v !== undefined && v !== '') {
          type = (typeof v === 'number' || (!isNaN(parseFloat(v)) && isFinite(v))) ? 'number' : 'string';
          break;
        }
      }
      return { name: k, type: type };
    });
    return { columns: columns };
  }

  /* ── Stage translation ── */

  function translateStage(flowStage) {
    var r = flowStage.rules || {};
    switch (flowStage.type) {
      case 'source':
        if (r.sourceIds && r.sourceIds.length > 1 && r.mergeType === 'JOIN') {
          return { type: 'merge', config: { datasetId: r.sourceIds[1], leftKey: r.mergeConfig && r.mergeConfig.leftKey, rightKey: r.mergeConfig && r.mergeConfig.rightKey, type: r.mergeConfig && r.mergeConfig.joinType || 'left' } };
        }
        return { type: 'source', config: { sourceId: r.sourceIds && r.sourceIds[0] } };
      case 'filter':
        return { type: 'filterRows', config: { logic: r.logic || 'AND', conditions: r.conditions || [] } };
      case 'select':
        return { type: 'removeColumns', config: { keep: r.keep || [] } };
      case 'aggregate':
        return { type: 'groupBy', config: { groupBy: r.groupBy || [], aggregates: r.aggregates || [] } };
      case 'sort':
        return { type: 'sort', config: { field: r.field, direction: r.direction || 'asc' } };
      case 'formula':
        return { type: 'addColumn', config: { columns: r.columns || [] } };
      case 'pivot':
        return { type: 'pivot', config: { rowKey: r.rowKey, pivotCol: r.pivotCol, valueCol: r.valueCol } };
      case 'unpivot':
        return { type: 'unpivot', config: { idCols: r.idCols || [], valueCols: r.valueCols || [], nameCol: r.nameCol || 'attribute', valueCol: r.valueCol || 'value' } };
      case 'limit':
        return { type: '_limit', config: { count: parseInt(r.count, 10) || 10 } };
      default:
        return { type: flowStage.type, config: r };
    }
  }

  /* ── Display text ── */

  function generateDisplayText(flowStage) {
    var r = flowStage.rules || {};
    switch (flowStage.type) {
      case 'source':
        var ids = r.sourceIds || [];
        var txt = ids.length ? ids.join(' + ') : 'No source';
        if (ids.length > 1 && r.mergeType) txt += ' (' + r.mergeType + ')';
        return txt;
      case 'filter':
        var conds = r.conditions || [];
        if (!conds.length) return 'Filter (no conditions)';
        return 'Filter: ' + conds.map(function (c) { return c.field + ' ' + c.operator + ' ' + c.value; }).join(' ' + (r.logic || 'AND') + ' ');
      case 'select':
        return 'Select: ' + (r.keep || []).join(', ') || 'Select (none)';
      case 'aggregate':
        return 'Aggregate by: ' + (r.groupBy || []).join(', ');
      case 'sort':
        return 'Sort: ' + (r.field || '—') + ' ' + (r.direction || 'asc');
      case 'limit':
        return 'Limit: ' + (r.count || 10) + ' rows';
      case 'formula':
        return 'Formula: ' + (r.columns || []).map(function (c) { return c.name; }).join(', ');
      case 'pivot':
        return 'Pivot: ' + (r.pivotCol || '—');
      case 'unpivot':
        return 'Unpivot: ' + (r.valueCols || []).join(', ');
      default:
        return flowStage.type;
    }
  }

  /* ── Validation ── */

  function validateStage(flowStage, inputSchema) {
    var r = flowStage.rules || {};
    var errors = [];
    var cols = (inputSchema && inputSchema.columns || []).map(function (c) { return c.name; });

    function requireField(val, msg) { if (!val) errors.push(msg); }
    function requireCols(fields, label) {
      (fields || []).forEach(function (f) {
        if (cols.length && cols.indexOf(f) === -1) errors.push(label + ': column "' + f + '" not in input');
      });
    }

    switch (flowStage.type) {
      case 'source':
        if (!r.sourceIds || !r.sourceIds.length) errors.push('At least one source required');
        break;
      case 'filter':
        (r.conditions || []).forEach(function (c, i) {
          if (!c.field) errors.push('Condition ' + (i + 1) + ': field required');
          if (!c.operator) errors.push('Condition ' + (i + 1) + ': operator required');
        });
        break;
      case 'select':
        if (!r.keep || !r.keep.length) errors.push('Select: at least one column required');
        break;
      case 'aggregate':
        if (!r.groupBy || !r.groupBy.length) errors.push('Aggregate: group-by field required');
        if (!r.aggregates || !r.aggregates.length) errors.push('Aggregate: at least one aggregate required');
        break;
      case 'sort':
        requireField(r.field, 'Sort: field required');
        break;
      case 'limit':
        if (!r.count || r.count < 1) errors.push('Limit: count must be >= 1');
        break;
      case 'formula':
        (r.columns || []).forEach(function (c, i) {
          if (!c.name) errors.push('Formula ' + (i + 1) + ': column name required');
          if (!c.formula) errors.push('Formula ' + (i + 1) + ': expression required');
        });
        break;
      case 'pivot':
        requireField(r.rowKey, 'Pivot: row key required');
        requireField(r.pivotCol, 'Pivot: pivot column required');
        requireField(r.valueCol, 'Pivot: value column required');
        break;
      case 'unpivot':
        if (!r.valueCols || !r.valueCols.length) errors.push('Unpivot: value columns required');
        break;
    }
    return { valid: errors.length === 0, errors: errors };
  }

  /* ── Execution ── */

  function executeFlowStage(flowStage, inputData, store) {
    try {
      var translated = translateStage(flowStage);
      var data = inputData || [];

      // Handle source: load from store
      if (flowStage.type === 'source') {
        var r = flowStage.rules || {};
        var ids = r.sourceIds || [];
        if (!ids.length) return { data: [], schema: { columns: [] }, error: null };
        data = (store && store.get(ids[0])) || [];
        // APPEND merge
        if (ids.length > 1 && r.mergeType === 'APPEND') {
          for (var i = 1; i < ids.length; i++) {
            var extra = (store && store.get(ids[i])) || [];
            data = data.concat(extra);
          }
          return { data: data, schema: inferSchema(data), error: null };
        }
        // JOIN merge via PipelineStages.merge
        if (ids.length > 1 && r.mergeType === 'JOIN') {
          var mc = r.mergeConfig || {};
          var merged = PipelineStages.merge(data, { datasetId: ids[1], leftKey: mc.leftKey, rightKey: mc.rightKey, type: mc.joinType || 'left' }, store);
          return { data: merged, schema: inferSchema(merged), error: null };
        }
        return { data: data, schema: inferSchema(data), error: null };
      }

      // Handle limit (custom — not in PipelineStages)
      if (flowStage.type === 'limit') {
        var count = parseInt((flowStage.rules || {}).count, 10) || 10;
        var limited = data.slice(0, count);
        return { data: limited, schema: inferSchema(limited), error: null };
      }

      var fn = PipelineStages[translated.type];
      if (typeof fn !== 'function') return { data: data, schema: inferSchema(data), error: 'Unknown type: ' + translated.type };

      var result = fn(data, translated.config, store);
      var out = Array.isArray(result) ? result : data;
      return { data: out, schema: inferSchema(out), error: null };
    } catch (e) {
      return { data: [], schema: { columns: [] }, error: e.message };
    }
  }

  return {
    inferSchema:         inferSchema,
    translateStage:      translateStage,
    generateDisplayText: generateDisplayText,
    validateStage:       validateStage,
    executeFlowStage:    executeFlowStage
  };
}());

window.FlowRuleEngine = FlowRuleEngine;
