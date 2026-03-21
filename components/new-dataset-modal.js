/**
 * new-dataset-modal.js
 * Wizard modal for creating a new dataset. Step 1: source type card grid.
 * Step 2: type-specific sub-component form + dataset name input.
 *
 * API: NewDatasetModal.open(onCreated)
 */
var NewDatasetModal = (function () {
  'use strict';

  var _sourceType = null;
  var _onCreated  = null;
  var _$overlay   = null;

  /* SVG icons for source type cards */
  var _icons = {
    pipeline:    '<svg width="20" height="20" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="5" width="4" height="6" rx="1"/><rect x="6" y="5" width="4" height="6" rx="1"/><rect x="11" y="5" width="4" height="6" rx="1"/><line x1="5" y1="8" x2="6" y2="8"/><line x1="10" y1="8" x2="11" y2="8"/></svg>',
    file:        '<svg width="20" height="20" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 2H4a1 1 0 00-1 1v10a1 1 0 001 1h8a1 1 0 001-1V6z"/><polyline points="9,2 9,6 13,6"/></svg>',
    integration: '<svg width="20" height="20" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><circle cx="4" cy="8" r="2.5"/><circle cx="12" cy="4" r="2.5"/><circle cx="12" cy="12" r="2.5"/><line x1="6.5" y1="7" x2="9.5" y2="5"/><line x1="6.5" y1="9" x2="9.5" y2="11"/></svg>',
    api:         '<svg width="20" height="20" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M2 8h12M10 4l4 4-4 4"/><path d="M5 4L2 8l3 4" stroke-linejoin="round"/></svg>',
    database:    '<svg width="20" height="20" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="8" cy="4" rx="6" ry="2"/><path d="M2 4v4c0 1.1 2.7 2 6 2s6-.9 6-2V4"/><path d="M2 8v4c0 1.1 2.7 2 6 2s6-.9 6-2V8"/></svg>'
  };

  var _sourceTypes = [
    { key: 'pipeline',    title: 'Pipeline Output',      desc: 'Use output from an existing pipeline' },
    { key: 'file',        title: 'File Upload',          desc: 'Import CSV, Excel, or MySQL export (.sql)' },
    { key: 'database',    title: 'Database Connection',  desc: 'Connect to MySQL or PostgreSQL directly' },
    { key: 'integration', title: 'External Integration', desc: 'Connect Google Sheets, PowerBI, Tableau' },
    { key: 'api',         title: 'API Endpoint',         desc: 'Fetch data from any HTTPS REST API' }
  ];

  /* Sub-component lookup */
  var _components = {
    pipeline:    function () { return window.DatasetSourcePipeline; },
    file:        function () { return window.DatasetSourceFile; },
    database:    function () { return window.DatasetSourceDatabase; },
    integration: function () { return window.DatasetSourceIntegration; },
    api:         function () { return window.DatasetSourceApi; }
  };

  function open(onCreated) {
    _onCreated  = onCreated || function () {};
    _sourceType = null;

    var overlayHtml =
      '<div class="modal-overlay" id="new-dataset-overlay">' +
        '<div class="modal" style="max-width:600px;width:95vw">' +
          '<div class="modal__header">' +
            '<span class="modal__title">New Dataset</span>' +
            '<button class="btn btn--ghost btn--sm" id="nds-close">✕</button>' +
          '</div>' +
          '<div class="modal__body" style="min-height:280px">' +
            /* Step 1 */
            '<div class="modal-step is-active" id="nds-step1">' +
              '<div class="nds-source-grid">' +
                _sourceTypes.map(function (s) {
                  return '<div class="nds-source-card" data-source="' + s.key + '">' +
                    '<div class="nds-source-card__icon">' + _icons[s.key] + '</div>' +
                    '<div class="nds-source-card__title">' + s.title + '</div>' +
                    '<div class="nds-source-card__desc">' + s.desc + '</div>' +
                  '</div>';
                }).join('') +
              '</div>' +
            '</div>' +
            /* Step 2 */
            '<div class="modal-step" id="nds-step2">' +
              '<div class="nds-step2-header">' +
                '<button class="nds-back-btn" id="nds-back">' +
                  '<svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><polyline points="8,2 4,6 8,10"/></svg>' +
                  ' Back' +
                '</button>' +
                '<span class="nds-step2-title" id="nds-step2-title"></span>' +
              '</div>' +
              '<div class="form-group">' +
                '<label class="form-label">Dataset Name <span style="color:var(--color-error-text)">*</span></label>' +
                '<input class="form-input" id="nds-name" placeholder="e.g. Q1 Sales Data" />' +
              '</div>' +
              '<div id="nds-step2-content"></div>' +
            '</div>' +
          '</div>' +
          '<div class="modal__footer" id="nds-footer" style="display:none">' +
            '<button class="btn btn--ghost" id="nds-cancel">Cancel</button>' +
            '<button class="btn btn--primary" id="nds-create">Create Dataset</button>' +
          '</div>' +
        '</div>' +
      '</div>';

    _$overlay = $(overlayHtml).appendTo('body');
    _bindEvents();
  }

  function _showStep2(type) {
    _sourceType = type;
    var found = _sourceTypes.filter(function (s) { return s.key === type; })[0];
    $('#nds-step2-title').text(found ? found.title : '');
    $('#nds-step1').removeClass('is-active');
    $('#nds-step2').addClass('is-active');
    $('#nds-footer').show();

    var comp = _components[type] ? _components[type]() : null;
    if (comp && comp.render) comp.render($('#nds-step2-content'));
  }

  function _showStep1() {
    /* Destroy current sub-component */
    var comp = _sourceType && _components[_sourceType] ? _components[_sourceType]() : null;
    if (comp && comp.destroy) comp.destroy();
    _sourceType = null;
    $('#nds-step2').removeClass('is-active');
    $('#nds-step1').addClass('is-active');
    $('#nds-footer').hide();
    $('#nds-step2-content').empty();
    $('#nds-name').val('');
  }

  function _submit() {
    var name = $('#nds-name').val().trim();
    if (!name) { $('#nds-name').focus(); return; }

    var comp = _sourceType && _components[_sourceType] ? _components[_sourceType]() : null;
    var result = comp ? comp.getValue() : null;

    if (!result) {
      if (window.Toast) Toast.warn('Please complete the source configuration');
      return;
    }

    var id = 'ds-' + Date.now();
    var meta = Object.assign({ name: name }, result.meta || {});

    if (window.DatasetStore) {
      if (_sourceType === 'integration' || _sourceType === 'database') {
        DatasetStore.registerIntegration(id, result.meta || {}, meta);
      } else {
        DatasetStore.registerSource(id, result.data || [], meta);
      }
    }

    if (window.Toast) Toast.success('Dataset "' + name + '" created');
    _destroy();
    _onCreated({ id: id, name: name });
  }

  function _destroy() {
    var comp = _sourceType && _components[_sourceType] ? _components[_sourceType]() : null;
    if (comp && comp.destroy) comp.destroy();
    if (_$overlay) { _$overlay.remove(); _$overlay = null; }
    _sourceType = null;
  }

  function _bindEvents() {
    _$overlay.on('click', '#nds-close, #nds-cancel', _destroy);
    _$overlay.on('click', '.nds-source-card', function () {
      _showStep2($(this).data('source'));
    });
    _$overlay.on('click', '#nds-back', _showStep1);
    _$overlay.on('click', '#nds-create', _submit);
    /* Close on overlay backdrop click */
    _$overlay.on('click', function (e) {
      if ($(e.target).is(_$overlay)) _destroy();
    });
  }

  return { open: open };
}());

window.NewDatasetModal = NewDatasetModal;
