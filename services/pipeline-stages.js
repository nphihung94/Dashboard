/**
 * pipeline-stages.js
 * Stage processor functions for PipelineEngine.
 * Each function takes (data, config, store?) and returns a transformed array.
 * Pure functions — no side effects except 'output' which writes to store.
 *
 * Stage types: source, removeColumns, filterRows, replaceValues,
 *              groupBy, addColumn, sort, merge, pivot, unpivot, output
 */

var PipelineStages = (function () {
  'use strict';

  /* ── Helpers ── */

  function _coerce(val) {
    var n = parseFloat(val);
    return isNaN(n) ? String(val || '') : n;
  }

  function _matchCondition(row, cond) {
    var rowVal = _coerce(row[cond.field]);
    var cmpVal = _coerce(cond.value);
    switch (cond.operator) {
      case '=':  case 'eq':       return rowVal === cmpVal;
      case '!=': case 'neq':      return rowVal !== cmpVal;
      case '>':  case 'gt':       return rowVal > cmpVal;
      case '<':  case 'lt':       return rowVal < cmpVal;
      case '>=': case 'gte':      return rowVal >= cmpVal;
      case '<=': case 'lte':      return rowVal <= cmpVal;
      case 'contains':
        return String(row[cond.field] || '').toLowerCase()
          .indexOf(String(cond.value || '').toLowerCase()) !== -1;
      case 'startsWith':
        return String(row[cond.field] || '').toLowerCase()
          .indexOf(String(cond.value || '').toLowerCase()) === 0;
      default: return true;
    }
  }

  /* ── Stage implementations ── */

  /**
   * source — fetch raw dataset from store by sourceId
   */
  function source(data, config, store) {
    if (!store || !config.sourceId) return [];
    return store.get(config.sourceId) || [];
  }

  /**
   * removeColumns — keep only specified fields in each row
   * config: { keep: ['field1', 'field2', ...] }
   */
  function removeColumns(data, config) {
    if (!config.keep || !config.keep.length) return data;
    return data.map(function (row) {
      var out = {};
      config.keep.forEach(function (f) {
        if (Object.prototype.hasOwnProperty.call(row, f)) out[f] = row[f];
      });
      return out;
    });
  }

  /**
   * filterRows — filter rows using AND/OR logic
   * config: { logic: 'AND'|'OR', conditions: [{field, operator, value}] }
   */
  function filterRows(data, config) {
    var conditions = config.conditions || [];
    if (!conditions.length) return data;
    var logic = (config.logic || 'AND').toUpperCase();
    return data.filter(function (row) {
      if (logic === 'OR') {
        return conditions.some(function (c) { return _matchCondition(row, c); });
      }
      return conditions.every(function (c) { return _matchCondition(row, c); });
    });
  }

  /**
   * replaceValues — find/replace values in a specific column
   * config: { column: 'cat', replacements: [{find, replace}] }
   */
  function replaceValues(data, config) {
    var col = config.column;
    var replacements = config.replacements || [];
    if (!col || !replacements.length) return data;
    return data.map(function (row) {
      var out = Object.assign({}, row);
      replacements.forEach(function (r) {
        if (String(out[col]) === String(r.find)) out[col] = r.replace;
      });
      return out;
    });
  }

  /**
   * groupBy — group rows by dimension(s), compute aggregates
   * config: { groupBy: ['field'], aggregates: [{field, func, as}] }
   * Aggregate funcs: SUM, COUNT, AVG, MIN, MAX
   */
  function groupBy(data, config) {
    var groupFields = config.groupBy || [];
    var aggregates  = config.aggregates || [];
    if (!groupFields.length) return data;

    // Build group map
    var groups = {};
    var order  = [];

    data.forEach(function (row) {
      var key = groupFields.map(function (f) { return String(row[f] || ''); }).join('||');
      if (!groups[key]) {
        groups[key] = { _rows: [] };
        groupFields.forEach(function (f) { groups[key][f] = row[f]; });
        order.push(key);
      }
      groups[key]._rows.push(row);
    });

    // Compute aggregates
    return order.map(function (key) {
      var g = groups[key];
      var out = {};
      groupFields.forEach(function (f) { out[f] = g[f]; });
      aggregates.forEach(function (agg) {
        var alias  = agg.as || (agg.func.toLowerCase() + '_' + agg.field);
        var nums   = g._rows.map(function (r) { return parseFloat(r[agg.field]) || 0; });
        switch ((agg.func || '').toUpperCase()) {
          case 'SUM':   out[alias] = nums.reduce(function (s, v) { return s + v; }, 0); break;
          case 'COUNT': out[alias] = g._rows.length; break;
          case 'AVG':   out[alias] = nums.length ? nums.reduce(function (s, v) { return s + v; }, 0) / nums.length : 0; break;
          case 'MIN':   out[alias] = nums.length ? Math.min.apply(null, nums) : 0; break;
          case 'MAX':   out[alias] = nums.length ? Math.max.apply(null, nums) : 0; break;
          default:      out[alias] = 0;
        }
      });
      return out;
    });
  }

  /**
   * addColumn — add computed columns using FormulaEvaluator
   * config: { columns: [{name, formula}] }
   */
  function addColumn(data, config) {
    var columns = config.columns || [];
    if (!columns.length) return data;
    var result = data.slice();
    columns.forEach(function (col) {
      result = window.FormulaEvaluator
        ? FormulaEvaluator.addColumn(result, col.name, col.formula)
        : result.map(function (row) { var ext = {}; ext[col.name] = 0; return Object.assign({}, row, ext); });
    });
    return result;
  }

  /**
   * sort — sort data by a field in asc|desc direction
   * config: { field, direction: 'asc'|'desc' }
   */
  function sort(data, config) {
    if (!config.field) return data;
    var dir = (config.direction || 'asc').toLowerCase() === 'desc' ? -1 : 1;
    return data.slice().sort(function (a, b) {
      var av = _coerce(a[config.field]);
      var bv = _coerce(b[config.field]);
      if (av < bv) return -1 * dir;
      if (av > bv) return  1 * dir;
      return 0;
    });
  }

  /**
   * merge — left join current data with another dataset from store
   * config: { datasetId, leftKey, rightKey, type: 'inner'|'left' }
   */
  function merge(data, config, store) {
    if (!store || !config.datasetId) return data;
    var right = store.get(config.datasetId) || [];
    var lk = config.leftKey;
    var rk = config.rightKey || lk;
    var type = (config.type || 'left').toLowerCase();

    // Index right dataset
    var rightIdx = {};
    right.forEach(function (row) {
      var k = String(row[rk] || '');
      if (!rightIdx[k]) rightIdx[k] = row;
    });

    var result = [];
    data.forEach(function (row) {
      var k = String(row[lk] || '');
      var rRow = rightIdx[k];
      if (rRow) {
        result.push(Object.assign({}, rRow, row));
      } else if (type === 'left') {
        result.push(Object.assign({}, row));
      }
    });
    return result;
  }

  /**
   * pivot — reshape: unique values of pivotCol become new columns
   * config: { rowKey, pivotCol, valueCol }
   */
  function pivot(data, config) {
    var rowKey   = config.rowKey;
    var pivotCol = config.pivotCol;
    var valueCol = config.valueCol;
    if (!rowKey || !pivotCol || !valueCol) return data;

    var rows = {};
    var pivotVals = [];
    data.forEach(function (row) {
      var rk = String(row[rowKey] || '');
      var pv = String(row[pivotCol] || '');
      if (!rows[rk]) { rows[rk] = {}; rows[rk][rowKey] = row[rowKey]; }
      rows[rk][pv] = row[valueCol];
      if (pivotVals.indexOf(pv) === -1) pivotVals.push(pv);
    });
    return Object.keys(rows).map(function (k) { return rows[k]; });
  }

  /**
   * unpivot — reshape: specified columns become rows
   * config: { idCols: ['id','name'], valueCols: ['jan','feb','mar'], nameCol: 'month', valueCol: 'amount' }
   */
  function unpivot(data, config) {
    var idCols    = config.idCols    || [];
    var valueCols = config.valueCols || [];
    var nameCol   = config.nameCol   || 'attribute';
    var valueCol  = config.valueCol  || 'value';
    var result = [];
    data.forEach(function (row) {
      valueCols.forEach(function (col) {
        var out = {};
        idCols.forEach(function (f) { out[f] = row[f]; });
        out[nameCol]  = col;
        out[valueCol] = row[col];
        result.push(out);
      });
    });
    return result;
  }

  /**
   * output — register dataset in store and pass data through
   * config: { name: 'output-dataset-id' }
   */
  function output(data, config, store) {
    if (store && config.name) {
      store.registerOutput(config.name, data, { sourceStage: 'output', updatedAt: Date.now() });
    }
    return data;
  }

  return {
    source:         source,
    removeColumns:  removeColumns,
    filterRows:     filterRows,
    replaceValues:  replaceValues,
    groupBy:        groupBy,
    addColumn:      addColumn,
    sort:           sort,
    merge:          merge,
    pivot:          pivot,
    unpivot:        unpivot,
    output:         output
  };
}());

window.PipelineStages = PipelineStages;
