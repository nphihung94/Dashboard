/**
 * stage-rule-forms-filter.js
 * Filter stage form: render + collect.
 * Depends on window.StageRuleForms._esc and window.StageRuleForms._fieldOpts
 * being set before this file loads.
 *
 * Registers:
 *   window.StageRuleForms.renderFilter
 *   window.StageRuleForms.collectFilter
 */

(function () {
  'use strict';

  var _esc       = function (s) { return window.StageRuleForms._esc(s); };
  var _fieldOpts = function (cols, sel, schema) { return window.StageRuleForms._fieldOpts(cols, sel, schema); };

  var OPERATORS = [
    { value: '=',          label: 'equals' },
    { value: '!=',         label: 'not equals' },
    { value: '>',          label: 'greater than' },
    { value: '<',          label: 'less than' },
    { value: '>=',         label: 'at least' },
    { value: '<=',         label: 'at most' },
    { value: 'contains',   label: 'contains' },
    { value: 'startsWith', label: 'starts with' }
  ];

  function _opOpts(sel) {
    return OPERATORS.map(function (op) {
      return '<option value="' + _esc(op.value) + '"' + (op.value === sel ? ' selected' : '') + '>' + _esc(op.label) + '</option>';
    }).join('');
  }

  function _condRow(i, cond, cols, disAttr, inputSchema) {
    var fieldSel = '<select class="form-select srf-cond-field" style="width:110px"' + disAttr + '>' +
      '<option value="">field</option>' + _fieldOpts(cols, cond.field || '', inputSchema) + '</select>';
    var opSel = '<select class="form-select srf-cond-op" style="width:100px"' + disAttr + '>' + _opOpts(cond.operator || '=') + '</select>';
    var valIn = '<input class="form-input srf-cond-val" style="width:100px" value="' + _esc(cond.value || '') + '"' + disAttr + ' />';
    var rmBtn = disAttr ? '' : '<button class="btn btn--ghost btn--sm srf-remove-cond">✕</button>';
    return '<div class="srf-cond-row">' + fieldSel + opSel + valIn + rmBtn + '</div>';
  }

  function renderFilter($c, rules, inputSchema, disAttr) {
    var logic = (rules && rules.logic) || 'AND';
    var conds = (rules && rules.conditions) || [];
    var cols = (inputSchema && inputSchema.columns || []).map(function (c) { return c.name; });

    var condHtml = conds.map(function (cond, i) { return _condRow(i, cond, cols, disAttr, inputSchema); }).join('');

    $c.html(
      '<div class="srf-logic-toggle">' +
        '<button class="btn btn--sm srf-logic-btn' + (logic === 'AND' ? ' is-active' : '') + '" data-logic="AND"' + disAttr + '>AND</button>' +
        '<button class="btn btn--sm srf-logic-btn' + (logic === 'OR' ? ' is-active' : '') + '" data-logic="OR"' + disAttr + '>OR</button>' +
      '</div>' +
      '<div class="srf-cond-list">' + condHtml + '</div>' +
      (!disAttr ? '<button class="btn btn--ghost btn--sm srf-add-cond">+ Add Condition</button>' : '')
    );

    $c.off('click.srf').on('click.srf', '.srf-logic-btn', function () {
      $c.find('.srf-logic-btn').removeClass('is-active');
      $(this).addClass('is-active');
    });
    $c.on('click.srf', '.srf-add-cond', function () {
      var idx = $c.find('.srf-cond-row').length;
      $c.find('.srf-cond-list').append(_condRow(idx, {}, cols, '', inputSchema));
    });
    $c.on('click.srf', '.srf-remove-cond', function () { $(this).closest('.srf-cond-row').remove(); });
  }

  function collectFilter($c) {
    var logic = $c.find('.srf-logic-btn.is-active').data('logic') || 'AND';
    var conditions = [];
    $c.find('.srf-cond-row').each(function () {
      conditions.push({
        field:    $(this).find('.srf-cond-field').val() || '',
        operator: $(this).find('.srf-cond-op').val() || '=',
        value:    $(this).find('.srf-cond-val').val() || ''
      });
    });
    return { logic: logic, conditions: conditions };
  }

  window.StageRuleForms.renderFilter  = renderFilter;
  window.StageRuleForms.collectFilter = collectFilter;
}());
