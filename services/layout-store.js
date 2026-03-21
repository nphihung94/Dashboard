/**
 * layout-store.js
 * Thin shim — delegates all operations to DashboardStore.
 * Kept for backward compatibility with existing code that calls LayoutStore.*
 *
 * API (unchanged):
 *   LayoutStore.init()
 *   LayoutStore.load()
 *   LayoutStore.save()
 *   LayoutStore.addWidget(config)
 *   LayoutStore.removeWidget(id)
 *   LayoutStore.updatePositions(items)
 *   LayoutStore.generateId()
 */

var LayoutStore = (function () {
  'use strict';

  function init() {
    /* DashboardStore.init() handles everything — no-op here */
  }

  function load() {
    if (!window.DashboardStore) return [];
    var active = DashboardStore.getActive();
    return active ? active.widgets.slice() : [];
  }

  function save() {
    if (window.DashboardStore) DashboardStore.save();
  }

  function addWidget(config) {
    if (window.DashboardStore) DashboardStore.addWidget(config);
  }

  function removeWidget(id) {
    if (window.DashboardStore) DashboardStore.removeWidget(id);
  }

  function updatePositions(items) {
    if (window.DashboardStore) DashboardStore.updatePositions(items);
  }

  function generateId() {
    return 'w-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6);
  }

  return {
    init:            init,
    load:            load,
    save:            save,
    addWidget:       addWidget,
    removeWidget:    removeWidget,
    updatePositions: updatePositions,
    generateId:      generateId
  };
}());

window.LayoutStore = LayoutStore;
