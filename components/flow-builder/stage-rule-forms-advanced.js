/**
 * stage-rule-forms-advanced.js
 * Render + collect pairs for aggregate, pivot, unpivot stage forms.
 * Loaded after stage-rule-forms.js; StageRuleForms delegates to this module.
 *
 * API:
 *   StageRuleFormsAdvanced.render($container, stageType, rules, inputSchema, isReadOnly)
 *   StageRuleFormsAdvanced.collect($container, stageType) → rules object
 */

var StageRuleFormsAdvanced = (function () {
  'use strict';

  function _esc(s) { return $('<span>').text(String(s || '')).html(); }

  var _TYPE_SYMBOLS = { string: '[T]', number: '[#]', date: '[D]', boolean: '[B]' };

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

  function _multiSelect(cls, cols, selected, disAttr, inputSchema) {
    return '<select class="form-select ' + cls + '" multiple size="4"' + disAttr + '>' +
      cols.map(function (c) {
        var sel = selected && selected.indexOf(c) !== -1 ? ' selected' : '';
        var prefix = '';
        if (inputSchema && inputSchema.columns) {
          for (var i = 0; i < inputSchema.columns.length; i++) {
            if (inputSchema.columns[i].name === c) {
              prefix = (_TYPE_SYMBOLS[inputSchema.columns[i].type] || '') + ' ';
              break;
            }
          }
        }
        return '<option value="' + _esc(c) + '"' + sel + '>' + _esc(prefix + c) + '</option>';
      }).join('') +
    '</select>';
  }

  /* ── Aggregate ── */

  var AGG_FUNCS = ['SUM', 'COUNT', 'AVG', 'MIN', 'MAX'];

  function renderAggregate($c, rules, inputSchema, disAttr) {
    var cols = (inputSchema && inputSchema.columns || []).map(function (c) { return c.name; });
    var groupBy = (rules && rules.groupBy) || [];
    var aggs = (rules && rules.aggregates) || [];

    var aggRows = aggs.map(function (a) { return _aggRow(a, cols, disAttr, inputSchema); }).join('');

    $c.html(
      '<div class="form-group"><label class="form-label">Group By (hold Ctrl/Cmd to multi-select)</label>' +
        _multiSelect('srf-groupby', cols, groupBy, disAttr, inputSchema) +
      '</div>' +
      '<div class="form-group"><label class="form-label">Aggregates</label>' +
        '<div class="srf-agg-list">' + aggRows + '</div>' +
        (!disAttr ? '<button class="btn btn--ghost btn--sm srf-add-agg">+ Add Aggregate</button>' : '') +
      '</div>'
    );

    $c.off('click.srfa').on('click.srfa', '.srf-add-agg', function () {
      $c.find('.srf-agg-list').append(_aggRow({}, cols, '', inputSchema));
    });
    $c.on('click.srfa', '.srf-remove-agg', function () { $(this).closest('.srf-agg-row').remove(); });
  }

  function _aggRow(agg, cols, disAttr, inputSchema) {
    var funcOpts = AGG_FUNCS.map(function (f) {
      return '<option' + (f === (agg.func || '') ? ' selected' : '') + '>' + f + '</option>';
    }).join('');
    return '<div class="srf-agg-row">' +
      '<select class="form-select srf-agg-field" style="width:110px"' + disAttr + '>' +
        '<option value="">field</option>' + _fieldOpts(cols, agg.field || '', inputSchema) +
      '</select>' +
      '<select class="form-select srf-agg-func" style="width:80px"' + disAttr + '>' + funcOpts + '</select>' +
      '<input class="form-input srf-agg-alias" placeholder="alias" value="' + _esc(agg.as || '') + '"' + disAttr + ' style="width:100px" />' +
      (!disAttr ? '<button class="btn btn--ghost btn--sm srf-remove-agg">✕</button>' : '') +
    '</div>';
  }

  function collectAggregate($c) {
    var groupBy = [];
    $c.find('.srf-groupby option:selected').each(function () { groupBy.push($(this).val()); });
    var aggregates = [];
    $c.find('.srf-agg-row').each(function () {
      aggregates.push({
        field: $(this).find('.srf-agg-field').val() || '',
        func:  $(this).find('.srf-agg-func').val()  || 'SUM',
        as:    $(this).find('.srf-agg-alias').val().trim() || null
      });
    });
    return { groupBy: groupBy, aggregates: aggregates };
  }

  /* ── Pivot ── */

  function renderPivot($c, rules, inputSchema, disAttr) {
    var cols = (inputSchema && inputSchema.columns || []).map(function (c) { return c.name; });
    var r = rules || {};
    $c.html(
      '<div class="form-group"><label class="form-label">Row Key</label>' +
        '<select class="form-select srf-pivot-rowkey"' + disAttr + '><option value="">— select —</option>' + _fieldOpts(cols, r.rowKey || '', inputSchema) + '</select>' +
      '</div>' +
      '<div class="form-group"><label class="form-label">Pivot Column</label>' +
        '<select class="form-select srf-pivot-col"' + disAttr + '><option value="">— select —</option>' + _fieldOpts(cols, r.pivotCol || '', inputSchema) + '</select>' +
      '</div>' +
      '<div class="form-group"><label class="form-label">Value Column</label>' +
        '<select class="form-select srf-pivot-val"' + disAttr + '><option value="">— select —</option>' + _fieldOpts(cols, r.valueCol || '', inputSchema) + '</select>' +
      '</div>'
    );
  }

  function collectPivot($c) {
    return {
      rowKey:   $c.find('.srf-pivot-rowkey').val() || '',
      pivotCol: $c.find('.srf-pivot-col').val()    || '',
      valueCol: $c.find('.srf-pivot-val').val()    || ''
    };
  }

  /* ── Unpivot ── */

  function renderUnpivot($c, rules, inputSchema, disAttr) {
    var cols = (inputSchema && inputSchema.columns || []).map(function (c) { return c.name; });
    var r = rules || {};
    $c.html(
      '<div class="form-group"><label class="form-label">ID Columns (keep as-is)</label>' +
        _multiSelect('srf-unpivot-id', cols, r.idCols || [], disAttr, inputSchema) +
      '</div>' +
      '<div class="form-group"><label class="form-label">Value Columns (to unpivot)</label>' +
        _multiSelect('srf-unpivot-val', cols, r.valueCols || [], disAttr, inputSchema) +
      '</div>' +
      '<div class="form-group"><label class="form-label">Name Column (new col for old col names)</label>' +
        '<input class="form-input srf-unpivot-namecol" value="' + _esc(r.nameCol || 'attribute') + '"' + disAttr + ' />' +
      '</div>' +
      '<div class="form-group"><label class="form-label">Value Column (new col for values)</label>' +
        '<input class="form-input srf-unpivot-valcol" value="' + _esc(r.valueCol || 'value') + '"' + disAttr + ' />' +
      '</div>'
    );
  }

  function collectUnpivot($c) {
    var idCols = [], valueCols = [];
    $c.find('.srf-unpivot-id option:selected').each(function () { idCols.push($(this).val()); });
    $c.find('.srf-unpivot-val option:selected').each(function () { valueCols.push($(this).val()); });
    return {
      idCols:    idCols,
      valueCols: valueCols,
      nameCol:   $c.find('.srf-unpivot-namecol').val().trim() || 'attribute',
      valueCol:  $c.find('.srf-unpivot-valcol').val().trim()  || 'value'
    };
  }

  /* ── Dispatch ── */

  function render($c, stageType, rules, inputSchema, isReadOnly) {
    var disAttr = isReadOnly ? ' disabled' : '';
    if (stageType === 'aggregate') return renderAggregate($c, rules, inputSchema, disAttr);
    if (stageType === 'pivot')     return renderPivot($c, rules, inputSchema, disAttr);
    if (stageType === 'unpivot')   return renderUnpivot($c, rules, inputSchema, disAttr);
    $c.html('<span style="color:#aaa">Unknown stage type: ' + _esc(stageType) + '</span>');
  }

  function collect($c, stageType) {
    if (stageType === 'aggregate') return collectAggregate($c);
    if (stageType === 'pivot')     return collectPivot($c);
    if (stageType === 'unpivot')   return collectUnpivot($c);
    return {};
  }

  return { render: render, collect: collect };
}());

window.StageRuleFormsAdvanced = StageRuleFormsAdvanced;
