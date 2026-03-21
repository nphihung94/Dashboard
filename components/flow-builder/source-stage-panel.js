/**
 * source-stage-panel.js
 * Full-page config panel for the source stage.
 * Dataset picker, side-by-side schema view, merge rule configuration.
 *
 * API:
 *   SourceStagePanel.render($container, flowStage, flowDef, callbacks)
 *   callbacks: { onSave(updatedStage, outputData), onEdit(flowStage) }
 */

var SourceStagePanel = (function () {
  'use strict';

  function render($container, flowStage, flowDef, callbacks) {
    callbacks = callbacks || {};
    var datasets   = window.DatasetStore ? DatasetStore.list() : [];
    var rules      = flowStage.rules || { sourceIds: [], mergeType: null, mergeConfig: {} };
    var isReadOnly = flowStage.status === 'saved';
    var dis        = isReadOnly ? ' disabled' : '';
    var actionBtn  = isReadOnly
      ? '<button class="btn btn--ghost fss-edit-btn">Edit</button>'
      : '<button class="btn btn--primary fss-save-btn">Save Stage</button>';
    var selectedIds = rules.sourceIds || [];

    var listHtml = datasets.map(function (ds) {
      var chk = selectedIds.indexOf(ds.id) !== -1 ? ' checked' : '';
      return '<label class="fss-dataset-item">' +
        '<input type="checkbox" class="fss-ds-check" value="' + _esc(ds.id) + '"' + chk + dis + ' />' +
        '<span class="fss-ds-name">' + _esc(ds.name || ds.id) + '</span>' +
        '<span class="fss-ds-meta">(' + (ds.rows || 0) + 'r, ' + (ds.cols || 0) + 'c)</span></label>';
    }).join('') || '<span style="color:#888;font-size:12px">No datasets</span>';

    $container.html(
      '<div class="fss-panel">' +
        '<div class="fss-header"><span class="fss-title">Source Stage</span>' + actionBtn + '</div>' +
        '<div class="fss-section-title">Datasets</div>' +
        '<div class="fss-search-row">' +
          '<input class="form-input fss-search" type="text" placeholder="Search datasets\u2026"' + dis + ' />' +
          '<button class="btn btn--ghost btn--sm fss-quick-add" title="New Dataset">+ New Dataset</button>' +
        '</div>' +
        '<div class="fss-dataset-list">' + listHtml + '</div>' +
        '<div class="fss-schemas"></div>' +
        '<div class="fss-merge-config" style="display:none">' +
          '<div class="fss-section-title">Merge Configuration</div>' +
          '<div class="form-group"><label class="form-label">Merge Type</label>' +
            '<select class="form-select fss-merge-type"' + dis + '><option value="JOIN">JOIN</option><option value="APPEND">APPEND</option></select></div>' +
          '<div class="fss-join-config"><div class="fss-key-row">' +
            '<div class="form-group"><label class="form-label">Left Key</label><select class="form-select fss-left-key"' + dis + '><option value="">— select —</option></select></div>' +
            '<div class="form-group"><label class="form-label">Right Key</label><select class="form-select fss-right-key"' + dis + '><option value="">— select —</option></select></div>' +
            '<div class="form-group"><label class="form-label">Join Type</label>' +
              '<select class="form-select fss-join-type"' + dis + '><option value="left">Left</option><option value="inner">Inner</option></select></div>' +
          '</div></div>' +
        '</div>' +
        '<div class="fss-section-title">Output Schema</div>' +
        '<div class="fss-output-preview"><span class="fss-preview-text">Select sources to preview schema</span></div>' +
      '</div>'
    );
    /* Quick-add button always bound regardless of read-only state */
    $container.on('click', '.fss-quick-add', function () { window.location.hash = '#dataset'; });

    _bindEvents($container, flowStage, flowDef, callbacks, rules);
    _updateSchemas($container, selectedIds);
    if (selectedIds.length > 1) {
      $container.find('.fss-merge-config').show();
      if (rules.mergeType) $container.find('.fss-merge-type').val(rules.mergeType);
      if (rules.mergeType !== 'JOIN') $container.find('.fss-join-config').hide();
      if (rules.mergeConfig && rules.mergeConfig.joinType) $container.find('.fss-join-type').val(rules.mergeConfig.joinType);
    }
  }

  function _bindEvents($container, flowStage, flowDef, callbacks, rules) {
    $container.off('.fss');
    $container.on('input.fss', '.fss-search', function () {
      var q = $(this).val().toLowerCase();
      $container.find('.fss-dataset-item').each(function () { $(this).toggle($(this).text().toLowerCase().indexOf(q) !== -1); });
    });
    $container.on('change.fss', '.fss-ds-check', function () {
      var ids = _selectedIds($container);
      $container.find('.flow-error-banner, .flow-inline-error').fadeOut(150, function () { $(this).remove(); });
      _updateSchemas($container, ids);
      $container.find('.fss-merge-config').toggle(ids.length >= 2);
      _updateOutputPreview($container, ids);
    });
    $container.on('change.fss', '.fss-merge-type', function () {
      $container.find('.fss-join-config').toggle($(this).val() === 'JOIN');
    });
    $container.on('click.fss', '.fss-save-btn', function () { _doSave($container, flowStage, callbacks); });
    $container.on('click.fss', '.fss-edit-btn', function () {
      flowStage.status = 'draft';
      if (callbacks.onEdit) callbacks.onEdit(flowStage);
      render($container, flowStage, flowDef, callbacks);
    });
  }

  function _selectedIds($c) {
    var ids = [];
    $c.find('.fss-ds-check:checked').each(function () { ids.push($(this).val()); });
    return ids;
  }

  function _updateSchemas($container, ids) {
    if (!ids.length) { $container.find('.fss-schemas').html(''); return; }
    var html = '<div class="fss-schema-row">';
    ids.forEach(function (id) {
      var cols = window.DatasetStore ? DatasetStore.getColumns(id) : [];
      var rows = cols.map(function (c) {
        var d = DatasetStore.get(id);
        var t = (d && d.length && typeof d[0][c] === 'number') ? 'number' : 'string';
        return '<tr><td>' + _esc(c) + '</td><td class="schema-type">' + t + '</td></tr>';
      }).join('') || '<tr><td colspan="2" style="color:#aaa">No data</td></tr>';
      html += '<div class="fss-schema-card"><div class="fss-schema-title">' + _esc(id) + '</div>' +
        '<table class="schema-table"><thead><tr><th>Field</th><th>Type</th></tr></thead><tbody>' + rows + '</tbody></table></div>';
    });
    $container.find('.fss-schemas').html(html + '</div>');
    if (ids.length >= 2) {
      var _opt = function (c) { return '<option value="' + _esc(c) + '">' + _esc(c) + '</option>'; };
      var lCols = DatasetStore.getColumns(ids[0]); var rCols = DatasetStore.getColumns(ids[1]);
      $container.find('.fss-left-key').html('<option value="">— select —</option>' + lCols.map(_opt).join(''));
      $container.find('.fss-right-key').html('<option value="">— select —</option>' + rCols.map(_opt).join(''));
    }
  }

  function _updateOutputPreview($container, ids) {
    if (!ids.length) { $container.find('.fss-preview-text').text('Select sources to preview schema'); return; }
    var store = window.DatasetStore;
    var data = (store && store.get(ids[0])) || [];
    if (ids.length > 1) data = data.concat((store && store.get(ids[1])) || []);
    var schema = window.FlowRuleEngine ? FlowRuleEngine.inferSchema(data) : { columns: [] };
    $container.find('.fss-preview-text').text(schema.columns.map(function (c) { return c.name; }).join(', ') + ' (' + schema.columns.length + ' columns)');
  }

  function _showErrorBanner($container, errors) {
    $container.find('.flow-error-banner').remove();
    var errHtml = errors.map(function (e) {
      return '<div class="flow-error-banner__item">' + _esc(e) + '</div>';
    }).join('');
    $container.find('.fss-dataset-list')
      .before('<div class="flow-error-banner">' + errHtml + '</div>');
  }

  function _doSave($container, flowStage, callbacks) {
    // Clear previous inline errors
    $container.find('.flow-error-banner').remove();

    var ids = _selectedIds($container);
    var mergeType = $container.find('.fss-merge-type').val() || null;
    var mergeConfig = { leftKey: $container.find('.fss-left-key').val() || '', rightKey: $container.find('.fss-right-key').val() || '', joinType: $container.find('.fss-join-type').val() || 'left' };
    var rules = { sourceIds: ids, mergeType: ids.length > 1 ? mergeType : null, mergeConfig: ids.length > 1 ? mergeConfig : {} };
    var vr = window.FlowRuleEngine ? FlowRuleEngine.validateStage({ type: 'source', rules: rules }, null) : { valid: true, errors: [] };
    if (!vr.valid) {
      flowStage.error = vr.errors.join('; ');
      _showErrorBanner($container, vr.errors);
      return;
    }
    flowStage.rules       = rules;
    flowStage.displayText = window.FlowRuleEngine ? FlowRuleEngine.generateDisplayText(flowStage) : ids.join('+');
    var execResult = window.FlowRuleEngine ? FlowRuleEngine.executeFlowStage(flowStage, [], window.DatasetStore) : { data: [], schema: { columns: [] }, error: null };
    if (execResult.error) {
      flowStage.status = 'error';
      flowStage.error  = execResult.error;
      // Execution errors keep toast (runtime failure, not validation)
      if (window.Toast) Toast.error('Execution error: ' + execResult.error);
      if (callbacks.onSave) callbacks.onSave(flowStage, null);
      return;
    }
    flowStage.outputSchema   = execResult.schema;
    flowStage._lastExecData  = execResult.data;
    flowStage.status         = 'saved';
    flowStage.error          = null;
    if (callbacks.onSave) callbacks.onSave(flowStage, execResult.data);
  }

  function _esc(str) { return $('<span>').text(String(str || '')).html(); }

  return { render: render };
}());

window.SourceStagePanel = SourceStagePanel;
