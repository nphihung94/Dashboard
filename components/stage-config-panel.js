/**
 * stage-config-panel.js
 * Slide-in panel for editing a pipeline stage's configuration.
 * Renders different form fields per stage type.
 *
 * API:
 *   StageConfigPanel.open(stage, pipeline, onSave)
 *   StageConfigPanel.close()
 */

var StageConfigPanel = (function () {
  'use strict';

  var _PANEL_ID = 'stage-config-panel';
  var _onSave = null;

  var _closeSvg = '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="4" y1="4" x2="12" y2="12"/><line x1="12" y1="4" x2="4" y2="12"/></svg>';

  function open(stage, pipeline, onSave) {
    _onSave = onSave || function () {};
    var $panel = $('#' + _PANEL_ID);

    if (!$panel.length) {
      $panel = $('<div class="stage-config-panel" id="' + _PANEL_ID + '"></div>');
      $('body').append($panel);
    }

    $panel.html(_buildHTML(stage, pipeline));
    setTimeout(function () { $panel.addClass('is-open'); }, 10);

    _bindEvents($panel, stage, pipeline);
  }

  function close() {
    var $panel = $('#' + _PANEL_ID);
    $panel.removeClass('is-open');
  }

  function _buildHTML(stage, pipeline) {
    var typeLabel = stage.type.replace(/([A-Z])/g, ' $1').replace(/^./, function (c) { return c.toUpperCase(); });

    return '<div class="stage-config-panel__header">' +
        '<span class="stage-config-panel__title">Configure: ' + typeLabel + '</span>' +
        '<button class="btn-icon" id="scp-close-btn">' + _closeSvg + '</button>' +
      '</div>' +
      '<div class="stage-config-panel__body">' +
        '<div class="form-group">' +
          '<label class="form-label">Stage ID</label>' +
          '<input class="form-input" value="' + _esc(stage.id || '') + '" readonly ' +
            'style="background:#F8F9FA;color:#8F8F8F" />' +
        '</div>' +
        _buildTypeFields(stage, pipeline) +
      '</div>' +
      '<div class="stage-config-panel__footer">' +
        '<button class="btn btn--primary" id="scp-save-btn">Save</button>' +
        '<button class="btn btn--ghost" id="scp-cancel-btn">Cancel</button>' +
      '</div>';
  }

  function _buildTypeFields(stage, pipeline) {
    var c = stage.config || {};
    switch (stage.type) {
      case 'source':
        return _field('Source Dataset ID', 'scp-sourceId', c.sourceId || '');

      case 'removeColumns':
        return _field('Keep columns (comma-separated)', 'scp-keep', (c.keep || []).join(', ')) +
               '<div style="font-size:11px;color:#8F8F8F;margin-top:-8px">Rows keep only these columns</div>';

      case 'filterRows':
        return '<div class="form-group">' +
          '<label class="form-label">Logic</label>' +
          '<select class="form-select" id="scp-logic">' +
            '<option' + (c.logic === 'AND' ? ' selected' : '') + '>AND</option>' +
            '<option' + (c.logic === 'OR'  ? ' selected' : '') + '>OR</option>' +
          '</select></div>' +
          '<div class="form-group">' +
          '<label class="form-label">Conditions (JSON array)</label>' +
          '<textarea class="form-textarea" id="scp-conditions" rows="5">' +
            _esc(JSON.stringify(c.conditions || [], null, 2)) + '</textarea></div>';

      case 'replaceValues':
        return _field('Column', 'scp-column', c.column || '') +
          '<div class="form-group"><label class="form-label">Replacements (JSON array)</label>' +
          '<textarea class="form-textarea" id="scp-replacements" rows="5">' +
            _esc(JSON.stringify(c.replacements || [], null, 2)) + '</textarea></div>';

      case 'groupBy':
        return _field('Group by fields (comma-separated)', 'scp-groupBy', (c.groupBy || []).join(', ')) +
          '<div class="form-group"><label class="form-label">Aggregates (JSON array)</label>' +
          '<textarea class="form-textarea" id="scp-aggregates" rows="6">' +
            _esc(JSON.stringify(c.aggregates || [], null, 2)) + '</textarea></div>';

      case 'addColumn':
        return '<div class="form-group"><label class="form-label">Columns (JSON array: [{name, formula}])</label>' +
          '<textarea class="form-textarea" id="scp-columns" rows="5">' +
            _esc(JSON.stringify(c.columns || [], null, 2)) + '</textarea></div>';

      case 'sort':
        return _field('Sort field', 'scp-field', c.field || '') +
          '<div class="form-group"><label class="form-label">Direction</label>' +
          '<select class="form-select" id="scp-direction">' +
            '<option value="asc"' + (c.direction !== 'desc' ? ' selected' : '') + '>Ascending</option>' +
            '<option value="desc"' + (c.direction === 'desc' ? ' selected' : '') + '>Descending</option>' +
          '</select></div>';

      case 'merge':
        return _field('Right Dataset ID', 'scp-datasetId', c.datasetId || '') +
          _field('Left join key', 'scp-leftKey', c.leftKey || '') +
          _field('Right join key', 'scp-rightKey', c.rightKey || '') +
          '<div class="form-group"><label class="form-label">Join type</label>' +
          '<select class="form-select" id="scp-joinType">' +
            '<option value="left"'  + (c.type !== 'inner' ? ' selected' : '') + '>Left</option>' +
            '<option value="inner"' + (c.type === 'inner' ? ' selected' : '') + '>Inner</option>' +
          '</select></div>';

      case 'output':
        return _field('Output dataset name', 'scp-outputName', c.name || '');

      default:
        return '<div class="form-group"><label class="form-label">Config (JSON)</label>' +
          '<textarea class="form-textarea" id="scp-raw" rows="8">' +
            _esc(JSON.stringify(c, null, 2)) + '</textarea></div>';
    }
  }

  function _field(label, id, value) {
    return '<div class="form-group">' +
      '<label class="form-label">' + label + '</label>' +
      '<input class="form-input" id="' + id + '" value="' + _esc(String(value)) + '" />' +
    '</div>';
  }

  function _collectConfig($panel, stage) {
    var c = Object.assign({}, stage.config || {});
    switch (stage.type) {
      case 'source':        c.sourceId     = $panel.find('#scp-sourceId').val(); break;
      case 'removeColumns': c.keep         = $panel.find('#scp-keep').val().split(',').map(function (s) { return s.trim(); }).filter(Boolean); break;
      case 'filterRows':
        c.logic      = $panel.find('#scp-logic').val();
        try { c.conditions = JSON.parse($panel.find('#scp-conditions').val()); } catch (e) {}
        break;
      case 'replaceValues':
        c.column = $panel.find('#scp-column').val();
        try { c.replacements = JSON.parse($panel.find('#scp-replacements').val()); } catch (e) {}
        break;
      case 'groupBy':
        c.groupBy = $panel.find('#scp-groupBy').val().split(',').map(function (s) { return s.trim(); }).filter(Boolean);
        try { c.aggregates = JSON.parse($panel.find('#scp-aggregates').val()); } catch (e) {}
        break;
      case 'addColumn':
        try { c.columns = JSON.parse($panel.find('#scp-columns').val()); } catch (e) {}
        break;
      case 'sort':          c.field = $panel.find('#scp-field').val(); c.direction = $panel.find('#scp-direction').val(); break;
      case 'merge':
        c.datasetId = $panel.find('#scp-datasetId').val();
        c.leftKey   = $panel.find('#scp-leftKey').val();
        c.rightKey  = $panel.find('#scp-rightKey').val();
        c.type      = $panel.find('#scp-joinType').val();
        break;
      case 'output':        c.name = $panel.find('#scp-outputName').val(); break;
      default:
        try { c = JSON.parse($panel.find('#scp-raw').val()); } catch (e) {}
    }
    return c;
  }

  function _bindEvents($panel, stage, pipeline) {
    $panel.on('click', '#scp-close-btn, #scp-cancel-btn', close);

    $panel.on('click', '#scp-save-btn', function () {
      var newConfig = _collectConfig($panel, stage);
      stage.config = newConfig;
      if (window.DatasetStore) DatasetStore.savePipeline(pipeline);
      close();
      if (_onSave) _onSave(stage);
      if (window.Toast) Toast.success('Stage configuration saved');
    });
  }

  function _esc(str) {
    return $('<span>').text(String(str || '')).html();
  }

  return { open: open, close: close };
}());

window.StageConfigPanel = StageConfigPanel;
