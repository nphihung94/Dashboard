/**
 * transform-stage-panel.js
 * Full-page config panel for transform stages (filter, select, aggregate,
 * sort, limit, formula, pivot, unpivot).
 * Delegates form rendering/collection to StageRuleForms / StageRuleFormsAdvanced.
 *
 * API:
 *   TransformStagePanel.render($container, flowStage, flowDef, callbacks)
 *   callbacks: { onSave(updatedStage, outputData), onEdit(flowStage) }
 */

var TransformStagePanel = (function () {
  'use strict';

  var _TYPE_LABELS = {
    filter: 'Filter', select: 'Select / Rename', aggregate: 'Aggregate',
    sort: 'Sort', limit: 'Limit', formula: 'Formula',
    pivot: 'Pivot', unpivot: 'Unpivot'
  };

  function render($container, flowStage, flowDef, callbacks) {
    callbacks = callbacks || {};
    var inputSchema = _getInputSchema(flowStage, flowDef);
    var isReadOnly  = flowStage.status === 'saved';
    var typeLabel   = _TYPE_LABELS[flowStage.type] || flowStage.type;

    /* Compute step context: "Step X of Y" */
    var stepContext = '';
    if (flowDef && flowDef.stages) {
      for (var i = 0; i < flowDef.stages.length; i++) {
        if (flowDef.stages[i].id === flowStage.id) {
          stepContext = 'Step ' + (i + 1) + ' of ' + flowDef.stages.length + ' \u2014 ';
          break;
        }
      }
    }

    $container.html(_buildShell(flowStage, typeLabel, stepContext, inputSchema, isReadOnly));

    var $formArea = $container.find('.tsp-form-area');
    StageRuleForms.render($formArea, flowStage.type, flowStage.rules || {}, inputSchema, isReadOnly);

    _bindEvents($container, flowStage, flowDef, callbacks, inputSchema, isReadOnly);
  }

  function _buildShell(flowStage, typeLabel, stepContext, inputSchema, isReadOnly) {
    var cols = (inputSchema && inputSchema.columns || []);
    var schemaText = cols.length
      ? cols.map(function (c) { return _esc(c.name) + ' <em>(' + _esc(c.type) + ')</em>'; }).join(', ')
      : '<span style="color:#aaa">No input schema — save source stage first</span>';

    var actionBtn = isReadOnly
      ? '<button class="btn btn--ghost tsp-edit-btn">Edit</button>'
      : '<button class="btn btn--primary tsp-save-btn">Save Stage</button>';

    return '<div class="tsp-panel">' +
      '<div class="tsp-header">' +
        '<span class="tsp-title">' +
          (stepContext ? '<span class="tsp-step-context">' + _esc(stepContext) + '</span>' : '') +
          _esc(typeLabel) + ' Stage' +
        '</span>' +
        '<span class="tsp-stage-id" style="color:#aaa;font-size:11px;margin-left:8px">' + _esc(flowStage.id) + '</span>' +
        actionBtn +
      '</div>' +
      '<div class="tsp-input-schema">' +
        '<span class="tsp-schema-label">Input: </span>' + schemaText +
      '</div>' +
      '<div class="tsp-form-area' + (isReadOnly ? ' flow-form--readonly' : '') + '"></div>' +
    '</div>';
  }

  function _getInputSchema(flowStage, flowDef) {
    if (!flowDef || !flowDef.stages) return null;
    var stages = flowDef.stages;
    for (var i = 0; i < stages.length; i++) {
      if (stages[i].id === flowStage.id) {
        // Return previous stage's outputSchema
        if (i > 0 && stages[i - 1].outputSchema) return stages[i - 1].outputSchema;
        return null;
      }
    }
    return null;
  }

  function _bindEvents($container, flowStage, flowDef, callbacks, inputSchema, isReadOnly) {
    $container.off('.tsp');
    $container.on('click.tsp', '.tsp-save-btn', function () {
      _doSave($container, flowStage, flowDef, callbacks, inputSchema);
    });

    $container.on('click.tsp', '.tsp-edit-btn', function () {
      flowStage.status = 'draft';
      if (callbacks.onEdit) callbacks.onEdit(flowStage);
      render($container, flowStage, flowDef, callbacks);
    });

    // Clear inline errors when user starts editing any field
    $container.on('change.tsp input.tsp', '.tsp-form-area select, .tsp-form-area input', function () {
      $(this).removeClass('is-invalid');
      $container.find('.flow-error-banner, .flow-inline-error').fadeOut(150, function () { $(this).remove(); });
    });
  }

  function _showErrorBanner($container, errors) {
    $container.find('.flow-error-banner').remove();
    var errHtml = errors.map(function (e) {
      return '<div class="flow-error-banner__item">' + _esc(e) + '</div>';
    }).join('');
    var $formArea = $container.find('.tsp-form-area');
    $formArea.before('<div class="flow-error-banner">' + errHtml + '</div>');
    // Highlight first visible input as visual cue
    $formArea.find('select, input').filter(':visible').first().addClass('is-invalid');
  }

  function _doSave($container, flowStage, flowDef, callbacks, inputSchema) {
    var $formArea = $container.find('.tsp-form-area');
    // Clear previous error state
    $container.find('.flow-error-banner').remove();
    $formArea.find('.is-invalid').removeClass('is-invalid');

    var rules = StageRuleForms.collect($formArea, flowStage.type);

    // Validate — show inline banner instead of toast
    var vResult = window.FlowRuleEngine
      ? FlowRuleEngine.validateStage({ type: flowStage.type, rules: rules }, inputSchema)
      : { valid: true, errors: [] };
    if (!vResult.valid) {
      flowStage.error = vResult.errors.join('; ');
      _showErrorBanner($container, vResult.errors);
      return;
    }

    // Execute to get output data + schema
    var inputData = _resolveInputData(flowStage, flowDef);
    var execResult = window.FlowRuleEngine
      ? FlowRuleEngine.executeFlowStage({ type: flowStage.type, rules: rules }, inputData, window.DatasetStore)
      : { data: inputData, schema: { columns: [] }, error: null };

    if (execResult.error) {
      flowStage.status = 'error';
      flowStage.error  = execResult.error;
      // Execution errors keep toast (runtime failure, not validation)
      if (window.Toast) Toast.error('Execution error: ' + execResult.error);
      if (callbacks.onSave) callbacks.onSave(flowStage, null);
      return;
    }

    // Commit
    flowStage.rules         = rules;
    flowStage.outputSchema  = execResult.schema;
    flowStage._lastExecData = execResult.data;
    flowStage.displayText   = window.FlowRuleEngine ? FlowRuleEngine.generateDisplayText(flowStage) : flowStage.type;
    flowStage.status        = 'saved';
    flowStage.error         = null;

    if (callbacks.onSave) callbacks.onSave(flowStage, execResult.data);
  }

  function _resolveInputData(flowStage, flowDef) {
    if (!flowDef || !flowDef.stages) return [];
    var stages = flowDef.stages;
    for (var i = 1; i < stages.length; i++) {
      if (stages[i].id === flowStage.id) {
        /* Use cached output from the immediately preceding stage */
        return stages[i - 1]._lastExecData || [];
      }
    }
    return [];
  }

  function _esc(str) { return $('<span>').text(String(str || '')).html(); }

  return { render: render };
}());

window.TransformStagePanel = TransformStagePanel;
