/**
 * new-dashboard-modal.js
 * Simple modal for creating a new dashboard.
 * Renders a name input + Create button, delegates to DashboardStore.create().
 *
 * API:
 *   NewDashboardModal.open(onCreated)
 *     onCreated(dashboard) — called after creation; navigation handled internally.
 */

var NewDashboardModal = (function () {
  'use strict';

  var _plusSvg = '<svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="8" y1="2" x2="8" y2="14"/><line x1="2" y1="8" x2="14" y2="8"/></svg>';

  var _icons = [
    { key: 'grid',  svg: '<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><rect x="1" y="1" width="5" height="5" rx="1"/><rect x="10" y="1" width="5" height="5" rx="1"/><rect x="1" y="10" width="5" height="5" rx="1"/><rect x="10" y="10" width="5" height="5" rx="1"/></svg>' },
    { key: 'bar',   svg: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="1" y="6" width="3" height="9" rx="1"/><rect x="6" y="3" width="3" height="12" rx="1"/><rect x="11" y="8" width="3" height="7" rx="1"/></svg>' },
    { key: 'line',  svg: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><polyline points="1,12 5,6 8,9 12,4 15,7"/></svg>' },
    { key: 'pie',   svg: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M8 8L8 1.5A6.5 6.5 0 0 1 14.5 8Z" fill="currentColor" opacity="0.3" stroke="none"/><circle cx="8" cy="8" r="6.5"/></svg>' },
    { key: 'table', svg: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="1" y="1" width="14" height="14" rx="1"/><line x1="1" y1="5" x2="15" y2="5"/><line x1="6" y1="5" x2="6" y2="15"/></svg>' },
    { key: 'star',  svg: '<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M8 1l1.8 4H14l-3.4 2.5 1.3 4L8 9l-3.9 2.5 1.3-4L2 5h4.2z"/></svg>' }
  ];

  var _colors = ['#1E88E5', '#43A047', '#E53935', '#FB8C00', '#8E24AA', '#546E7A'];

  var _selectedIcon  = 'grid';
  var _selectedColor = '#1E88E5';

  function _buildIconPickerHtml() {
    var btns = _icons.map(function (ic) {
      return '<button class="icon-picker__btn' + (ic.key === _selectedIcon ? ' is-selected' : '') + '" data-icon="' + ic.key + '" title="' + ic.key + '" type="button">' + ic.svg + '</button>';
    }).join('');
    return '<div class="form-group">' +
      '<label class="form-label">Icon</label>' +
      '<div class="icon-picker" id="nd-icon-picker">' + btns + '</div>' +
    '</div>';
  }

  function _buildColorPickerHtml() {
    var swatches = _colors.map(function (c) {
      return '<button class="color-picker__swatch' + (c === _selectedColor ? ' is-selected' : '') + '" data-color="' + c + '" style="background:' + c + '" title="' + c + '" type="button"></button>';
    }).join('');
    return '<div class="form-group">' +
      '<label class="form-label">Color</label>' +
      '<div class="color-picker" id="nd-color-picker">' + swatches + '</div>' +
    '</div>';
  }

  function open(onCreated) {
    _destroy();
    _selectedIcon  = 'grid';
    _selectedColor = '#1E88E5';

    var overlay = $(
      '<div class="modal-overlay" id="new-dashboard-overlay">' +
        '<div class="modal" style="max-width:400px;width:100%">' +
          '<div class="modal__header">' +
            '<span class="modal__title">New Dashboard</span>' +
            '<button class="btn-icon modal__close" id="new-dashboard-close" title="Close">' +
              '<svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="1" y1="1" x2="13" y2="13"/><line x1="13" y1="1" x2="1" y2="13"/></svg>' +
            '</button>' +
          '</div>' +
          '<div class="modal__body">' +
            '<div class="form-group">' +
              '<label class="form-label" for="new-dashboard-name">Dashboard name</label>' +
              '<input type="text" class="form-input" id="new-dashboard-name" placeholder="My Dashboard" autocomplete="off" />' +
            '</div>' +
            _buildIconPickerHtml() +
            _buildColorPickerHtml() +
            '<div class="form-group" style="margin-bottom:0">' +
              '<label class="form-label" for="new-dashboard-desc">Description <span style="font-weight:400;color:var(--color-text-3)">(optional)</span></label>' +
              '<textarea class="form-input" id="new-dashboard-desc" placeholder="What is this dashboard about?" rows="3" style="resize:vertical;min-height:64px"></textarea>' +
            '</div>' +
          '</div>' +
          '<div class="modal__footer">' +
            '<button class="btn btn--ghost" id="new-dashboard-cancel">Cancel</button>' +
            '<button class="btn btn--primary" id="new-dashboard-submit">' + _plusSvg + ' Create</button>' +
          '</div>' +
        '</div>' +
      '</div>'
    );

    $('body').append(overlay);

    /* Focus the input */
    setTimeout(function () {
      $('#new-dashboard-name').focus();
    }, 50);

    /* Bind events */
    overlay.on('click', '#new-dashboard-close, #new-dashboard-cancel', function () {
      _destroy();
    });

    overlay.on('click', '.modal-overlay', function (e) {
      if ($(e.target).hasClass('modal-overlay')) _destroy();
    });

    overlay.on('click', '.icon-picker__btn', function () {
      _selectedIcon = $(this).data('icon');
      overlay.find('.icon-picker__btn').removeClass('is-selected');
      $(this).addClass('is-selected');
    });

    overlay.on('click', '.color-picker__swatch', function () {
      _selectedColor = $(this).data('color');
      overlay.find('.color-picker__swatch').removeClass('is-selected');
      $(this).addClass('is-selected');
    });

    overlay.on('click', '#new-dashboard-submit', function () {
      _submit(onCreated);
    });

    overlay.on('keydown', '#new-dashboard-name', function (e) {
      if (e.key === 'Enter') _submit(onCreated);
      if (e.key === 'Escape') _destroy();
    });
  }

  function _submit(onCreated) {
    var name = $('#new-dashboard-name').val().trim();
    if (!name) {
      $('#new-dashboard-name').focus();
      return;
    }

    if (!window.DashboardStore) {
      console.error('[NewDashboardModal] DashboardStore not available');
      _destroy();
      return;
    }

    var description = $('#new-dashboard-desc').val().trim();
    var dashboard = DashboardStore.create(name, description, _selectedIcon, _selectedColor);
    _destroy();

    if (typeof onCreated === 'function') onCreated(dashboard);
    location.hash = '#dashboard/' + dashboard.id;
  }

  function _destroy() {
    $('#new-dashboard-overlay').remove();
  }

  return { open: open };
}());

window.NewDashboardModal = NewDashboardModal;
