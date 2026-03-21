/**
 * integration-store.js
 * Singleton store for connected external integration accounts.
 * Persists token data to localStorage. No jQuery dependency.
 * Keyed by unique connection ID (not provider) to support multiple accounts.
 *
 * API:
 *   IntegrationStore.init()
 *   IntegrationStore.generateId() -> 'conn_xxx'
 *   IntegrationStore.save(id, data)
 *   IntegrationStore.get(id) -> entry | null
 *   IntegrationStore.getByProvider(provider) -> Array of entries
 *   IntegrationStore.list() -> Array of all entries
 *   IntegrationStore.remove(id)
 *
 * Entry shape:
 *   {
 *     id:               string   — unique connection ID ('conn_xxx')
 *     provider:         string   — e.g. 'google-sheets'
 *     name:             string   — user-defined label
 *     clientId:         string   — Google OAuth client ID
 *     authMode:         string   — 'token' | 'sso' (default: 'token')
 *     email:            string   — Google account email; empty for token mode
 *     idToken:          string   — raw GIS ID token JWT (SSO mode only)
 *     idTokenExpiresAt: number   — ID token expiry as ms timestamp (SSO mode only)
 *     accessToken:      string   — OAuth2 access token
 *     expiresAt:        number   — access token expiry as ms timestamp
 *     connectedAt:      number   — connection creation time as ms timestamp
 *   }
 */
var IntegrationStore = (function () {
  'use strict';

  var LS_KEY = 'vibe-integrations';
  var _data  = {};  /* id -> entry */

  function init() {
    try {
      var raw = localStorage.getItem(LS_KEY);
      if (raw) _data = JSON.parse(raw) || {};
    } catch (e) { _data = {}; }

    /* Migrate old format: entries keyed by provider name with no id field */
    var migrated = {};
    Object.keys(_data).forEach(function (k) {
      var entry = _data[k];
      if (!entry.id) {
        /* Old format: entry.provider is e.g. 'google-sheets', key == provider */
        entry.id          = entry.provider || k;
        entry.name        = entry.name || entry.provider || k;
        entry.connectedAt = entry.connectedAt || Date.now();
      }
      migrated[entry.id] = entry;
    });
    _data = migrated;
    _persist();
  }

  function _persist() {
    try { localStorage.setItem(LS_KEY, JSON.stringify(_data)); } catch (e) {
      console.warn('[IntegrationStore] localStorage write failed:', e);
    }
  }

  /** Returns a unique connection ID */
  function generateId() {
    return 'conn_' + Date.now().toString(36);
  }

  /**
   * Save or overwrite a connection entry by ID.
   * @param {string} id        - unique connection ID
   * @param {object} data      - full entry object
   */
  function save(id, data) {
    if (!id) return;
    _data[id] = data;
    _persist();
  }

  function get(id) {
    return _data[id] || null;
  }

  /** Returns all entries for a given provider as an array */
  function getByProvider(provider) {
    return Object.keys(_data).map(function (k) {
      return _data[k];
    }).filter(function (e) {
      return e.provider === provider;
    });
  }

  function list() {
    return Object.keys(_data).map(function (k) { return _data[k]; });
  }

  function remove(id) {
    delete _data[id];
    _persist();
  }

  return {
    init:          init,
    generateId:    generateId,
    save:          save,
    get:           get,
    getByProvider: getByProvider,
    list:          list,
    remove:        remove
  };
}());

window.IntegrationStore = IntegrationStore;
