/**
 * flow-builder-overlays.js
 * Context menu (Add Stage) and slide-in preview drawer for the Flow Builder.
 * Extracted from flow-builder-shell.js to keep files under 200 lines.
 *
 * API:
 *   FlowBuilderOverlays.showContextMenu($container, e, onTypeSelected)
 *   FlowBuilderOverlays.dismissContextMenu()
 *   FlowBuilderOverlays.openDrawer($container, stage)
 *   FlowBuilderOverlays.closeDrawer($container)
 */
var FlowBuilderOverlays = (function () {
  'use strict';

  var _transformTypes = ['filter', 'select', 'aggregate', 'sort', 'limit', 'formula', 'pivot', 'unpivot'];
  var _typeLabel = {
    source: 'Source', filter: 'Filter', select: 'Select', aggregate: 'Aggregate',
    sort: 'Sort', limit: 'Limit', formula: 'Formula', pivot: 'Pivot', unpivot: 'Unpivot'
  };
  var _typeDescs = {
    filter:    'Remove rows matching conditions',
    select:    'Pick or rename columns',
    aggregate: 'Group rows and compute summaries',
    sort:      'Order rows by one or more columns',
    limit:     'Keep only the first N rows',
    formula:   'Add a computed column',
    pivot:     'Reshape rows into columns',
    unpivot:   'Reshape columns into rows'
  };

  /**
   * Show Add Stage context menu near the clicked button.
   * @param {jQuery}   $container    — top-level shell container
   * @param {Event}    e             — click event from Add Stage button
   * @param {Function} onTypeSelected(type) — called when a type is picked
   */
  function showContextMenu($container, e, onTypeSelected) {
    dismissContextMenu();
    var $btn   = $(e.currentTarget);
    var btnOff = $btn.offset()                              || { top: 0, left: 0 };
    var fbOff  = $container.find('.flow-builder').offset()  || { top: 0, left: 0 };
    var top  = btnOff.top  - fbOff.top  + $btn.outerHeight() + 4;
    var left = btnOff.left - fbOff.left;

    var items = _transformTypes.map(function (t) {
      return '<div class="flow-context-menu__item" data-type="' + t + '">' +
        '<span class="flow-context-menu__name">' + (_typeLabel[t] || t) + '</span>' +
        '<span class="flow-context-menu__desc">' + (_typeDescs[t] || '') + '</span>' +
      '</div>';
    }).join('');

    var $menu = $('<div class="flow-context-menu" id="fbs-ctx-menu" style="top:' + top + 'px;left:' + left + 'px">' + items + '</div>');
    $container.find('.flow-builder').append($menu);

    $menu.on('click', '.flow-context-menu__item', function () {
      var type = $(this).data('type');
      dismissContextMenu();
      if (onTypeSelected) onTypeSelected(type);
    });

    $(document).off('mousedown.flowctx').on('mousedown.flowctx', function (ev) {
      if (!$(ev.target).closest('#fbs-ctx-menu').length) dismissContextMenu();
    });
  }

  function dismissContextMenu() {
    $('#fbs-ctx-menu').remove();
    $(document).off('mousedown.flowctx');
  }

  /**
   * Open the slide-in preview drawer over the right panel.
   * Renders cached `stage._lastExecData` via StagePreviewTable.
   */
  function openDrawer($container, stage) {
    closeDrawer($container);
    var label    = _typeLabel[stage.type] || stage.type;
    var rowCount = (stage._lastExecData && stage._lastExecData.length) || 0;
    var colCount = (stage.outputSchema && stage.outputSchema.columns && stage.outputSchema.columns.length) || 0;
    var statsText = colCount + ' columns, ' + rowCount + ' rows';
    var $right = $container.find('#fbs-right');

    /* Clickable backdrop — click outside drawer closes it */
    var $backdrop = $('<div class="flow-backdrop"></div>');
    $backdrop.on('click', function () { closeDrawer($container); });
    $right.append($backdrop);

    var $drawer = $(
      '<div class="flow-preview-drawer">' +
        '<div class="flow-preview-drawer__header">' +
          '<span>Review Output \u2014 ' + _esc(label) + '</span>' +
          '<span class="flow-drawer-stats">' + _esc(statsText) + '</span>' +
          '<button class="btn btn--ghost btn--sm flow-preview-drawer__close">&times; Close</button>' +
        '</div>' +
        '<div class="flow-preview-drawer__body"></div>' +
      '</div>'
    );
    $right.append($drawer);
    if (window.StagePreviewTable) {
      StagePreviewTable.renderForStage($drawer.find('.flow-preview-drawer__body'), stage);
    }
    setTimeout(function () { $backdrop.addClass('is-open'); $drawer.addClass('is-open'); }, 10);
  }

  function closeDrawer($container) {
    var $right = $container.find('#fbs-right');
    var $d = $right.find('.flow-preview-drawer');
    var $b = $right.find('.flow-backdrop');
    if (!$d.length) return;
    $d.removeClass('is-open');
    $b.removeClass('is-open');
    setTimeout(function () { $d.remove(); $b.remove(); }, 260);
  }

  /**
   * Bind Ctrl+S (save stage) and Ctrl+Enter (run flow) to the .flow-builder element.
   * Scoped to container — no global leaks. Call unbindKeyboard() on destroy.
   * @param {jQuery} $container  — top-level shell container
   */
  function bindKeyboard($container) {
    $container.find('.flow-builder').off('keydown.fbkeys').on('keydown.fbkeys', function (e) {
      if (!e.ctrlKey && !e.metaKey) return;
      /* Ctrl+S / Cmd+S — save active stage */
      if (e.key === 's') {
        e.preventDefault();
        $container.find('.fss-save-btn:visible, .tsp-save-btn:visible').first().trigger('click');
        return;
      }
      /* Ctrl+Enter / Cmd+Enter — run flow */
      if (e.key === 'Enter') {
        e.preventDefault();
        var $run = $container.find('#flp-run-flow');
        if ($run.length && !$run.prop('disabled')) $run.trigger('click');
      }
    });
  }

  function unbindKeyboard($container) {
    $container.find('.flow-builder').off('keydown.fbkeys');
  }

  function _esc(str) { return $('<span>').text(String(str == null ? '' : str)).html(); }

  return {
    showContextMenu: showContextMenu, dismissContextMenu: dismissContextMenu,
    openDrawer: openDrawer, closeDrawer: closeDrawer,
    bindKeyboard: bindKeyboard, unbindKeyboard: unbindKeyboard
  };
}());

window.FlowBuilderOverlays = FlowBuilderOverlays;
