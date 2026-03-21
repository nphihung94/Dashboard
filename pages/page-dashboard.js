/**
 * page-dashboard.js
 * Single dashboard view: Gridstack grid of widget cards.
 * Accepts optional dashboardId param to activate the correct dashboard.
 * Enforces viewer/editor/owner roles via DashboardStore.
 *
 * API:
 *   PageDashboard.render($container, dashboardId)
 *   PageDashboard.destroy()
 */

var PageDashboard = (function () {
  'use strict';

  var _grid        = null;
  var _$container  = null;

  var _saveSvg  = '<svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M13 13H3a1 1 0 01-1-1V3l3-1h7l2 2v8a1 1 0 01-1 1z"/><rect x="5" y="9" width="6" height="4" rx="0.5"/><rect x="5" y="2" width="4" height="3" rx="0.5"/></svg>';
  var _plusSvg  = '<svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="8" y1="2" x2="8" y2="14"/><line x1="2" y1="8" x2="14" y2="8"/></svg>';
  var _shareSvg = '<svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="3" r="1.5"/><circle cx="12" cy="13" r="1.5"/><circle cx="3" cy="8" r="1.5"/><line x1="4.5" y1="7" x2="10.5" y2="4"/><line x1="4.5" y1="9" x2="10.5" y2="12"/></svg>';
  var _trashSvg = '<svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="2,4 14,4"/><path d="M5 4V2h6v2"/><path d="M3 4l1 10h8l1-10"/></svg>';

  /* ── Public ── */

  function render($container, dashboardId) {
    _$container = $container;

    /* Activate dashboard by id if provided */
    if (dashboardId && window.DashboardStore) {
      DashboardStore.setActive(dashboardId);
    }

    var db = window.DashboardStore ? DashboardStore.getActive() : null;
    if (!db) {
      $container.html(
        '<div class="empty-state" style="margin-top:60px">' +
          '<div class="empty-state__title">Dashboard not found</div>' +
          '<div class="empty-state__desc"><a href="#dashboard">Back to dashboards</a></div>' +
        '</div>'
      );
      return;
    }

    var myRole  = DashboardStore.getMyRole(db.id);
    var canEdit = (myRole === 'owner' || myRole === 'editor');
    var isOwner = (myRole === 'owner');
    var widgets = db.widgets || [];

    /* Build page header */
    var breadcrumb =
      '<a href="#dashboard">Dashboards</a>' +
      '<span style="margin:0 4px;color:var(--color-text-3)">/</span>' +
      '<span>' + _esc(db.name) + '</span>';

    /* Title: clickable for rename if owner */
    var titleHtml = isOwner
      ? '<span class="page-header__title" id="db-title" style="cursor:pointer" title="Click to rename">' + _esc(db.name) + '</span>'
      : '<span class="page-header__title">' + _esc(db.name) + '</span>';

    var actionBtns =
      '<button class="btn btn--ghost" id="btn-share-dashboard">' + _shareSvg + ' Share</button>';

    if (canEdit) {
      actionBtns +=
        '<button class="btn btn--ghost" id="btn-save-layout">' + _saveSvg + ' Save Layout</button>' +
        '<button class="btn btn--primary" id="btn-add-widget">' + _plusSvg + ' Add Widget</button>';
    }

    if (isOwner) {
      actionBtns +=
        '<button class="btn btn--danger btn--sm" id="btn-delete-dashboard">' + _trashSvg + ' Delete</button>';
    }

    $container.html(
      '<div class="page-header">' +
        '<div class="page-header__breadcrumb">' + breadcrumb + '</div>' +
        titleHtml +
        '<div class="page-header__spacer"></div>' +
        actionBtns +
      '</div>' +
      '<div class="page-content" style="padding:var(--spacing-16) var(--spacing-12)">' +
        (widgets.length
          ? '<div class="grid-stack" id="dashboard-grid"></div>'
          : _emptyState(canEdit)) +
      '</div>'
    );

    if (widgets.length) {
      _initGrid($container, widgets, canEdit);
    }

    _bindEvents($container, db, canEdit, isOwner);
  }

  /* ── Private ── */

  function _emptyState(canEdit) {
    if (!canEdit) {
      return '<div class="empty-state" style="margin-top:60px">' +
        '<div class="empty-state__icon">&#9707;</div>' +
        '<div class="empty-state__title">No widgets</div>' +
        '<div class="empty-state__desc">This dashboard has no widgets yet.</div>' +
        '</div>';
    }
    return '<div class="empty-state" style="margin-top:60px">' +
      '<div class="empty-state__icon">&#9707;</div>' +
      '<div class="empty-state__title">No widgets yet</div>' +
      '<div class="empty-state__desc">Click "Add Widget" to add your first data visualization.</div>' +
      '<button class="btn btn--primary" id="btn-add-widget-empty" style="margin-top:12px">' +
        _plusSvg + ' Add Widget</button>' +
      '</div>';
  }

  function _initGrid($container, widgets, canEdit) {
    _grid = GridStack.init({
      column:    12,
      cellHeight: 60,
      margin:    12,
      handle:    '.widget-card__header',
      resizable: { handles: 'se' },
      draggable: { handle: '.widget-card__header' },
      animate:   false,
      staticGrid: !canEdit
    }, '#dashboard-grid');

    widgets.forEach(function (cfg) {
      WidgetCard.create(_grid, cfg);
    });

    /* Re-render widget content after resize */
    _grid.on('resizestop', function (event, el) {
      var $el = $(el);
      setTimeout(function () {
        $el.find('.vibe-widget').each(function () {
          var $body = $(this);
          if ($body.data('vibe-dataWidget')) {
            try { $body.dataWidget('refresh'); } catch (e) { /* ignore */ }
          }
        });
      }, 60);
    });

    _initResizeAutoScroll();

    /* Persist layout on change (only when editing allowed) */
    if (canEdit) {
      _grid.on('change', function (event, items) {
        if (!items || !window.LayoutStore) return;
        var positions = items.map(function (item) {
          return { id: item.id, x: item.x, y: item.y, w: item.w, h: item.h };
        });
        LayoutStore.updatePositions(positions);
      });
    }
  }

  /* Auto-scroll during resize */
  var _isResizing = false;

  function _initResizeAutoScroll() {
    var threshold = 80;
    var speed     = 15;

    $(document).on('mousemove.gsAutoScroll', function (e) {
      if (!_isResizing) return;
      var scrollEl = document.documentElement;
      if (e.clientY > window.innerHeight - threshold)       scrollEl.scrollTop += speed;
      else if (e.clientY < threshold)                       scrollEl.scrollTop -= speed;
      if (e.clientX > window.innerWidth - threshold)        scrollEl.scrollLeft += speed;
      else if (e.clientX < threshold)                       scrollEl.scrollLeft -= speed;
    });

    _grid.on('resizestart', function () { _isResizing = true; });
    _grid.on('resizestop',  function () { _isResizing = false; });
  }

  function _bindEvents($container, db, canEdit, isOwner) {
    /* Inline title rename (owner only) */
    if (isOwner) {
      $container.on('click', '#db-title', function () {
        var $title = $(this);
        if ($title.find('input').length) return; /* already editing */
        var currentName = db.name;
        var $input = $('<input type="text" class="form-input" style="font-size:var(--font-size-md);font-weight:600;padding:2px 8px;max-width:240px" />')
          .val(currentName);
        $title.html('').append($input);
        $input.focus().select();

        function _commit() {
          var val = $input.val().trim();
          if (val && val !== currentName && window.DashboardStore) {
            DashboardStore.rename(db.id, val);
            db.name = val;
          }
          $title.text(db.name);
        }

        $input.on('blur', _commit);
        $input.on('keydown', function (e) {
          if (e.key === 'Enter') { e.preventDefault(); _commit(); }
          if (e.key === 'Escape') { $title.text(db.name); }
        });
      });
    }

    /* Share */
    $container.on('click', '#btn-share-dashboard', function () {
      if (window.DashboardPermissionModal) DashboardPermissionModal.open(db.id);
    });

    /* Add widget (editor/owner) */
    $container.on('click', '#btn-add-widget, #btn-add-widget-empty', function () {
      AddWidgetModal.open(function (config) {
        if (window.LayoutStore) LayoutStore.addWidget(config);
        if (!_grid) {
          destroy();
          render($container, db.id);
          return;
        }
        WidgetCard.create(_grid, config);
        if (window.Toast) Toast.success('Widget added: ' + config.title);
      });
    });

    /* Save layout */
    $container.on('click', '#btn-save-layout', function () {
      if (window.LayoutStore) LayoutStore.save();
      if (window.Toast) Toast.success('Layout saved');
    });

    /* Delete dashboard (owner only) */
    $container.on('click', '#btn-delete-dashboard', function () {
      if (!window.confirm('Delete "' + db.name + '"? This cannot be undone.')) return;
      if (window.DashboardStore) DashboardStore.remove(db.id);
      location.hash = '#dashboard';
    });

    /* Pipeline output refresh */
    $(document).on('pipeline:output-updated.dashboard', function (e, data) {
      if (!data || !window.LayoutStore) return;
      LayoutStore.load().forEach(function (cfg) {
        if (cfg.pipelineOutputId === data.outputId) {
          WidgetCard.refresh(cfg.id, cfg.pipelineOutputId);
        }
      });
    });
  }

  function destroy() {
    _isResizing = false;
    $(document).off('pipeline:output-updated.dashboard');
    $(document).off('mousemove.gsAutoScroll');
    if (window.WidgetCard) WidgetCard.destroyAll();
    if (_grid) {
      try { _grid.destroy(false); } catch (e) { /* ignore */ }
      _grid = null;
    }
  }

  function _esc(str) {
    return $('<span>').text(str || '').html();
  }

  return { render: render, destroy: destroy };
}());

window.PageDashboard = PageDashboard;
