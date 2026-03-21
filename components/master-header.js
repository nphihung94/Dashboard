/**
 * master-header.js
 * Renders the 42px master header into .app-header.
 * Contains: logo, search bar (Cmd+K), New Dashboard CTA,
 * reminder/notification badges, user avatar.
 *
 * API:
 *   VibeMasterHeader.render($el)
 */

var VibeMasterHeader = (function () {
  'use strict';

  var _svgs = {
    search: '<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><circle cx="6.5" cy="6.5" r="4.5"/><line x1="10" y1="10" x2="14" y2="14"/></svg>',
    bell:   '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M8 1.5a4.5 4.5 0 014.5 4.5c0 2.5.8 4 1.5 5H2c.7-1 1.5-2.5 1.5-5A4.5 4.5 0 018 1.5z"/><path d="M6.5 13a1.5 1.5 0 003 0"/></svg>',
    clock:  '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><circle cx="8" cy="8" r="6.5"/><polyline points="8,4.5 8,8 10.5,10"/></svg>',
    logo:   '<svg width="14" height="14" viewBox="0 0 16 16" fill="white"><rect x="2" y="2" width="5" height="5" rx="1"/><rect x="9" y="2" width="5" height="5" rx="1"/><rect x="2" y="9" width="5" height="5" rx="1"/><rect x="9" y="9" width="5" height="5" rx="1"/></svg>'
  };

  function render($el) {
    $el.html(
      /* Logo */
      '<a class="header__logo" href="#dashboard">' +
        '<div class="header__logo-icon">' + _svgs.logo + '</div>' +
        '<span class="header__logo-name">Vibe Dashboard</span>' +
      '</a>' +

      /* Divider */
      '<div class="divider"></div>' +

      /* Search bar */
      '<div class="header__search">' +
        '<span class="header__search-icon">' + _svgs.search + '</span>' +
        '<input type="text" class="header__search-input" id="header-search-input"' +
          ' placeholder="Search pipelines, datasets..." readonly />' +
        '<span class="header__search-kbd">&#8984;K</span>' +
      '</div>' +

      /* Right spacer */
      '<span class="header__spacer"></span>' +

      /* Utility buttons */
      '<div class="header__utils">' +
        '<button class="util-btn" id="btn-reminders" title="Reminders">' +
          _svgs.clock +
          '<span class="util-badge"></span>' +
        '</button>' +

        '<button class="util-btn" id="btn-notifications" title="Notifications">' +
          _svgs.bell +
          '<span class="util-badge"></span>' +
        '</button>' +

        '<div class="divider"></div>' +

        '<div class="user-avatar" title="Account">AB</div>' +
      '</div>'
    );

    _bindEvents($el);
  }

  function _bindEvents($el) {
    $el.on('click', '#header-search-input', function (e) {
      e.preventDefault();
      if (window.SearchOverlay) SearchOverlay.open();
    });

    $el.on('click', '#btn-notifications', function () {
      if (window.Toast) Toast.info('No new notifications');
    });

    $el.on('click', '#btn-reminders', function () {
      if (window.Toast) Toast.info('No pending reminders');
    });

    $el.on('click', '.header__logo', function (e) {
      e.preventDefault();
      location.hash = '#dashboard';
    });
  }

  return { render: render };
}());

window.VibeMasterHeader = VibeMasterHeader;
