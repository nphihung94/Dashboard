/**
 * stage-type-picker.js
 * Popover dropdown listing available pipeline stage types.
 * Shown when user clicks "+ Add Stage" in the flow canvas.
 *
 * API:
 *   StageTypePicker.show(anchorEl, onSelect)
 *   StageTypePicker.hide()
 *   onSelect(stageType) — called with the chosen type string
 */

var StageTypePicker = (function () {
  'use strict';

  var _stageTypes = [
    { type: 'source',        label: 'Source',        color: '#1565C0' },
    { type: 'removeColumns', label: 'Remove Columns', color: '#7B1FA2' },
    { type: 'filterRows',    label: 'Filter Rows',    color: '#6A1B9A' },
    { type: 'replaceValues', label: 'Replace Values', color: '#7B1FA2' },
    { type: 'groupBy',       label: 'Group By',       color: '#00695C' },
    { type: 'addColumn',     label: 'Add Column',     color: '#283593' },
    { type: 'sort',          label: 'Sort',           color: '#AD1457' },
    { type: 'merge',         label: 'Merge',          color: '#E65100' },
    { type: 'pivot',         label: 'Pivot',          color: '#4A148C' },
    { type: 'unpivot',       label: 'Unpivot',        color: '#880E4F' },
    { type: 'output',        label: 'Output',         color: '#1B5E20' }
  ];

  var _PICKER_ID = 'stage-type-picker-popover';

  function show(anchorEl, onSelect) {
    hide(); // remove any existing

    var $anchor = $(anchorEl);
    var offset  = $anchor.offset();

    var items = _stageTypes.map(function (s) {
      return '<button class="stage-type-option" data-type="' + s.type + '">' +
        '<span class="stage-type-dot" style="background:' + s.color + '"></span>' +
        s.label +
      '</button>';
    }).join('');

    var $picker = $(
      '<div class="stage-type-picker" id="' + _PICKER_ID + '">' + items + '</div>'
    );

    $picker.css({
      position: 'absolute',
      top:  (offset.top + $anchor.outerHeight() + 4) + 'px',
      left: offset.left + 'px',
      zIndex: 999
    });

    $('body').append($picker);

    /* Item click */
    $picker.on('click', '.stage-type-option', function (e) {
      e.stopPropagation();
      var type = $(this).data('type');
      hide();
      if (onSelect) onSelect(type);
    });

    /* Outside click closes */
    setTimeout(function () {
      $(document).on('click.stageTypePicker', function () { hide(); });
    }, 10);
  }

  function hide() {
    $('#' + _PICKER_ID).remove();
    $(document).off('click.stageTypePicker');
  }

  return { show: show, hide: hide };
}());

window.StageTypePicker = StageTypePicker;
