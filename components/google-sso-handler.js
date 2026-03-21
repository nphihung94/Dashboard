/* google-sso-handler.js — GIS ID token flow + JWT decode for SSO auth mode */
var GoogleSSOHandler = (function () {
  'use strict';

  var SHEETS_SCOPE = 'https://www.googleapis.com/auth/spreadsheets.readonly';

  /* Lazy-load GIS script; guard against double-inject via element id check */
  function preloadGis(cb) {
    if (window.google && window.google.accounts) {
      if (cb) cb();
      return;
    }
    if (document.getElementById('gis-script')) {
      if (cb) {
        var el = document.getElementById('gis-script');
        el.addEventListener('load', cb);
      }
      return;
    }
    var s   = document.createElement('script');
    s.id    = 'gis-script';
    s.src   = 'https://accounts.google.com/gsi/client';
    if (cb) s.onload = cb;
    document.head.appendChild(s);
  }

  /* Client-side base64url JWT payload decode — no library needed */
  function decodeJwt(token) {
    try {
      var parts = token.split('.');
      if (parts.length !== 3) return null;
      var payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      return JSON.parse(atob(payload));
    } catch (e) {
      return null;
    }
  }

  /*
   * initSso(clientId, callback)
   * Initializes GIS One Tap and fires callback(idToken) on success.
   * Caller must ensure GIS is already loaded via preloadGis() first.
   */
  function initSso(clientId, callback) {
    try {
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: function (credentialResponse) {
          callback(credentialResponse.credential);
        }
      });
      window.google.accounts.id.prompt();
    } catch (ex) {
      callback(null, ex.message);
    }
  }

  /*
   * connect(clientId, onResult)
   * Full SSO connect: ID token flow then access token flow, sequential.
   * onResult(result) — result is either {error: string} or success object.
   */
  function connect(clientId, onResult) {
    preloadGis(function () {
      try {
        /* Step 1: ID token via One Tap */
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: function (credentialResponse) {
            var idToken = credentialResponse.credential;
            var claims  = decodeJwt(idToken);
            if (!claims) {
              onResult({ error: 'Failed to decode ID token.' });
              return;
            }
            /* Step 2: Access token for API scope */
            var tokenClient = window.google.accounts.oauth2.initTokenClient({
              client_id: clientId,
              scope:     SHEETS_SCOPE,
              callback:  function (tokenResp) {
                if (tokenResp.error) {
                  onResult({ error: 'OAuth error: ' + tokenResp.error });
                  return;
                }
                onResult({
                  email:             claims.email  || '',
                  idToken:           idToken,
                  idTokenExpiresAt:  claims.exp * 1000,
                  accessToken:       tokenResp.access_token,
                  expiresAt:         Date.now() + ((tokenResp.expires_in || 3600) * 1000)
                });
              }
            });
            tokenClient.requestAccessToken();
          }
        });
        window.google.accounts.id.prompt();
      } catch (ex) {
        onResult({ error: ex.message });
      }
    });
  }

  return {
    preloadGis: preloadGis,
    decodeJwt:  decodeJwt,
    initSso:    initSso,
    connect:    connect
  };
}());

window.GoogleSSOHandler = GoogleSSOHandler;
