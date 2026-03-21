/**
 * dashboard-permission-modal.js
 * Share dialog for a single dashboard.
 * Sections: shareable-link toggle, people-with-access list, invite form.
 *
 * API:
 *   DashboardPermissionModal.open(dashboardId)
 */

var DashboardPermissionModal = (function () {
  'use strict';

  var _dashboardId = null;

  /* ── Public ── */

  function open(dashboardId) {
    _destroy();
    _dashboardId = dashboardId;
    var db = window.DashboardStore ? DashboardStore.get(dashboardId) : null;
    if (!db) return;

    var overlay = $(
      '<div class="modal-overlay" id="perm-modal-overlay">' +
        '<div class="modal" style="max-width:480px;width:100%">' +
          '<div class="modal__header">' +
            '<span class="modal__title">Share &ldquo;' + _esc(db.name) + '&rdquo;</span>' +
            '<button class="btn-icon modal__close" id="perm-modal-close" title="Close">' +
              '<svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="1" y1="1" x2="13" y2="13"/><line x1="13" y1="1" x2="1" y2="13"/></svg>' +
            '</button>' +
          '</div>' +
          '<div class="modal__body" id="perm-modal-body"></div>' +
          '<div class="modal__footer">' +
            '<button class="btn btn--ghost" id="perm-modal-done">Done</button>' +
          '</div>' +
        '</div>' +
      '</div>'
    );

    $('body').append(overlay);
    _renderBody(db);
    _bindStaticEvents(overlay);
  }

  /* ── Body rendering (re-rendered on state changes) ── */

  function _renderBody(db) {
    var $body = $('#perm-modal-body');
    if (!$body.length) return;

    var hasToken = !!(db.sharedToken);
    var shareUrl = hasToken
      ? (location.origin + location.pathname + '#dashboard/' + db.id + '?token=' + db.sharedToken)
      : '';

    var html = '';

    /* Section 1: Shareable link */
    html += '<div style="margin-bottom:var(--spacing-16)">';
    html += '<div class="share-toggle-row">' +
      '<input type="checkbox" class="share-toggle" id="share-toggle"' + (hasToken ? ' checked' : '') + ' />' +
      '<label for="share-toggle" style="cursor:pointer;font-size:var(--font-size-sm);color:var(--color-text-2)">Enable shareable link (read-only)</label>' +
      '</div>';

    if (hasToken) {
      html += '<div class="share-link-row">' +
        '<input type="text" class="share-link-input" id="share-link-url" readonly value="' + _esc(shareUrl) + '" />' +
        '<button class="btn btn--ghost btn--sm" id="btn-copy-link">Copy</button>' +
        '</div>';
    }
    html += '</div>';

    /* Section 2: People with access */
    html += '<div style="margin-bottom:var(--spacing-12)">';
    html += '<div style="font-size:var(--font-size-sm);font-weight:600;color:var(--color-text-2);margin-bottom:var(--spacing-8)">People with access</div>';
    html += '<div class="permission-list" id="perm-people-list">';
    html += _buildPeopleList(db);
    html += '</div>';
    html += '</div>';

    /* Section 3: Invite */
    html += '<div>';
    html += '<div style="font-size:var(--font-size-sm);font-weight:600;color:var(--color-text-2);margin-bottom:var(--spacing-8)">Invite people</div>';
    html += '<div style="display:flex;gap:var(--spacing-8);align-items:flex-start">';
    html += '<input type="email" class="form-input" id="invite-email" placeholder="email@example.com" style="flex:1" />';
    html += '<select class="form-select" id="invite-role" style="width:90px">' +
      '<option value="editor">Editor</option>' +
      '<option value="viewer">Viewer</option>' +
      '</select>';
    html += '<button class="btn btn--primary btn--sm" id="btn-invite" style="white-space:nowrap">Invite</button>';
    html += '</div>';
    html += '<div id="invite-error" style="font-size:var(--font-size-xs);color:var(--color-error-text);margin-top:4px;min-height:16px"></div>';
    html += '</div>';

    $body.html(html);
    _bindBodyEvents($body, db);
  }

  function _buildPeopleList(db) {
    if (!db.permissions || !db.permissions.length) return '';
    var parts = [];
    db.permissions.forEach(function (perm) {
      var initials = _initials(perm.userId);
      var isOwner  = (perm.role === 'owner');
      var roleOptions = isOwner
        ? '<span class="badge badge--blue" style="font-size:10px">' + perm.role + '</span>'
        : ('<select class="permission-role-select" data-uid="' + _esc(perm.userId) + '">' +
            '<option value="editor"' + (perm.role === 'editor' ? ' selected' : '') + '>Editor</option>' +
            '<option value="viewer"' + (perm.role === 'viewer' ? ' selected' : '') + '>Viewer</option>' +
          '</select>');

      var removeBtn = isOwner
        ? ''
        : '<button class="btn-icon btn--sm perm-remove-btn" data-uid="' + _esc(perm.userId) + '" title="Remove" style="flex-shrink:0">' +
            '<svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="1" y1="1" x2="13" y2="13"/><line x1="13" y1="1" x2="1" y2="13"/></svg>' +
          '</button>';

      parts.push(
        '<div class="permission-item">' +
          '<div class="permission-avatar">' + initials + '</div>' +
          '<span class="permission-email">' + _esc(perm.userId) + '</span>' +
          roleOptions +
          removeBtn +
        '</div>'
      );
    });
    return parts.join('');
  }

  /* ── Event binding ── */

  function _bindStaticEvents(overlay) {
    overlay.on('click', '#perm-modal-close, #perm-modal-done', function () {
      _destroy();
    });

    overlay.on('click', '.modal-overlay', function (e) {
      if ($(e.target).hasClass('modal-overlay')) _destroy();
    });
  }

  function _bindBodyEvents($body, db) {
    /* Share toggle */
    $body.on('change', '#share-toggle', function () {
      if ($(this).is(':checked')) {
        DashboardStore.generateShareToken(db.id);
      } else {
        DashboardStore.revokeShareToken(db.id);
      }
      var updated = DashboardStore.get(db.id);
      _renderBody(updated);
    });

    /* Copy link */
    $body.on('click', '#btn-copy-link', function () {
      var url = $('#share-link-url').val();
      if (!url) return;
      try {
        navigator.clipboard.writeText(url).then(function () {
          if (window.Toast) Toast.success('Link copied to clipboard');
        }).catch(function () {
          if (window.Toast) Toast.warn('Copy failed — please copy manually: ' + url);
        });
      } catch (e) {
        /* Fallback: select text */
        $('#share-link-url').select();
        if (window.Toast) Toast.info('Press Ctrl+C to copy');
      }
    });

    /* Role change */
    $body.on('change', '.permission-role-select', function () {
      var uid  = $(this).data('uid');
      var role = $(this).val();
      DashboardStore.addPermission(db.id, uid, role);
    });

    /* Remove person */
    $body.on('click', '.perm-remove-btn', function () {
      var uid = $(this).data('uid');
      DashboardStore.removePermission(db.id, uid);
      var updated = DashboardStore.get(db.id);
      $('#perm-people-list').html(_buildPeopleList(updated));
    });

    /* Invite */
    $body.on('click', '#btn-invite', function () {
      _doInvite(db);
    });

    $body.on('keydown', '#invite-email', function (e) {
      if (e.key === 'Enter') _doInvite(db);
    });
  }

  function _doInvite(db) {
    var email = $('#invite-email').val().trim();
    var role  = $('#invite-role').val();
    var $err  = $('#invite-error');
    $err.text('');

    /* Simple email validation */
    if (!email || !(/^[^\s@]+@[^\s@]+\.[^\s@]+$/).test(email)) {
      $err.text('Enter a valid email address.');
      return;
    }

    /* Prevent duplicate */
    var existing = db.permissions.filter(function (p) { return p.userId === email; });
    if (existing.length) {
      $err.text('This person already has access.');
      return;
    }

    DashboardStore.addPermission(db.id, email, role);
    var updated = DashboardStore.get(db.id);
    $('#invite-email').val('');
    $('#perm-people-list').html(_buildPeopleList(updated));
    if (window.Toast) Toast.success('Invite sent to ' + email);
    /* Re-fetch db so subsequent duplicate-check uses fresh permissions */
    db = updated;
  }

  /* ── Helpers ── */

  function _initials(userId) {
    if (!userId) return '?';
    /* Use first two chars of the part before @ for emails, else first two of string */
    var base = userId.split('@')[0];
    return base.slice(0, 2).toUpperCase();
  }

  function _esc(str) {
    return $('<span>').text(str || '').html();
  }

  function _destroy() {
    $('#perm-modal-overlay').remove();
    _dashboardId = null;
  }

  return { open: open };
}());

window.DashboardPermissionModal = DashboardPermissionModal;
