/**
 * stage-rule-forms-select.js
 * Select/rename stage form: render + collect.
 * Depends on window.StageRuleForms._esc being set before this file loads.
 *
 * Registers:
 *   window.StageRuleForms.renderSelect
 *   window.StageRuleForms.collectSelect
 */

(function () {
  'use strict';

  var _esc       = function (s) { return window.StageRuleForms._esc(s); };
  var _typeBadge = function (col, schema) { return window.StageRuleForms._typeBadge(col, schema); };

  function renderSelect($c, rules, inputSchema, disAttr) {
    var keep    = (rules && rules.keep)    || [];
    var renames = (rules && rules.renames) || {};
    var cols    = (inputSchema && inputSchema.columns || []).map(function (c) { return c.name; });

    /* Search input — only shown when column count exceeds 8 */
    var searchHtml = '';
    if (cols.length > 8) {
      searchHtml = '<div class="srf-col-search-wrap">' +
        '<input class="form-input srf-col-search" placeholder="Search columns\u2026" type="search" />' +
      '</div>';
    }

    var rowsHtml = cols.map(function (col) {
      var checked   = keep.length === 0 || keep.indexOf(col) !== -1 ? ' checked' : '';
      var renameVal = renames[col] || '';
      return '<div class="srf-select-row">' +
        '<input type="checkbox" class="srf-sel-check" value="' + _esc(col) + '"' + checked + disAttr + ' />' +
        _typeBadge(col, inputSchema) +
        '<span class="srf-sel-name">' + _esc(col) + '</span>' +
        '<input class="form-input srf-sel-rename" style="width:120px" placeholder="rename\u2026" value="' + _esc(renameVal) + '"' + disAttr + ' />' +
      '</div>';
    }).join('') || '<span style="color:#aaa">No columns in input</span>';

    $c.html(searchHtml + rowsHtml);

    /* Bind search — toggles .is-hidden; collectSelect() iterates ALL rows */
    if (cols.length > 8) {
      $c.on('input', '.srf-col-search', function () {
        var q = $(this).val().toLowerCase();
        $c.find('.srf-select-row').each(function () {
          var name = $(this).find('.srf-sel-name').text().toLowerCase();
          $(this).toggleClass('is-hidden', q.length > 0 && name.indexOf(q) === -1);
        });
      });
    }
  }

  function collectSelect($c) {
    var keep = [], renames = {};
    $c.find('.srf-select-row').each(function () {
      var $row = $(this);
      if ($row.find('.srf-sel-check').is(':checked')) {
        var col = $row.find('.srf-sel-check').val();
        keep.push(col);
        var r = $row.find('.srf-sel-rename').val().trim();
        if (r) renames[col] = r;
      }
    });
    return { keep: keep, renames: renames };
  }

  window.StageRuleForms.renderSelect  = renderSelect;
  window.StageRuleForms.collectSelect = collectSelect;
}());
