/**
 * formula-evaluator.js
 * Minimal arithmetic formula evaluator for pipeline addColumn stage.
 * Replaces field references in a formula with row values, then evaluates.
 * Falls back to ExcelFormulaAPI if available on window.
 *
 * Usage:
 *   FormulaEvaluator.evaluate('amount - cost', { amount: 100, cost: 60 }) // => 40
 *   FormulaEvaluator.evaluate('margin / amount * 100', row)
 */

var FormulaEvaluator = (function () {
  'use strict';

  /**
   * Sanitize a resolved expression — only allow digits, operators,
   * decimal points, spaces, and parentheses. Guards against code injection.
   * @param {string} expr
   * @returns {boolean}
   */
  function _isSafe(expr) {
    return /^[\d\s\+\-\*\/\(\)\.\,]+$/.test(expr);
  }

  /**
   * Evaluate a formula expression against a data row.
   * Field names in the formula are replaced by the numeric value from the row.
   * Supports +, -, *, /, parentheses, numeric literals.
   *
   * If ExcelFormulaAPI is available on window, uses it instead for richer
   * formula support (IF, SUM, ROUND, etc.).
   *
   * @param {string} formula  - e.g. "amount_sum - cost" or "margin / amount * 100"
   * @param {Object} row      - data row object { fieldName: value, ... }
   * @returns {number|null}   - numeric result or null on error
   */
  function evaluate(formula, row) {
    if (!formula || typeof formula !== 'string') return null;

    // Prefer ExcelFormulaAPI when available (loaded from ExcelFormlua lib)
    if (typeof ExcelFormulaAPI === 'function') {
      try {
        var api = ExcelFormulaAPI();
        api.addVariables(row);
        var result = api.evaluate(formula);
        if (!result.error) return result.value;
        // Fall through to built-in evaluator on API error
      } catch (e) { /* fall through */ }
    }

    // Built-in evaluator: replace field names with numeric values
    var expr = formula;

    // Collect field names sorted longest-first to avoid partial replacements
    var fields = Object.keys(row).sort(function (a, b) {
      return b.length - a.length;
    });

    fields.forEach(function (field) {
      var val = parseFloat(row[field]);
      if (!isNaN(val)) {
        // Replace whole-word occurrences only
        var re = new RegExp('\\b' + field.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b', 'g');
        expr = expr.replace(re, String(val));
      }
    });

    // Safety check before eval
    if (!_isSafe(expr)) {
      console.warn('[FormulaEvaluator] Unsafe expression blocked:', expr);
      return null;
    }

    try {
      /* jshint evil: true */
      var evalResult = new Function('return (' + expr + ')')();
      return typeof evalResult === 'number' && isFinite(evalResult) ? evalResult : null;
    } catch (e) {
      console.warn('[FormulaEvaluator] Eval error:', e.message, '| expr:', expr);
      return null;
    }
  }

  /**
   * Evaluate a formula for every row in a dataset.
   * Returns a new array with the computed column added.
   *
   * @param {Array}  data        - array of row objects
   * @param {string} columnName  - name for the new column
   * @param {string} formula     - formula expression
   * @returns {Array}
   */
  function addColumn(data, columnName, formula) {
    return data.map(function (row) {
      var newRow = Object.assign({}, row);
      var val = evaluate(formula, row);
      newRow[columnName] = val !== null ? val : 0;
      return newRow;
    });
  }

  return { evaluate: evaluate, addColumn: addColumn };
}());

window.FormulaEvaluator = FormulaEvaluator;
