/**
 * widget-card.js
 * Creates a Gridstack widget card wrapping a vibeDataWidget instance.
 * Card has drag handle, view icon, title, dataset badge, settings + remove buttons.
 *
 * API:
 *   WidgetCard.create(grid, config) → DOM element added to grid
 *   WidgetCard.destroyAll()         — tear down all active widgets
 */

var WidgetCard = (function () {
  'use strict';

  /* Track active widget jQuery elements for cleanup: id → $bodyEl */
  var _active = {};

  var _viewIcons = {
    bar:   '<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"><rect x="1" y="6" width="3.5" height="9" rx="1"/><rect x="6.25" y="3" width="3.5" height="12" rx="1"/><rect x="11.5" y="8" width="3.5" height="7" rx="1"/></svg>',
    line:  '<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="1,12 4.5,6 8,9 11.5,4 15,6"/></svg>',
    pie:   '<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M8 8 L8 1.5 A6.5 6.5 0 0 1 14.5 8 Z" fill="currentColor" opacity="0.3" stroke="none"/><circle cx="8" cy="8" r="6.5"/></svg>',
    table: '<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="1" y="1" width="6" height="6" rx="1"/><rect x="9" y="1" width="6" height="6" rx="1"/><rect x="1" y="9" width="6" height="6" rx="1"/><rect x="9" y="9" width="6" height="6" rx="1"/></svg>'
  };

  var _dragSvg    = '<svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><circle cx="5.5" cy="4" r="1.2"/><circle cx="10.5" cy="4" r="1.2"/><circle cx="5.5" cy="8" r="1.2"/><circle cx="10.5" cy="8" r="1.2"/><circle cx="5.5" cy="12" r="1.2"/><circle cx="10.5" cy="12" r="1.2"/></svg>';
  var _gearSvg    = '<svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><circle cx="8" cy="8" r="2.5"/><path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.05 3.05l1.41 1.41M11.54 11.54l1.41 1.41M3.05 12.95l1.41-1.41M11.54 4.46l1.41-1.41"/></svg>';
  var _trashSvg   = '<svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="2,4 14,4"/><path d="M5 4V2h6v2"/><path d="M3 4l1 10h8l1-10"/></svg>';
  var _moreSvg    = '<svg width="14" height="14" viewBox="0 0 4 16" fill="currentColor"><circle cx="2" cy="2.5" r="1.5"/><circle cx="2" cy="8" r="1.5"/><circle cx="2" cy="13.5" r="1.5"/></svg>';
  var _controlSvg = '<svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><line x1="2" y1="4" x2="14" y2="4"/><circle cx="5" cy="4" r="1.5" fill="currentColor" stroke="none"/><line x1="2" y1="9" x2="14" y2="9"/><circle cx="10" cy="9" r="1.5" fill="currentColor" stroke="none"/><line x1="2" y1="14" x2="14" y2="14"/><circle cx="7" cy="14" r="1.5" fill="currentColor" stroke="none"/></svg>';

  /**
   * Create and add a widget card to the Gridstack grid.
   * @param {Object} grid   — Gridstack instance
   * @param {Object} config — widget config { id, title, pipelineOutputId, view, xAxis, yAxis, x, y, w, h }
   * @returns {HTMLElement} the grid-stack-item element
   */
  function create(grid, config) {
    var bodyId = 'widget-body-' + config.id;
    var dsName = config.pipelineOutputId || '—';

    var cardHtml =
      '<div class="widget-card">' +
        '<div class="widget-card__header">' +
          '<span class="widget-card__drag-handle">' + _dragSvg + '</span>' +
          '<span class="widget-card__title">' + _esc(config.title || 'Widget') + '</span>' +
          '<span class="widget-card__dataset-badge">' + _esc(dsName) + '</span>' +
          '<div class="widget-card__actions">' +
            '<button class="btn-icon wc-controls-btn" title="Show/hide controls">' + _controlSvg + '</button>' +
            '<button class="btn-icon wc-more-btn" title="Options">' + _moreSvg + '</button>' +
          '</div>' +
        '</div>' +
        '<div class="widget-card__body">' +
          '<div id="' + bodyId + '" style="width:100%;height:100%"></div>' +
        '</div>' +
        _buildConfigDropdown(config) +
      '</div>';

    /* Add to Gridstack */
    var el = grid.addWidget({
      x: config.x || 0,
      y: config.y || 0,
      w: config.w || 6,
      h: config.h || 5,
      id: config.id,
      content: cardHtml
    });

    /* Init vibeDataWidget after DOM insertion */
    setTimeout(function () {
      _initWidget(config, bodyId);
      _bindCardEvents($(el), config, grid, bodyId);
    }, 50);

    return el;
  }

  function _initWidget(config, bodyId) {
    var $body = $('#' + bodyId);
    if (!$body.length) return;

    var dataset = window.DatasetStore ? DatasetStore.get(config.pipelineOutputId) : null;
    if (!dataset || !dataset.length) {
      $body.html('<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#8F8F8F;font-size:12px">No data</div>');
      return;
    }

    try {
      $body.dataWidget({
        dataset: dataset,
        xAxis:   config.xAxis   || 'category',
        yAxis:   config.yAxis   || 'amount',
        view:    config.view    || 'bar',
        title:   config.title   || '',
        size:    'lg'
      });
      _active[config.id] = $body;
    } catch (e) {
      console.error('[WidgetCard] dataWidget init error:', e);
      $body.html('<div style="padding:12px;color:#C62828;font-size:12px">Widget error: ' + e.message + '</div>');
    }
  }

  function _buildConfigDropdown(config) {
    var editSvg = '<svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M11.5 2.5l2 2L5 13H3v-2L11.5 2.5z"/></svg>';
    return '<div class="widget-more-menu" id="wc-cfg-' + config.id + '">' +
      '<button class="widget-more-menu__item wc-edit-btn">' +
        editSvg + ' Edit widget' +
      '</button>' +
      '<div class="widget-more-menu__divider"></div>' +
      '<button class="widget-more-menu__item widget-more-menu__item--danger wc-remove-btn">' +
        _trashSvg + ' Remove widget' +
      '</button>' +
    '</div>';
  }

  function _bindCardEvents($el, config, grid, bodyId) {
    var $card = $el.find('.widget-card');

    /* More-menu toggle */
    $card.on('click', '.wc-more-btn', function (e) {
      e.stopPropagation();
      var $dd = $('#wc-cfg-' + config.id);
      $dd.toggleClass('is-open');
    });

    /* Toggle inner controls (toolbar / insight / filter bars) — header button */
    $card.on('click', '.wc-controls-btn', function (e) {
      e.stopPropagation();
      var visible = $card.toggleClass('controls-visible').hasClass('controls-visible');
      $(this).toggleClass('is-active', visible).attr('title', visible ? 'Hide controls' : 'Show controls');
    });

    /* Edit widget — open add-widget modal in edit mode */
    $card.on('click', '.wc-edit-btn', function (e) {
      e.stopPropagation();
      $('#wc-cfg-' + config.id).removeClass('is-open');
      if (window.Toast) Toast.info('Edit widget coming soon');
    });

    /* Close dropdown on outside click */
    $(document).on('click.wc-' + config.id, function () {
      $('#wc-cfg-' + config.id).removeClass('is-open');
    });

    /* Remove widget */
    $card.on('click', '.wc-remove-btn', function () {
      _destroyWidget(config.id);
      grid.removeWidget($el[0]);
      if (window.DashboardStore) DashboardStore.removeWidget(config.id);
      if (window.Toast) Toast.success('Widget removed');
    });
  }

  function _destroyWidget(id) {
    var $body = _active[id];
    if ($body && $body.data('vibe-dataWidget')) {
      try { $body.dataWidget('destroy'); } catch (e) { /* ignore */ }
    }
    delete _active[id];
    // Always unbind the namespaced document handler to prevent accumulation
    // across navigate-away/back cycles (Fix: document click handler leak)
    $(document).off('click.wc-' + id);
  }

  function destroyAll() {
    Object.keys(_active).forEach(function (id) { _destroyWidget(id); });
  }

  /**
   * Refresh a specific widget with new dataset data.
   * Called when a pipeline re-runs.
   */
  function refresh(id, pipelineOutputId) {
    var $body = _active[id];
    if (!$body || !$body.data('vibe-dataWidget')) return;
    var dataset = window.DatasetStore ? DatasetStore.get(pipelineOutputId) : null;
    if (dataset) {
      try { $body.dataWidget('option', 'dataset', dataset); } catch (e) { /* ignore */ }
    }
  }

  function _esc(str) {
    return $('<span>').text(String(str || '')).html();
  }

  return { create: create, destroyAll: destroyAll, refresh: refresh };
}());

window.WidgetCard = WidgetCard;
