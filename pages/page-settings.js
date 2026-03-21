/**
 * page-settings.js
 * Settings page — placeholder with localStorage management utilities.
 *
 * API:
 *   PageSettings.render($container)
 *   PageSettings.destroy()
 */

var PageSettings = (function () {
  'use strict';

  function render($container) {
    $container.html(
      '<div class="page-header">' +
        '<div class="page-header__breadcrumb">Home › Settings</div>' +
        '<div class="page-header__title">Settings</div>' +
      '</div>' +
      '<div class="page-content">' +
        '<div class="card" style="max-width:600px">' +
          '<div class="card__header"><div class="card__title">General Settings</div></div>' +
          '<div class="card__body">' +
            '<p style="color:var(--color-text-3);font-size:13px;margin-bottom:var(--spacing-20)">' +
              'Settings coming soon. Use the options below to manage your local data.' +
            '</p>' +

            '<div class="form-group">' +
              '<label class="form-label">Theme</label>' +
              '<select class="form-select" style="max-width:200px" disabled>' +
                '<option>Light (default)</option>' +
                '<option>Dark</option>' +
              '</select>' +
            '</div>' +

            '<div class="form-group">' +
              '<label class="form-label">Default dashboard view</label>' +
              '<select class="form-select" style="max-width:200px" disabled>' +
                '<option>Dashboard</option>' +
                '<option>Home</option>' +
              '</select>' +
            '</div>' +
          '</div>' +
        '</div>' +

        '<div class="card danger-zone" style="max-width:600px;margin-top:var(--spacing-16)">' +
          '<div class="card__header"><div class="card__title" style="color:var(--color-error-text)">Danger Zone</div></div>' +
          '<div class="card__body">' +
            '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:var(--spacing-12)">' +
              '<div>' +
                '<div style="font-size:13px;font-weight:500">Reset dashboard layout</div>' +
                '<div style="font-size:12px;color:var(--color-text-3);margin-top:2px">Removes all widgets and resets to defaults.</div>' +
              '</div>' +
              '<button class="btn btn--danger btn--sm" id="btn-reset-layout">Reset Layout</button>' +
            '</div>' +
            '<div style="display:flex;align-items:center;justify-content:space-between">' +
              '<div>' +
                '<div style="font-size:13px;font-weight:500">Clear all pipeline configs</div>' +
                '<div style="font-size:12px;color:var(--color-text-3);margin-top:2px">Deletes saved pipeline configurations from localStorage.</div>' +
              '</div>' +
              '<button class="btn btn--danger btn--sm" id="btn-clear-pipelines">Clear Pipelines</button>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>'
    );

    _bindEvents($container);
  }

  function _bindEvents($container) {
    $container.on('click', '#btn-reset-layout', function () {
      if (!confirm('Reset dashboard layout to defaults?')) return;
      localStorage.removeItem('vibe-dashboard-layout');
      if (window.Toast) Toast.success('Layout reset — reload to apply');
    });

    $container.on('click', '#btn-clear-pipelines', function () {
      if (!confirm('Clear all pipeline configurations? This cannot be undone.')) return;
      localStorage.removeItem('vibe-dashboard-pipelines');
      localStorage.removeItem('vibe-dashboard-runlogs');
      if (window.Toast) Toast.success('Pipeline configs cleared — reload to apply');
    });
  }

  function destroy() {}

  return { render: render, destroy: destroy };
}());

window.PageSettings = PageSettings;
