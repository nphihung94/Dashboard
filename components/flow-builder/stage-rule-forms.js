/**
 * stage-rule-forms.js
 * Thin coordinator: shared helpers + sort/limit/formula forms.
 * Filter and select forms are in their own modules (loaded after this file):
 *   stage-rule-forms-filter.js  — renderFilter, collectFilter
 *   stage-rule-forms-select.js  — renderSelect, collectSelect
 * Advanced forms (aggregate, pivot, unpivot) in stage-rule-forms-advanced.js.
 *
 * Public API (unchanged):
 *   StageRuleForms.render($container, stageType, rules, inputSchema, isReadOnly)
 *   StageRuleForms.collect($container, stageType) → rules object
 */

var StageRuleForms = (function () {
  'use strict';

  /* ── Shared helpers (exposed on namespace for sub-modules) ── */

  function _esc(s) { return $('<span>').text(String(s || '')).html(); }

  var _TYPE_SYMBOLS = { string: '[T]', number: '[#]', date: '[D]', boolean: '[B]' };

  /* Prefix display text with type symbol for <option> elements (no HTML allowed inside option). */
  function _fieldOpts(cols, sel, inputSchema) {
    return cols.map(function (c) {
      var prefix = '';
      if (inputSchema && inputSchema.columns) {
        for (var i = 0; i < inputSchema.columns.length; i++) {
          if (inputSchema.columns[i].name === c) {
            prefix = (_TYPE_SYMBOLS[inputSchema.columns[i].type] || '') + ' ';
            break;
          }
        }
      }
      return '<option value="' + _esc(c) + '"' + (c === sel ? ' selected' : '') + '>' + _esc(prefix + c) + '</option>';
    }).join('');
  }

  /* Visual badge span for use in non-option HTML contexts. */
  function _typeBadge(colName, inputSchema) {
    if (!inputSchema || !inputSchema.columns) return '';
    var col = null;
    for (var i = 0; i < inputSchema.columns.length; i++) {
      if (inputSchema.columns[i].name === colName) { col = inputSchema.columns[i]; break; }
    }
    if (!col || !col.type) return '';
    var icons = { string: 'T', number: '#', date: 'D', boolean: 'B' };
    var letter = icons[col.type] || col.type.charAt(0).toUpperCase();
    var mod = col.type === 'number' ? '--number' : (col.type === 'date' ? '--date' : (col.type === 'boolean' ? '--boolean' : ''));
    return '<span class="flow-type-badge' + (mod ? ' flow-type-badge' + mod : '') + '">' + letter + '</span>';
  }

  /* ── Sort ── */

  function renderSort($c, rules, inputSchema, disAttr) {
    var cols  = (inputSchema && inputSchema.columns || []).map(function (c) { return c.name; });
    var field = (rules && rules.field)     || '';
    var dir   = (rules && rules.direction) || 'asc';
    $c.html(
      '<div class="form-group"><label class="form-label">Field</label>' +
        '<select class="form-select srf-sort-field"' + disAttr + '><option value="">— select —</option>' + _fieldOpts(cols, field, inputSchema) + '</select>' +
      '</div>' +
      '<div class="srf-logic-toggle">' +
        '<button class="btn btn--sm srf-dir-btn' + (dir === 'asc'  ? ' is-active' : '') + '" data-dir="asc"'  + disAttr + '>Asc</button>' +
        '<button class="btn btn--sm srf-dir-btn' + (dir === 'desc' ? ' is-active' : '') + '" data-dir="desc"' + disAttr + '>Desc</button>' +
      '</div>'
    );
    $c.off('click.srf').on('click.srf', '.srf-dir-btn', function () {
      $c.find('.srf-dir-btn').removeClass('is-active');
      $(this).addClass('is-active');
    });
  }

  function collectSort($c) {
    return {
      field:     $c.find('.srf-sort-field').val() || '',
      direction: $c.find('.srf-dir-btn.is-active').data('dir') || 'asc'
    };
  }

  /* ── Limit ── */

  function renderLimit($c, rules, inputSchema, disAttr) {
    var count = (rules && rules.count) || 10;
    $c.html(
      '<div class="form-group"><label class="form-label">Row Count</label>' +
        '<input class="form-input srf-limit-count" type="number" min="1" value="' + count + '"' + disAttr + ' />' +
      '</div>'
    );
  }

  function collectLimit($c) {
    return { count: parseInt($c.find('.srf-limit-count').val(), 10) || 10 };
  }

  /* ── Formula ── */

  function renderFormula($c, rules, inputSchema, disAttr) {
    var cols    = (inputSchema && inputSchema.columns || []).map(function (c) { return c.name; });
    var columns = (rules && rules.columns) || [{ name: '', formula: '' }];
    var hintCols = (inputSchema && inputSchema.columns || []).map(function (c) {
      var sym = _TYPE_SYMBOLS[c.type] || '';
      return sym ? sym + ' ' + c.name : c.name;
    });
    var hint = cols.length ? '<div class="rule-summary">Available: ' + _esc(hintCols.join(', ')) + '</div>' : '';
    var rows    = columns.map(function (col) {
      return '<div class="srf-formula-row">' +
        '<input class="form-input srf-formula-name" placeholder="New column name" value="' + _esc(col.name || '') + '"' + disAttr + ' style="width:140px" />' +
        '<input class="form-input srf-formula-expr" placeholder="Formula, e.g. {price}*{qty}" value="' + _esc(col.formula || '') + '"' + disAttr + ' style="flex:1" />' +
        (!disAttr ? '<button class="btn btn--ghost btn--sm srf-remove-formula">✕</button>' : '') +
      '</div>';
    }).join('');
    $c.html(hint + '<div class="srf-formula-list">' + rows + '</div>' +
      (!disAttr ? '<button class="btn btn--ghost btn--sm srf-add-formula">+ Add Column</button>' : ''));
    $c.off('click.srf').on('click.srf', '.srf-add-formula', function () {
      $c.find('.srf-formula-list').append(
        '<div class="srf-formula-row">' +
          '<input class="form-input srf-formula-name" placeholder="Name" style="width:140px" />' +
          '<input class="form-input srf-formula-expr" placeholder="Formula" style="flex:1" />' +
          '<button class="btn btn--ghost btn--sm srf-remove-formula">✕</button>' +
        '</div>'
      );
    });
    $c.on('click.srf', '.srf-remove-formula', function () { $(this).closest('.srf-formula-row').remove(); });
  }

  function collectFormula($c) {
    var columns = [];
    $c.find('.srf-formula-row').each(function () {
      columns.push({
        name:    $(this).find('.srf-formula-name').val().trim(),
        formula: $(this).find('.srf-formula-expr').val().trim()
      });
    });
    return { columns: columns };
  }

  /* ── Dispatch ── */

  function render($c, stageType, rules, inputSchema, isReadOnly) {
    var disAttr = isReadOnly ? ' disabled' : '';
    if (stageType === 'filter')  return StageRuleForms.renderFilter($c, rules, inputSchema, disAttr);
    if (stageType === 'select')  return StageRuleForms.renderSelect($c, rules, inputSchema, disAttr);
    if (stageType === 'sort')    return renderSort($c, rules, inputSchema, disAttr);
    if (stageType === 'limit')   return renderLimit($c, rules, inputSchema, disAttr);
    if (stageType === 'formula') return renderFormula($c, rules, inputSchema, disAttr);
    // Advanced forms delegated
    if (window.StageRuleFormsAdvanced) return StageRuleFormsAdvanced.render($c, stageType, rules, inputSchema, isReadOnly);
    $c.html('<span style="color:#aaa">Form for "' + _esc(stageType) + '" not available</span>');
  }

  function collect($c, stageType) {
    if (stageType === 'filter')  return StageRuleForms.collectFilter($c);
    if (stageType === 'select')  return StageRuleForms.collectSelect($c);
    if (stageType === 'sort')    return collectSort($c);
    if (stageType === 'limit')   return collectLimit($c);
    if (stageType === 'formula') return collectFormula($c);
    if (window.StageRuleFormsAdvanced) return StageRuleFormsAdvanced.collect($c, stageType);
    return {};
  }

  return { render: render, collect: collect, _esc: _esc, _fieldOpts: _fieldOpts, _typeBadge: _typeBadge };
}());

window.StageRuleForms = StageRuleForms;
