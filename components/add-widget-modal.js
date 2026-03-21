/**
 * add-widget-modal.js
 * Single-step modal for adding a new widget to the dashboard.
 * Left panel: form fields. Right panel: live chart/table preview.
 *
 * API:
 *   AddWidgetModal.open(onAdd)  — onAdd(widgetConfig) called on confirm
 *   AddWidgetModal.close()
 */

var AddWidgetModal = (function () {
  'use strict';

  var _onAdd = null;
  var _selectedView = 'bar';

  var _types = [
    { view: 'bar',   label: 'Bar',   icon: '<svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"><rect x="1" y="6" width="3.5" height="9" rx="1"/><rect x="6.25" y="3" width="3.5" height="12" rx="1"/><rect x="11.5" y="8" width="3.5" height="7" rx="1"/></svg>' },
    { view: 'line',  label: 'Line',  icon: '<svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="1,12 4.5,6 8,9 11.5,4 15,6"/><circle cx="4.5" cy="6" r="1.5" fill="currentColor" stroke="none"/><circle cx="11.5" cy="4" r="1.5" fill="currentColor" stroke="none"/></svg>' },
    { view: 'pie',   label: 'Pie',   icon: '<svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M8 8L8 1.5A6.5 6.5 0 0 1 14.5 8Z" fill="currentColor" opacity="0.3" stroke="none"/><circle cx="8" cy="8" r="6.5"/><line x1="8" y1="8" x2="8" y2="1.5"/><line x1="8" y1="8" x2="14.5" y2="8"/></svg>' },
    { view: 'table', label: 'Table', icon: '<svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="1" y="1" width="14" height="3" rx="1"/><line x1="1" y1="7" x2="15" y2="7"/><line x1="1" y1="11" x2="15" y2="11"/><line x1="1" y1="4" x2="1" y2="15"/><line x1="15" y1="4" x2="15" y2="15"/><rect x="1" y="4" width="14" height="11" rx="0"/></svg>' }
  ];

  var _closeSvg = '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="4" y1="4" x2="12" y2="12"/><line x1="12" y1="4" x2="4" y2="12"/></svg>';

  /* ── Public API ── */

  function open(onAdd) {
    _onAdd = onAdd || function () {};
    _selectedView = 'bar';

    $('#add-widget-overlay').remove();

    var $overlay = $('<div class="modal-overlay" id="add-widget-overlay"></div>');
    var $modal   = $(_buildModalHTML());
    $overlay.append($modal);
    $('body').append($overlay);

    _populateDatasets($modal);
    _bindEvents($overlay, $modal);
    _updatePreview($modal.find('.add-widget-preview'), _getConfig($modal));
  }

  function close() {
    var $host = $('#add-widget-overlay').find('.preview-widget-host');
    if ($host.length && $host.data('vibeDataWidget')) {
      try { $host.dataWidget('destroy'); } catch (e) {}
    }
    $('#add-widget-overlay').remove();
  }

  /* ── HTML builders ── */

  function _buildFormHTML() {
    var typeCards = _types.map(function (t) {
      var sel = t.view === _selectedView ? ' is-selected' : '';
      return '<div class="widget-type-card' + sel + '" data-view="' + t.view + '" style="flex:1;padding:8px 4px;min-width:60px">' +
        '<div class="widget-type-card__icon">' + t.icon + '</div>' +
        '<div class="widget-type-card__label" style="font-size:11px">' + t.label + '</div>' +
      '</div>';
    }).join('');

    return '<div class="add-widget-form" style="flex:1;display:flex;flex-direction:column;gap:12px;min-width:0">' +
      '<div class="form-group" style="margin-bottom:0">' +
        '<label class="form-label">Widget title</label>' +
        '<input type="text" class="form-input" id="aw-title" placeholder="e.g. Revenue by Category" />' +
      '</div>' +
      '<div class="form-group" style="margin-bottom:0">' +
        '<label class="form-label">View type</label>' +
        '<div class="widget-type-grid" style="display:flex;gap:6px">' + typeCards + '</div>' +
      '</div>' +
      '<div class="form-group" style="margin-bottom:0">' +
        '<label class="form-label">Dataset</label>' +
        '<select class="form-select" id="aw-dataset"><option value="">Select dataset\u2026</option></select>' +
      '</div>' +
      '<div class="form-group" style="margin-bottom:0">' +
        '<label class="form-label">X Axis (dimension)</label>' +
        '<select class="form-select" id="aw-xaxis"><option value="">Select column\u2026</option></select>' +
      '</div>' +
      '<div class="form-group" style="margin-bottom:0">' +
        '<label class="form-label">Y Axis (measure)</label>' +
        '<select class="form-select" id="aw-yaxis"><option value="">Select column\u2026</option></select>' +
      '</div>' +
    '</div>';
  }

  function _buildModalHTML() {
    return '<div class="modal" id="add-widget-modal" style="width:760px;max-width:96vw">' +
      '<div class="modal__header">' +
        '<span class="modal__title">Add Widget</span>' +
        '<button class="btn-icon modal-close-btn" title="Close">' + _closeSvg + '</button>' +
      '</div>' +
      '<div class="modal__body" style="display:flex;gap:16px;padding:16px">' +
        _buildFormHTML() +
        '<div class="add-widget-preview" style="width:300px;flex-shrink:0;overflow:hidden;min-height:220px">' +
        '</div>' +
      '</div>' +
      '<div class="modal__footer">' +
        '<button class="btn btn--ghost modal-close-btn">Cancel</button>' +
        '<button class="btn btn--primary" id="aw-add-btn">Add to Dashboard</button>' +
      '</div>' +
    '</div>';
  }

  /* ── Preview ── */

  function _getViewIcon(view) {
    var icons = {
      bar:   '<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"><rect x="1" y="6" width="3.5" height="9" rx="1"/><rect x="6.25" y="3" width="3.5" height="12" rx="1"/><rect x="11.5" y="8" width="3.5" height="7" rx="1"/></svg>',
      line:  '<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="1,12 4.5,6 8,9 11.5,4 15,6"/></svg>',
      pie:   '<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M8 8 L8 1.5 A6.5 6.5 0 0 1 14.5 8 Z" fill="currentColor" opacity="0.3" stroke="none"/><circle cx="8" cy="8" r="6.5"/></svg>',
      table: '<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="1" y="1" width="6" height="6" rx="1"/><rect x="9" y="1" width="6" height="6" rx="1"/><rect x="1" y="9" width="6" height="6" rx="1"/><rect x="9" y="9" width="6" height="6" rx="1"/></svg>'
    };
    return icons[view] || icons.bar;
  }

  function _updatePreview($previewEl, config) {
    var dataset = (window.DatasetStore && config.pipelineOutputId)
      ? DatasetStore.get(config.pipelineOutputId)
      : null;

    if (!dataset || !dataset.length) {
      $previewEl.html(
        '<div class="widget-card" style="height:220px">' +
          '<div class="widget-card__header">' +
            '<span class="widget-card__title" style="color:var(--color-text-3)">Preview</span>' +
            '<div class="widget-card__actions"><span class="widget-card__icon">' + _getViewIcon(config.view || 'bar') + '</span></div>' +
          '</div>' +
          '<div class="widget-card__body" style="display:flex;align-items:center;justify-content:center">' +
            '<span style="color:#8F8F8F;font-size:12px;text-align:center;padding:12px">Select a dataset to preview</span>' +
          '</div>' +
        '</div>'
      );
      return;
    }

    /* Rebuild card shell if view changed or not yet rendered */
    var $card = $previewEl.find('.widget-card');
    var icon  = _getViewIcon(config.view || 'bar');

    if (!$card.length) {
      $previewEl.html(
        '<div class="widget-card" style="height:220px">' +
          '<div class="widget-card__header">' +
            '<span class="widget-card__title preview-card-title">Preview</span>' +
            '<div class="widget-card__actions"><span class="widget-card__icon preview-card-icon">' + icon + '</span></div>' +
          '</div>' +
          '<div class="widget-card__body">' +
            '<div class="preview-widget-host" style="width:100%;height:100%"></div>' +
          '</div>' +
        '</div>'
      );
      $card = $previewEl.find('.widget-card');
    } else {
      /* Update icon in place */
      $card.find('.preview-card-icon').html(icon);
    }

    var $host = $card.find('.preview-widget-host');

    if ($host.data('vibeDataWidget')) {
      try {
        $host.dataWidget('option', 'dataset', dataset);
        $host.dataWidget('option', 'view', config.view || 'bar');
        return;
      } catch (e) {}
    }

    try {
      $host.dataWidget({
        dataset: dataset,
        xAxis:   config.xAxis  || 'category',
        yAxis:   config.yAxis  || 'amount',
        view:    config.view   || 'bar',
        title:   '',
        size:    'sm'
      });
    } catch (e) {
      $previewEl.html(
        '<div style="padding:12px;color:#8F8F8F;font-size:12px">Preview unavailable</div>'
      );
    }
  }

  /* ── Data helpers ── */

  function _getConfig($modal) {
    return {
      pipelineOutputId: $modal.find('#aw-dataset').val(),
      view:   _selectedView,
      xAxis:  $modal.find('#aw-xaxis').val(),
      yAxis:  $modal.find('#aw-yaxis').val()
    };
  }

  function _populateDatasets($modal) {
    if (!window.DatasetStore) return;
    var $sel = $modal.find('#aw-dataset');
    DatasetStore.list().forEach(function (d) {
      var label = String(d.name) + ' (' + String(d.type) + ', ' + String(d.rows) + ' rows)';
      $sel.append($('<option>').val(d.id).text(label));
    });
  }

  function _populateAxes($modal, datasetId) {
    var cols = window.DatasetStore ? DatasetStore.getColumns(datasetId) : [];
    var $x = $modal.find('#aw-xaxis').empty().append($('<option>').val('').text('Select column\u2026'));
    var $y = $modal.find('#aw-yaxis').empty().append($('<option>').val('').text('Select column\u2026'));
    cols.forEach(function (c) {
      $x.append($('<option>').val(c).text(c));
      $y.append($('<option>').val(c).text(c));
    });
  }

  /* ── Events ── */

  function _bindEvents($overlay, $modal) {
    var $preview = $modal.find('.add-widget-preview');

    $overlay.on('click', function (e) {
      if ($(e.target).is('#add-widget-overlay')) close();
    });
    $modal.on('click', '.modal-close-btn', function () { close(); });

    $modal.on('click', '.widget-type-card', function () {
      $modal.find('.widget-type-card').removeClass('is-selected');
      $(this).addClass('is-selected');
      _selectedView = $(this).data('view');
      _updatePreview($preview, _getConfig($modal));
    });

    $modal.on('change', '#aw-dataset', function () {
      _populateAxes($modal, $(this).val());
      _updatePreview($preview, _getConfig($modal));
    });

    $modal.on('change', '#aw-xaxis, #aw-yaxis', function () {
      _updatePreview($preview, _getConfig($modal));
    });

    $modal.on('click', '#aw-add-btn', function () { _submit($modal); });
  }

  function _submit($modal) {
    var datasetId = $modal.find('#aw-dataset').val();
    var xAxis     = $modal.find('#aw-xaxis').val();
    var yAxis     = $modal.find('#aw-yaxis').val();
    var title     = $modal.find('#aw-title').val().trim();

    if (!datasetId) { if (window.Toast) Toast.error('Please select a dataset'); return; }
    if (!xAxis)     { if (window.Toast) Toast.error('Please select X axis'); return; }
    if (!yAxis)     { if (window.Toast) Toast.error('Please select Y axis'); return; }

    var config = {
      id:               window.LayoutStore ? LayoutStore.generateId() : ('w-' + Date.now()),
      title:            title || (_selectedView + ' \u2014 ' + datasetId),
      pipelineOutputId: datasetId,
      view:             _selectedView,
      xAxis:            xAxis,
      yAxis:            yAxis,
      x: 0, y: 0, w: 6, h: 5
    };

    close();
    _onAdd(config);
  }

  return { open: open, close: close };
}());

window.AddWidgetModal = AddWidgetModal;
