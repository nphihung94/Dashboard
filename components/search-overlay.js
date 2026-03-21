/**
 * search-overlay.js
 * Cmd+K (or click) search overlay — searches pipelines, datasets, pages.
 * Renders into #search-overlay portal div.
 *
 * API:
 *   SearchOverlay.init()   — set up keyboard shortcut + render shell
 *   SearchOverlay.open()
 *   SearchOverlay.close()
 */

var SearchOverlay = (function () {
  'use strict';

  var _isOpen = false;
  var _focusIdx = -1;
  var _results = [];

  var _pageItems = [
    { type: 'page', name: 'Home',      hash: '#home',      icon: 'home' },
    { type: 'page', name: 'Dashboard', hash: '#dashboard', icon: 'dashboard' },
    { type: 'page', name: 'Datasets',  hash: '#dataset',   icon: 'dataset' },
    { type: 'page', name: 'Settings',  hash: '#settings',  icon: 'settings' }
  ];

  var _svgIcons = {
    home:     '<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M2 6.5L8 2l6 4.5V14a1 1 0 01-1 1H3a1 1 0 01-1-1z"/><path d="M6 15V9h4v6"/></svg>',
    dashboard:'<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="1" y="1" width="6" height="6" rx="1"/><rect x="9" y="1" width="6" height="6" rx="1"/><rect x="1" y="9" width="6" height="6" rx="1"/><rect x="9" y="9" width="6" height="6" rx="1"/></svg>',
    dataset:  '<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><ellipse cx="8" cy="4" rx="6" ry="2"/><path d="M2 4v4c0 1.1 2.7 2 6 2s6-.9 6-2V4"/><path d="M2 8v4c0 1.1 2.7 2 6 2s6-.9 6-2V8"/></svg>',
    pipeline: '<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="4" width="4" height="3" rx="1"/><rect x="6" y="1" width="4" height="3" rx="1"/><rect x="11" y="4" width="4" height="3" rx="1"/><path d="M5 5.5H6M10 5.5H11M8 4V2.5"/></svg>',
    settings: '<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><circle cx="8" cy="8" r="2.5"/><path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.05 3.05l1.41 1.41M11.54 11.54l1.41 1.41M3.05 12.95l1.41-1.41M11.54 4.46l1.41-1.41"/></svg>'
  };

  function _buildResults(query) {
    query = (query || '').trim().toLowerCase();
    var items = [];

    // Static pages
    _pageItems.forEach(function (p) {
      if (!query || p.name.toLowerCase().indexOf(query) !== -1) {
        items.push({ type: 'Page', name: p.name, hash: p.hash, icon: _svgIcons[p.icon] || _svgIcons.dashboard });
      }
    });

    // Pipelines from DatasetStore
    if (window.DatasetStore) {
      DatasetStore.getPipelines().forEach(function (p) {
        if (!query || p.name.toLowerCase().indexOf(query) !== -1 ||
            (p.type || '').toLowerCase().indexOf(query) !== -1) {
          items.push({ type: 'Pipeline', name: p.name, hash: '#pipeline/' + p.id, icon: _svgIcons.pipeline });
        }
      });
    }

    // Datasets
    if (window.DatasetStore) {
      DatasetStore.list().forEach(function (d) {
        if (!query || d.name.toLowerCase().indexOf(query) !== -1) {
          items.push({ type: 'Dataset', name: d.name, hash: '#dataset', icon: _svgIcons.dataset });
        }
      });
    }

    return items;
  }

  function _renderResults(results) {
    var $results = $('#search-overlay .search-overlay__results');
    if (!$results.length) return;

    if (!results.length) {
      $results.html('<div class="search-overlay__empty">No results found</div>');
      return;
    }

    var html = results.map(function (item, idx) {
      return '<div class="search-result-item" data-idx="' + idx + '" data-hash="' + item.hash + '">' +
        '<span class="search-result-item__icon">' + item.icon + '</span>' +
        '<span class="search-result-item__name">' + $('<span>').text(item.name).html() + '</span>' +
        '<span class="search-result-item__type">' + item.type + '</span>' +
        '</div>';
    }).join('');
    $results.html(html);
  }

  function _setFocus(idx) {
    var $items = $('#search-overlay .search-result-item');
    $items.removeClass('is-focused');
    if (idx >= 0 && idx < $items.length) {
      $items.eq(idx).addClass('is-focused');
      _focusIdx = idx;
    }
  }

  function _navigate(hash) {
    close();
    if (hash) location.hash = hash;
  }

  function open() {
    if (_isOpen) return;
    _isOpen = true;
    _focusIdx = -1;

    var $el = $('#search-overlay');
    $el.html(
      '<div class="search-overlay__box">' +
        '<div class="search-overlay__input-wrap">' +
          '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#8F8F8F" stroke-width="1.5" stroke-linecap="round"><circle cx="6.5" cy="6.5" r="4.5"/><line x1="10" y1="10" x2="14" y2="14"/></svg>' +
          '<input type="text" class="search-overlay__input" placeholder="Search pipelines, datasets, pages..." autocomplete="off" />' +
          '<kbd style="font-size:10px;padding:1px 5px;border:1px solid #e8e8e8;border-radius:4px;color:#8F8F8F">Esc</kbd>' +
        '</div>' +
        '<div class="search-overlay__results"></div>' +
      '</div>'
    );

    _results = _buildResults('');
    _renderResults(_results);
    $el.addClass('is-open');
    setTimeout(function () { $el.find('.search-overlay__input').focus(); }, 50);

    // Backdrop click closes
    $el.on('click.searchOverlay', function (e) {
      if ($(e.target).is('#search-overlay')) close();
    });

    // Input handler
    $el.on('input.searchOverlay', '.search-overlay__input', function () {
      _results = _buildResults($(this).val());
      _focusIdx = -1;
      _renderResults(_results);
    });

    // Keyboard navigation
    $el.on('keydown.searchOverlay', function (e) {
      if (e.key === 'Escape') { close(); return; }
      if (e.key === 'ArrowDown') { e.preventDefault(); _setFocus(Math.min(_focusIdx + 1, _results.length - 1)); }
      if (e.key === 'ArrowUp')   { e.preventDefault(); _setFocus(Math.max(_focusIdx - 1, 0)); }
      if (e.key === 'Enter' && _focusIdx >= 0 && _results[_focusIdx]) {
        _navigate(_results[_focusIdx].hash);
      }
    });

    // Click result
    $el.on('click.searchOverlay', '.search-result-item', function () {
      _navigate($(this).data('hash'));
    });
  }

  function close() {
    if (!_isOpen) return;
    _isOpen = false;
    var $el = $('#search-overlay');
    $el.removeClass('is-open').off('.searchOverlay');
  }

  function init() {
    // Cmd+K / Ctrl+K shortcut
    $(document).on('keydown.searchOverlay', function (e) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        _isOpen ? close() : open();
      }
    });
  }

  return { init: init, open: open, close: close };
}());

window.SearchOverlay = SearchOverlay;
