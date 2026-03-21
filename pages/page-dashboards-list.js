/**
 * page-dashboards-list.js
 * Dashboard listing page — sub-header search, 2-section layout (recently opened +
 * all dashboards with role-pill filter), slide-in filter panel.
 *
 * API:
 *   PageDashboardsList.render($container)
 */

var PageDashboardsList = (function () {
  'use strict';

  var _$container  = null;
  var _roleFilter  = 'all';            /* 'all' | 'mine' | 'shared' */
  var _searchQuery = '';
  var _sortBy      = 'lastOpened';     /* 'lastOpened' | 'updated' | 'created' | 'name' */
  var _filters     = { roles: [], widgetSize: '' };
  var _filterOpen  = false;

  /* SVG icons */
  var _pencilSvg = '<svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M11.5 2.5l2 2L5 13H3v-2L11.5 2.5z"/></svg>';
  var _trashSvg  = '<svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="2,4 14,4"/><path d="M5 4V2h6v2"/><path d="M3 4l1 10h8l1-10"/></svg>';
  var _shareSvg  = '<svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="3" r="1.5"/><circle cx="12" cy="13" r="1.5"/><circle cx="3" cy="8" r="1.5"/><line x1="4.5" y1="7" x2="10.5" y2="4"/><line x1="4.5" y1="9" x2="10.5" y2="12"/></svg>';
  var _filterSvg = '<svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><line x1="2" y1="4" x2="14" y2="4"/><line x1="4" y1="8" x2="12" y2="8"/><line x1="6" y1="12" x2="10" y2="12"/></svg>';
  var _searchSvg = '<svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><circle cx="6.5" cy="6.5" r="4.5"/><line x1="10" y1="10" x2="14" y2="14"/></svg>';
  var _closeSvg  = '<svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="4" y1="4" x2="12" y2="12"/><line x1="12" y1="4" x2="4" y2="12"/></svg>';
  var _gridSvg   = '<svg width="18" height="18" viewBox="0 0 16 16" fill="currentColor" opacity="0.7"><rect x="1" y="1" width="5" height="5" rx="1"/><rect x="10" y="1" width="5" height="5" rx="1"/><rect x="1" y="10" width="5" height="5" rx="1"/><rect x="10" y="10" width="5" height="5" rx="1"/></svg>';

  /* Icon SVG map — keyed by icon key stored on dashboard */
  var _iconSvgs = {
    grid:  '<svg width="20" height="20" viewBox="0 0 16 16" fill="currentColor"><rect x="1" y="1" width="5" height="5" rx="1"/><rect x="10" y="1" width="5" height="5" rx="1"/><rect x="1" y="10" width="5" height="5" rx="1"/><rect x="10" y="10" width="5" height="5" rx="1"/></svg>',
    bar:   '<svg width="20" height="20" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="1" y="6" width="3" height="9" rx="1"/><rect x="6" y="3" width="3" height="12" rx="1"/><rect x="11" y="8" width="3" height="7" rx="1"/></svg>',
    line:  '<svg width="20" height="20" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><polyline points="1,12 5,6 8,9 12,4 15,7"/></svg>',
    pie:   '<svg width="20" height="20" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M8 8L8 1.5A6.5 6.5 0 0 1 14.5 8Z" fill="currentColor" opacity="0.3" stroke="none"/><circle cx="8" cy="8" r="6.5"/></svg>',
    table: '<svg width="20" height="20" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="1" y="1" width="14" height="14" rx="1"/><line x1="1" y1="5" x2="15" y2="5"/><line x1="6" y1="5" x2="6" y2="15"/></svg>',
    star:  '<svg width="20" height="20" viewBox="0 0 16 16" fill="currentColor"><path d="M8 1l1.8 4H14l-3.4 2.5 1.3 4L8 9l-3.9 2.5 1.3-4L2 5h4.2z"/></svg>'
  };


  /* ── Public ── */

  function render($container) {
    _$container = $container;
    _renderPage();
  }

  /* ── Render ── */

  function _renderPage() {
    if (!_$container) return;
    var dashboards = window.DashboardStore ? DashboardStore.list() : [];

    var activeCount = _countActiveFilters();
    var badgeHtml = activeCount > 0
      ? '<span class="dl-filter-badge">' + activeCount + '</span>'
      : '';

    _$container.html(
      '<div class="page-header">' +
        '<div class="page-header__breadcrumb"><a href="#home">Home</a> \u203a Dashboards</div>' +
        '<div class="page-header__title">Dashboards</div>' +
        '<div class="page-header__actions">' +
          '<button class="btn btn--primary dl-new-btn" id="dl-new-btn">' +
            '<svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="8" y1="2" x2="8" y2="14"/><line x1="2" y1="8" x2="14" y2="8"/></svg>' +
            ' New Dashboard' +
          '</button>' +
        '</div>' +
      '</div>' +
      '<div class="page-content">' +
        _buildRecentSection() +
        _buildAllDashboardsSection(dashboards, activeCount, badgeHtml) +
      '</div>'
    );

    _bindEvents(_$container);
  }

  /* ── Recently opened section ── */

  function _buildRecentSection() {
    var recent = window.DashboardStore ? DashboardStore.getRecentlyOpened(5) : [];
    if (!recent.length) return '';

    var cards = recent.map(function (db) {
      var opened    = _timeAgo(db.lastOpenedAt);
      var iconKey   = db.icon || 'grid';
      var iconColor = db.iconColor || '#1E88E5';
      var iconSvg   = _iconSvgs[iconKey] || _iconSvgs.grid;
      return '<div class="dl-recent-card" data-id="' + db.id + '">' +
        '<div class="dl-recent-card__icon" style="background:' + iconColor + '20;color:' + iconColor + '">' + iconSvg + '</div>' +
        '<div class="dl-recent-card__name">' + _esc(db.name) + '</div>' +
        '<div class="dl-recent-card__meta">' + opened + '</div>' +
      '</div>';
    }).join('');

    return '<div class="dl-section">' +
      '<div class="dl-section__heading">Recently opened</div>' +
      '<div class="dl-recent-row">' + cards + '</div>' +
    '</div>';
  }

  /* ── All dashboards section ── */

  function _buildAllDashboardsSection(dashboards, activeCount, badgeHtml) {
    var badge = badgeHtml || '';
    return '<div class="dl-section">' +
      '<div class="dl-section__header">' +
        '<div class="dl-section__header-left">' +
          '<span class="dl-section__heading">All Dashboards</span>' +
          '<div class="dl-role-pills">' +
            _buildRolePill('all',    'All') +
            _buildRolePill('mine',   'Mine') +
            _buildRolePill('shared', 'Shared with me') +
          '</div>' +
        '</div>' +
        '<div class="dl-section__header-right">' +
          '<div class="dl-search">' +
            '<span class="dl-search__icon">' + _searchSvg + '</span>' +
            '<input type="text" class="dl-search__input" placeholder="Search\u2026" value="' + _esc(_searchQuery) + '" />' +
          '</div>' +
          '<button class="btn dl-filter-btn" id="dl-filter-btn">' +
            _filterSvg + ' Filter' + badge +
          '</button>' +
          '<div class="dl-sort-wrap">' +
            '<select class="dl-sort" id="dl-sort">' +
              '<option value="lastOpened"' + (_sortBy === 'lastOpened' ? ' selected' : '') + '>Last opened</option>' +
              '<option value="updated"'    + (_sortBy === 'updated'    ? ' selected' : '') + '>Last modified</option>' +
              '<option value="created"'    + (_sortBy === 'created'    ? ' selected' : '') + '>Date created</option>' +
              '<option value="name"'       + (_sortBy === 'name'       ? ' selected' : '') + '>Name A-Z</option>' +
            '</select>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<div id="dl-list-wrap">' + _buildList(dashboards) + '</div>' +
    '</div>';
  }

  function _buildRolePill(id, label) {
    return '<button class="dl-role-pill' + (_roleFilter === id ? ' is-active' : '') + '" data-role="' + id + '">' + label + '</button>';
  }

  /* ── Filter panel (slide-in) ── */

  function _openFilterPanel() {
    _filterOpen = true;
    $('#dl-filter-overlay').remove();

    var roleOptions = [
      { v: 'owner',  l: 'Owner' },
      { v: 'editor', l: 'Editor' },
      { v: 'viewer', l: 'Viewer' }
    ];
    var sizeOptions = [
      { v: '',       l: 'Any size' },
      { v: 'empty',  l: 'Empty (0 widgets)' },
      { v: 'small',  l: 'Small (1\u20135 widgets)' },
      { v: 'large',  l: 'Large (6+ widgets)' }
    ];

    var roleRows = roleOptions.map(function (o) {
      var chk = _filters.roles.indexOf(o.v) !== -1 ? ' checked' : '';
      return '<label class="dl-fp-option">' +
        '<input type="checkbox" name="fp-role" value="' + o.v + '"' + chk + '> ' +
        o.l +
      '</label>';
    }).join('');

    var sizeRows = sizeOptions.map(function (o) {
      return '<label class="dl-fp-option">' +
        '<input type="radio" name="fp-size" value="' + o.v + '"' + (_filters.widgetSize === o.v ? ' checked' : '') + '> ' +
        o.l +
      '</label>';
    }).join('');

    var $wrap = $(
      '<div id="dl-filter-overlay">' +
        '<div class="dl-fp-backdrop"></div>' +
        '<div class="dl-filter-panel">' +
          '<div class="dl-fp-header">' +
            '<span class="dl-fp-title">Filters</span>' +
            '<button class="btn-icon dl-fp-close">' + _closeSvg + '</button>' +
          '</div>' +
          '<div class="dl-fp-body">' +
            '<div class="dl-fp-section">' +
              '<div class="dl-fp-section-label">Role</div>' +
              '<p class="dl-fp-hint">Show only dashboards where I am:</p>' +
              roleRows +
            '</div>' +
            '<div class="dl-fp-section">' +
              '<div class="dl-fp-section-label">Widget count</div>' +
              sizeRows +
            '</div>' +
          '</div>' +
          '<div class="dl-fp-footer">' +
            '<button class="btn btn--ghost dl-fp-clear">Clear all</button>' +
            '<button class="btn btn--primary dl-fp-apply">Apply</button>' +
          '</div>' +
        '</div>' +
      '</div>'
    );

    $('body').append($wrap);

    /* Animate in */
    setTimeout(function () { $wrap.find('.dl-filter-panel').addClass('is-open'); }, 10);

    /* Events inside panel */
    $wrap.on('click', '.dl-fp-backdrop, .dl-fp-close', function () { _closeFilterPanel(); });
    $wrap.on('click', '.dl-fp-clear', function () {
      _filters = { roles: [], widgetSize: '' };
      _closeFilterPanel();
      _renderPage();
    });
    $wrap.on('click', '.dl-fp-apply', function () {
      /* Read roles */
      var roles = [];
      $wrap.find('input[name="fp-role"]:checked').each(function () { roles.push($(this).val()); });
      _filters.roles = roles;
      /* Read size */
      _filters.widgetSize = $wrap.find('input[name="fp-size"]:checked').val() || '';
      _closeFilterPanel();
      _renderPage();
    });
  }

  function _closeFilterPanel() {
    _filterOpen = false;
    var $panel = $('#dl-filter-overlay .dl-filter-panel');
    $panel.removeClass('is-open');
    setTimeout(function () { $('#dl-filter-overlay').remove(); }, 280);
  }

  /* ── List ── */

  function _buildList(dashboards) {
    var filtered = _filterAndSort(dashboards);
    if (!filtered.length) return _buildEmptyState();
    return filtered.map(function (db) { return _buildCard(db); }).join('');
  }

  function _filterAndSort(dashboards) {
    var list = dashboards.slice();

    /* Role filter replaces tab filter */
    if (_roleFilter === 'mine') {
      list = list.filter(function (d) {
        return window.DashboardStore && DashboardStore.getMyRole(d.id) === 'owner';
      });
    } else if (_roleFilter === 'shared') {
      list = list.filter(function (d) {
        var role = window.DashboardStore ? DashboardStore.getMyRole(d.id) : null;
        return role === 'editor' || role === 'viewer';
      });
    }
    /* 'all' = no role filter */

    /* Search */
    if (_searchQuery) {
      var q = _searchQuery.toLowerCase();
      list = list.filter(function (d) {
        return (d.name || '').toLowerCase().indexOf(q) !== -1 ||
               (d.description || '').toLowerCase().indexOf(q) !== -1;
      });
    }

    /* Panel role filter (additional granular filter from filter panel) */
    if (_filters.roles.length) {
      list = list.filter(function (d) {
        var role = window.DashboardStore ? DashboardStore.getMyRole(d.id) : null;
        return _filters.roles.indexOf(role) !== -1;
      });
    }

    /* Widget size filter */
    if (_filters.widgetSize) {
      list = list.filter(function (d) {
        var count = d.widgets ? d.widgets.length : 0;
        if (_filters.widgetSize === 'empty') return count === 0;
        if (_filters.widgetSize === 'small') return count >= 1 && count <= 5;
        if (_filters.widgetSize === 'large') return count >= 6;
        return true;
      });
    }

    /* Sort */
    list = list.sort(function (a, b) {
      if (_sortBy === 'name') return (a.name || '').localeCompare(b.name || '');
      var aVal = _sortBy === 'updated' ? (a.updatedAt || a.createdAt || '') :
                 _sortBy === 'created' ? (a.createdAt || '') :
                 (a.lastOpenedAt || a.createdAt || '');
      var bVal = _sortBy === 'updated' ? (b.updatedAt || b.createdAt || '') :
                 _sortBy === 'created' ? (b.createdAt || '') :
                 (b.lastOpenedAt || b.createdAt || '');
      return bVal > aVal ? 1 : -1;
    });

    return list;
  }

  /* ── Card (Google Docs / Power BI style) ── */

  function _buildCard(db) {
    var role        = window.DashboardStore ? DashboardStore.getMyRole(db.id) : 'viewer';
    var isOwner     = (role === 'owner');
    var widgetCount = db.widgets ? db.widgets.length : 0;
    var badgeCls    = role === 'owner' ? 'badge--blue' : (role === 'editor' ? 'badge--green' : 'badge--gray');
    var updatedStr  = _timeAgo(db.updatedAt || db.createdAt);
    var openedStr   = db.lastOpenedAt ? _timeAgo(db.lastOpenedAt) : 'Never';
    var descHtml    = db.description
      ? '<p class="dl-card__desc">' + _esc(db.description) + '</p>'
      : '';

    /* Icon block — colored icon representing dashboard type */
    var iconKey   = db.icon || 'grid';
    var iconColor = db.iconColor || '#1E88E5';
    var iconSvg   = _iconSvgs[iconKey] || _iconSvgs.grid;
    var iconBlock =
      '<div class="dl-card__icon" style="background:' + iconColor + '20;color:' + iconColor + '">' +
        iconSvg +
      '</div>';

    /* Meta row — Google Docs style: key facts in a row */
    var metaRow =
      '<div class="dl-card__meta">' +
        '<span class="dl-card__meta-item">' +
          '<span class="dl-card__meta-label">Widgets</span>' +
          '<span class="dl-card__meta-val">' + widgetCount + '</span>' +
        '</span>' +
        '<span class="dl-card__meta-sep">\u00b7</span>' +
        '<span class="dl-card__meta-item">' +
          '<span class="dl-card__meta-label">Modified</span>' +
          '<span class="dl-card__meta-val">' + updatedStr + '</span>' +
        '</span>' +
        '<span class="dl-card__meta-sep">\u00b7</span>' +
        '<span class="dl-card__meta-item">' +
          '<span class="dl-card__meta-label">Opened</span>' +
          '<span class="dl-card__meta-val">' + openedStr + '</span>' +
        '</span>' +
      '</div>';

    return '<div class="dl-card" data-id="' + db.id + '">' +
      iconBlock +
      '<div class="dl-card__main">' +
        '<div class="dl-card__top">' +
          '<span class="dl-card__name" data-name-id="' + db.id + '">' + _esc(db.name) + '</span>' +
          '<span class="badge ' + badgeCls + '">' + role + '</span>' +
        '</div>' +
        descHtml +
        metaRow +
      '</div>' +
      '<div class="dl-card__actions">' +
        '<button class="btn-icon dl-card__action-btn" data-action="share"  data-id="' + db.id + '" title="Share">'  + _shareSvg  + '</button>' +
        (isOwner ? '<button class="btn-icon dl-card__action-btn" data-action="rename" data-id="' + db.id + '" title="Rename">' + _pencilSvg + '</button>' : '') +
        (isOwner ? '<button class="btn-icon dl-card__action-btn dl-card__action-btn--danger" data-action="delete" data-id="' + db.id + '" title="Delete">' + _trashSvg + '</button>' : '') +
      '</div>' +
    '</div>';
  }

  function _buildEmptyState() {
    return '<div class="empty-state">' +
      '<div class="empty-state__icon">&#9707;</div>' +
      '<div class="empty-state__title">No dashboards found</div>' +
      '<div class="empty-state__desc">Try adjusting your search or filters.</div>' +
    '</div>';
  }

  /* ── Time helper ── */

  function _timeAgo(iso) {
    if (!iso) return '\u2014';
    try {
      var diff = Date.now() - new Date(iso).getTime();
      var mins = Math.floor(diff / 60000);
      if (mins < 1)  return 'just now';
      if (mins < 60) return mins + 'm ago';
      var hrs = Math.floor(mins / 60);
      if (hrs < 24)  return hrs + 'h ago';
      var days = Math.floor(hrs / 24);
      if (days < 7)  return days + 'd ago';
      var d = new Date(iso);
      return (d.getMonth() + 1) + '/' + d.getDate() + '/' + d.getFullYear();
    } catch (e) { return '\u2014'; }
  }

  /* ── Events ── */

  function _bindEvents($container) {
    /* Role pill filter */
    $container.on('click', '.dl-role-pill', function () {
      _roleFilter = $(this).data('role');
      _refreshList($container);
    });

    /* Inline sort select */
    $container.on('change', '#dl-sort', function () {
      _sortBy = $(this).val();
      _refreshList($container);
    });

    /* Search */
    $container.on('input', '.dl-search__input', function () {
      _searchQuery = $(this).val();
      _refreshList($container);
    });

    /* New Dashboard button */
    $container.on('click', '#dl-new-btn', function () {
      if (window.NewDashboardModal) {
        NewDashboardModal.open(function () { _renderPage(); });
      }
    });

    /* Filter button */
    $container.on('click', '#dl-filter-btn', function () {
      _openFilterPanel();
    });

    /* Recent card navigate */
    $container.on('click', '.dl-recent-card', function () {
      var id = $(this).data('id');
      if (!id) return;
      if (window.DashboardStore) DashboardStore.setActive(id);
      location.hash = '#dashboard/' + id;
    });

    /* Card navigate */
    $container.on('click', '.dl-card', function (e) {
      if ($(e.target).closest('.dl-card__action-btn').length) return;
      var id = $(this).data('id');
      if (!id) return;
      if (window.DashboardStore) DashboardStore.setActive(id);
      location.hash = '#dashboard/' + id;
    });

    /* Quick actions */
    $container.on('click', '.dl-card__action-btn', function (e) {
      e.stopPropagation();
      var action = $(this).data('action');
      var id     = $(this).data('id');
      if (action === 'share')  { _handleShare(id); }
      if (action === 'rename') { _startInlineRename(id, $container); }
      if (action === 'delete') { _handleDelete(id); }
    });
  }

  function _refreshList($container) {
    /* Update role pill active state */
    $container.find('.dl-role-pill').each(function () {
      $(this).toggleClass('is-active', $(this).data('role') === _roleFilter);
    });
    /* Rebuild list */
    var dashboards = window.DashboardStore ? DashboardStore.list() : [];
    $container.find('#dl-list-wrap').html(_buildList(dashboards));
    /* Update filter badge */
    var count = _countActiveFilters();
    var $badge = $container.find('#dl-filter-btn .dl-filter-badge');
    if (count > 0) {
      if ($badge.length) { $badge.text(count); }
      else { $container.find('#dl-filter-btn').append('<span class="dl-filter-badge">' + count + '</span>'); }
    } else {
      $badge.remove();
    }
  }

  function _countActiveFilters() {
    var count = 0;
    if (_filters.roles.length)  count++;
    if (_filters.widgetSize)    count++;
    return count;
  }

  function _startInlineRename(id, $container) {
    var $nameEl = $container.find('[data-name-id="' + id + '"]');
    if (!$nameEl.length || $nameEl.find('input').length) return;
    var currentName = $nameEl.text();
    var $input = $('<input type="text" class="form-input" style="font-size:var(--font-size-md);font-weight:600;padding:2px 6px;width:auto;min-width:160px" />').val(currentName);
    $nameEl.html('').append($input);
    $input.focus().select();

    function _commit() {
      var val = $input.val().trim();
      if (val && val !== currentName && window.DashboardStore) {
        DashboardStore.rename(id, val);
      }
      _renderPage();
    }
    $input.on('blur', _commit);
    $input.on('keydown', function (e) {
      if (e.key === 'Enter')  { e.preventDefault(); _commit(); }
      if (e.key === 'Escape') { _renderPage(); }
    });
  }

  function _handleShare(id) {
    if (window.Toast) Toast.info('Share feature coming soon');
  }

  function _handleDelete(id) {
    var db = window.DashboardStore ? DashboardStore.get(id) : null;
    if (!db) return;
    if (!window.confirm('Delete "' + db.name + '"? This cannot be undone.')) return;
    var activeDashboardId = DashboardStore.getActive() ? DashboardStore.getActive().id : null;
    DashboardStore.remove(id);
    if (id === activeDashboardId) {
      location.hash = '#dashboard';
    } else {
      _renderPage();
    }
  }

  function _esc(str) {
    return $('<span>').text(str || '').html();
  }

  return { render: render };
}());

window.PageDashboardsList = PageDashboardsList;
