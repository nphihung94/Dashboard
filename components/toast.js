/**
 * toast.js
 * Lightweight toast notification utility.
 * Appends toast elements to #toast-container.
 *
 * API:
 *   Toast.show(message, type)  — type: 'success'|'error'|'info'|'warn'
 *   Toast.success(message)
 *   Toast.error(message)
 *   Toast.info(message)
 */

var Toast = (function () {
  'use strict';

  var AUTO_DISMISS_MS = 3500;

  var _icons = {
    success: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="2,8 6,12 14,4"/></svg>',
    error:   '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="4" y1="4" x2="12" y2="12"/><line x1="12" y1="4" x2="4" y2="12"/></svg>',
    info:    '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="8" cy="8" r="6"/><line x1="8" y1="7" x2="8" y2="11"/><circle cx="8" cy="5" r="0.5" fill="currentColor"/></svg>',
    warn:    '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 2 L14 13 H2 Z"/><line x1="8" y1="7" x2="8" y2="10"/><circle cx="8" cy="12" r="0.5" fill="currentColor"/></svg>'
  };

  /**
   * Show a toast notification.
   * @param {string} message
   * @param {string} [type='info']  — 'success'|'error'|'info'|'warn'
   */
  function show(message, type) {
    type = type || 'info';
    var $container = $('#toast-container');
    if (!$container.length) return;

    var $toast = $('<div class="toast toast--' + type + '"></div>');
    $toast.html(
      '<span class="toast__icon">' + (_icons[type] || _icons.info) + '</span>' +
      '<span class="toast__message">' + $('<span>').text(message).html() + '</span>'
    );

    $container.append($toast);

    // Auto-dismiss
    var timer = setTimeout(function () { _dismiss($toast); }, AUTO_DISMISS_MS);

    // Click to dismiss immediately
    $toast.on('click', function () {
      clearTimeout(timer);
      _dismiss($toast);
    });
  }

  function _dismiss($toast) {
    $toast.css({ opacity: 0, transform: 'translateX(20px)', transition: 'opacity 0.2s, transform 0.2s' });
    setTimeout(function () { $toast.remove(); }, 220);
  }

  function success(msg) { show(msg, 'success'); }
  function error(msg)   { show(msg, 'error'); }
  function info(msg)    { show(msg, 'info'); }
  function warn(msg)    { show(msg, 'warn'); }

  return { show: show, success: success, error: error, info: info, warn: warn };
}());

window.Toast = Toast;
