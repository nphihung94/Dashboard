/* new-connection-modal.js — 3-step modal: provider pick → auth mode → name+clientId+OAuth */
var NewConnectionModal = (function () {
  'use strict';

  var _onCreated = null, _$overlay = null, _provider = null, _authMode = 'token';
  var _LS_CLIENT_KEY = 'vibe-google-client-id';

  function _loadSavedClientId() {
    try { return localStorage.getItem(_LS_CLIENT_KEY) || ''; } catch (e) { return ''; }
  }
  function _saveClientId(id) {
    try { if (id) localStorage.setItem(_LS_CLIENT_KEY, id); } catch (e) {}
  }

  var _icons = {
    'google-sheets': '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="9" x2="9" y2="21"/><line x1="15" y1="9" x2="15" y2="21"/></svg>',
    'google-drive':  '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M22 17H2l4-7h12z"/><path d="M6 10L12 2l6 8"/></svg>',
    'powerbi':       '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><rect x="2" y="12" width="4" height="10" rx="1"/><rect x="8" y="7" width="4" height="15" rx="1"/><rect x="14" y="3" width="4" height="19" rx="1"/></svg>',
    'tableau':       '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><line x1="12" y1="3" x2="12" y2="8"/><line x1="12" y1="16" x2="12" y2="21"/><line x1="3" y1="12" x2="8" y2="12"/><line x1="16" y1="12" x2="21" y2="12"/></svg>'
  };

  var _providers = [
    { key: 'google-sheets', name: 'Google Sheets', active: true },
    { key: 'google-drive',  name: 'Google Drive',  active: false },
    { key: 'powerbi',       name: 'Power BI',      active: false },
    { key: 'tableau',       name: 'Tableau',        active: false }
  ];

  var _BACK_SVG = '<svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><polyline points="8,2 4,6 8,10"/></svg> Back';

  /* Step 1.5 auth mode picker HTML */
  var _step1_5Html = '<div class="modal-step" id="nc-step1-5"><div class="nds-step2-header"><button class="nds-back-btn" id="nc-back-1-5">' + _BACK_SVG + '</button></div>' +
    '<div style="font-size:var(--font-size-sm);color:var(--color-text-2);margin-bottom:12px">Choose how to authenticate:</div>' +
    '<div class="nds-source-grid" style="grid-template-columns:1fr 1fr">' +
      '<div class="nds-source-card" data-mode="token"><div class="nds-source-card__title">OAuth Token</div><div style="font-size:var(--font-size-xs);color:var(--color-text-3);margin-top:4px">Short-lived access token for API calls</div></div>' +
      '<div class="nds-source-card" data-mode="sso"><div class="nds-source-card__title">SSO + Permissions</div><div style="font-size:var(--font-size-xs);color:var(--color-text-3);margin-top:4px">Sign in with Google + approve scopes. Provides identity (email) + API access</div></div>' +
    '</div></div>';

  /* Permission summary card — shown in step 2 for SSO mode only */
  var _permCardHtml = '<div id="nc-perm-card" style="display:none;background:var(--color-bg-2,#f9fafb);border:1px solid var(--color-border);border-radius:6px;padding:10px 14px;margin-bottom:12px;font-size:var(--font-size-sm)">' +
    '<div style="font-weight:500;margin-bottom:6px">This connection will request:</div>' +
    '<ul style="margin:0;padding-left:18px;color:var(--color-text-2)"><li>Your Google account identity (email)</li><li>Read access to Google Sheets</li></ul></div>';

  function open(onCreated) {
    _onCreated = onCreated || function () {};
    _provider = null; _authMode = 'token';
    var providerCards = _providers.map(function (p) {
      var dis = p.active ? '' : ' nc-card--disabled';
      var bdg = p.active ? '' : ' <span class="badge" style="font-size:10px">Coming Soon</span>';
      return '<div class="nds-source-card' + dis + '" data-provider="' + p.key + '"' +
        (p.active ? '' : ' style="opacity:0.5;pointer-events:none"') + '>' +
        '<div class="nds-source-card__icon">' + (_icons[p.key] || '') + '</div>' +
        '<div class="nds-source-card__title">' + p.name + bdg + '</div></div>';
    }).join('');
    var html = '<div class="modal-overlay" id="nc-overlay"><div class="modal" style="max-width:560px;width:95vw">' +
      '<div class="modal__header"><span class="modal__title">New Connection</span><button class="btn btn--ghost btn--sm" id="nc-close">&#x2715;</button></div>' +
      '<div class="modal__body" style="min-height:260px">' +
        '<div class="modal-step is-active" id="nc-step1"><div class="nds-source-grid">' + providerCards + '</div></div>' +
        _step1_5Html +
        '<div class="modal-step" id="nc-step2"><div class="nds-step2-header"><button class="nds-back-btn" id="nc-back">' + _BACK_SVG + '</button></div>' +
        _permCardHtml +
        '<div class="form-group"><label class="form-label">Connection Name <span style="color:var(--color-error-text)">*</span></label><input class="form-input" id="nc-name" placeholder="e.g. Work Account" /></div>' +
        '<div class="form-group"><label class="form-label">Google OAuth Client ID <span style="color:var(--color-error-text)">*</span></label><input class="form-input" id="nc-client-id" placeholder="123456789-xxx.apps.googleusercontent.com" />' +
        '<div style="font-size:var(--font-size-xs);color:var(--color-text-3);margin-top:4px">Saved per-browser. <a href="https://console.cloud.google.com/apis/credentials" target="_blank" style="color:var(--color-brand)">Google Cloud Console &#x2192; APIs &amp; Services &#x2192; Credentials</a>.</div></div>' +
        '<div id="nc-status" style="font-size:var(--font-size-xs);margin-bottom:var(--spacing-8)"></div></div>' +
      '</div>' +
      '<div class="modal__footer"><button class="btn btn--ghost btn--sm" id="nc-cancel">Cancel</button><button class="btn btn--primary" id="nc-connect" style="display:none">Connect</button></div>' +
      '</div></div>';
    _$overlay = $(html);
    $('body').append(_$overlay);
    _bindEvents();
  }

  function _bindEvents() {
    var $o = _$overlay;
    $o.on('click', '#nc-close, #nc-cancel', _close);
    $o.on('click', '.nds-source-card:not(.nc-card--disabled)', function () {
      var mode = $(this).data('mode');
      if (mode) {
        /* Auth mode card in step 1.5 */
        _authMode = mode;
        $o.find('.nds-source-card[data-mode]').removeClass('is-selected').css('border-color', '');
        $(this).addClass('is-selected').css('border-color', 'var(--color-primary)');
        _showStep2();
      } else {
        /* Provider card in step 1 */
        _provider = $(this).data('provider');
        if (_provider && _provider.indexOf('google-') === 0) { _showStep1_5(); } else { _authMode = 'token'; _showStep2(); }
      }
    });
    $o.on('click', '#nc-back-1-5', _showStep1);
    $o.on('click', '#nc-back', function () {
      if (_provider && _provider.indexOf('google-') === 0) { _showStep1_5(); } else { _showStep1(); }
    });
    $o.on('blur', '#nc-client-id', function () { if ($(this).val().trim()) _preloadGIS(null); });
    $o.on('click', '#nc-connect', _handleConnect);
  }

  function _showStep1() {
    _$overlay.find('#nc-step1').addClass('is-active');
    _$overlay.find('#nc-step1-5, #nc-step2').removeClass('is-active');
    _$overlay.find('#nc-connect').hide(); _$overlay.find('#nc-status').text(''); _authMode = 'token';
  }

  function _showStep1_5() {
    _$overlay.find('#nc-step1-5').addClass('is-active');
    _$overlay.find('#nc-step1, #nc-step2').removeClass('is-active');
    _$overlay.find('#nc-connect').hide();
  }

  function _showStep2() {
    _$overlay.find('#nc-step2').addClass('is-active');
    _$overlay.find('#nc-step1, #nc-step1-5').removeClass('is-active');
    var isSso = (_authMode === 'sso');
    _$overlay.find('#nc-perm-card')[isSso ? 'show' : 'hide']();
    _$overlay.find('#nc-connect').text(isSso ? 'Approve & Connect' : 'Connect').show();
    /* Pre-fill saved client ID */
    var saved = _loadSavedClientId();
    if (saved) {
      _$overlay.find('#nc-client-id').val(saved);
      _$overlay.find('#nc-client-id').closest('.form-group').find('.form-label').html(
        'Google OAuth Client ID <span style="color:var(--color-success-text);font-weight:400;font-size:var(--font-size-xs)">(saved)</span>'
      );
      _preloadGIS(null);
    }
    _$overlay.find('#nc-name').focus();
  }

  function _handleConnect() {
    var name = _$overlay.find('#nc-name').val().trim();
    var clientId = _$overlay.find('#nc-client-id').val().trim();
    if (!name)     { _setStatus('Connection name is required.', true); return; }
    if (!clientId) { _setStatus('Client ID is required.', true); return; }
    _setStatus('Connecting\u2026'); _$overlay.find('#nc-connect').prop('disabled', true);
    if (_authMode === 'sso') { _handleSsoConnect(name, clientId); return; }
    if (window.google && window.google.accounts) { _initGisAndConnect(name, clientId); }
    else { _preloadGIS(function () { _initGisAndConnect(name, clientId); }); }
  }

  function _handleSsoConnect(name, clientId) {
    var handler = window.GoogleSSOHandler;
    if (!handler) { _setStatus('SSO handler not loaded.', true); _$overlay.find('#nc-connect').prop('disabled', false); return; }
    handler.connect(clientId, function (result) {
      _$overlay.find('#nc-connect').prop('disabled', false);
      if (result.error) { _setStatus('SSO error: ' + result.error, true); return; }
      _saveClientId(clientId);
      var id = window.IntegrationStore ? IntegrationStore.generateId() : ('conn_' + Date.now().toString(36));
      var entry = { id: id, provider: _provider, name: name, clientId: clientId, authMode: 'sso',
        email: result.email, idToken: result.idToken, idTokenExpiresAt: result.idTokenExpiresAt,
        accessToken: result.accessToken, expiresAt: result.expiresAt, connectedAt: Date.now() };
      if (window.IntegrationStore) IntegrationStore.save(id, entry);
      if (window.Toast) Toast.success(name + ' connected.');
      _close(); _onCreated(entry);
    });
  }

  function _preloadGIS(cb) {
    if (window.google && window.google.accounts) { if (cb) cb(); return; }
    if (document.getElementById('gis-script')) { if (cb) document.getElementById('gis-script').addEventListener('load', cb); return; }
    var s = document.createElement('script'); s.id = 'gis-script'; s.src = 'https://accounts.google.com/gsi/client';
    if (cb) s.onload = cb;
    s.onerror = function () { _setStatus('Failed to load Google Identity Services.', true); };
    document.head.appendChild(s);
  }

  function _initGisAndConnect(name, clientId) {
    try {
      var id = window.IntegrationStore ? IntegrationStore.generateId() : ('conn_' + Date.now().toString(36));
      var tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: 'https://www.googleapis.com/auth/spreadsheets.readonly',
        callback: function (resp) {
          _$overlay.find('#nc-connect').prop('disabled', false);
          if (resp.error) { _setStatus('OAuth error: ' + resp.error, true); return; }
          _saveClientId(clientId);
          var entry = { id: id, provider: _provider, name: name, clientId: clientId,
            authMode: 'token', email: '', accessToken: resp.access_token,
            expiresAt: Date.now() + ((resp.expires_in || 3600) * 1000), connectedAt: Date.now() };
          if (window.IntegrationStore) IntegrationStore.save(id, entry);
          if (window.Toast) Toast.success(name + ' connected.');
          _close(); _onCreated(entry);
        }
      });
      tokenClient.requestAccessToken();
    } catch (ex) { _$overlay.find('#nc-connect').prop('disabled', false); _setStatus('Error: ' + ex.message, true); }
  }

  function _setStatus(msg, isError) {
    var color = isError ? 'var(--color-error-text)' : 'var(--color-text-3)';
    _$overlay.find('#nc-status').html('<span style="color:' + color + '">' + msg + '</span>');
  }

  function _close() {
    if (_$overlay) { _$overlay.remove(); _$overlay = null; }
    _provider = null; _authMode = 'token';
  }

  return { open: open };
}());

window.NewConnectionModal = NewConnectionModal;
