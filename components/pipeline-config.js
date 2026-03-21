/**
 * pipeline-config.js
 * Renders the Configuration tab for a pipeline: General, Schedule,
 * Data Sources, Output Schema, and Danger Zone cards.
 *
 * API:
 *   PipelineConfig.render($container, pipeline, options)
 *   options: { onSave(updated), onDelete(id) }
 */

var PipelineConfig = (function () {
  'use strict';

  var _debounceTimer = null;

  function render($container, pipeline, options) {
    options = options || {};
    $container.html(_buildHTML(pipeline));
    _bindEvents($container, pipeline, options);
  }

  function _buildHTML(p) {
    var sources = _getSourceItems(p);
    var fields  = _getOutputFields(p);

    return '<div class="settings-content">' +
      '<div class="settings-grid">' +

      /* General card */
      '<div class="settings-card">' +
        '<div class="settings-card__title">General</div>' +
        '<div class="form-group">' +
          '<label class="form-label">Pipeline name</label>' +
          '<input class="form-input" id="cfg-name" value="' + _esc(p.name || '') + '" />' +
        '</div>' +
        '<div class="form-group">' +
          '<label class="form-label">Type</label>' +
          '<select class="form-select" id="cfg-type">' +
            ['ETL','Analytics','Reporting'].map(function (t) {
              return '<option' + (p.type === t ? ' selected' : '') + '>' + t + '</option>';
            }).join('') +
          '</select>' +
        '</div>' +
        '<div class="form-group">' +
          '<label class="form-label">Description</label>' +
          '<textarea class="form-textarea" id="cfg-desc">' + _esc(p.description || '') + '</textarea>' +
        '</div>' +
        '<div class="form-group">' +
          '<label class="form-label">Tags (comma-separated)</label>' +
          '<input class="form-input" id="cfg-tags" value="' + _esc((p.tags || []).join(', ')) + '" />' +
        '</div>' +
      '</div>' +

      /* Schedule card */
      '<div class="settings-card">' +
        '<div class="settings-card__title">Schedule</div>' +
        '<div class="toggle-wrap">' +
          '<label class="toggle">' +
            '<input type="checkbox" id="cfg-sched-enabled"' + (p.schedule && p.schedule.enabled ? ' checked' : '') + ' />' +
            '<span class="toggle__slider"></span>' +
          '</label>' +
          '<span class="toggle-label">Enable scheduled runs</span>' +
        '</div>' +
        '<div class="form-group" id="cfg-sched-fields"' + (p.schedule && p.schedule.enabled ? '' : ' style="display:none"') + '>' +
          '<label class="form-label">Frequency</label>' +
          '<select class="form-select" id="cfg-sched-freq">' +
            ['hourly','daily','weekly','monthly'].map(function (f) {
              return '<option value="' + f + '"' + (p.schedule && p.schedule.frequency === f ? ' selected' : '') + '>' +
                f.charAt(0).toUpperCase() + f.slice(1) + '</option>';
            }).join('') +
          '</select>' +
          '<label class="form-label" style="margin-top:8px">Time (HH:MM)</label>' +
          '<input class="form-input" id="cfg-sched-time" value="' + _esc(p.schedule && p.schedule.time || '06:00') + '" />' +
          '<div style="margin-top:8px;font-size:11px;color:#8F8F8F" id="cfg-cron-preview"></div>' +
        '</div>' +
      '</div>' +

      /* Data Sources card */
      '<div class="settings-card">' +
        '<div class="settings-card__title">Data Sources</div>' +
        (sources.length ? sources.map(function (s) {
          return '<div class="source-item">' +
            '<span class="sidebar__status-dot sidebar__status-dot--healthy" style="margin-right:6px"></span>' +
            '<span style="flex:1">' + _esc(s) + '</span>' +
            '<button class="btn btn--ghost btn--sm">Edit</button>' +
          '</div>';
        }).join('') :
        '<div style="color:#8F8F8F;font-size:12px">No data sources configured</div>') +
        '<button class="btn btn--ghost btn--sm" style="margin-top:8px">+ Add Source</button>' +
      '</div>' +

      /* Output Schema card */
      '<div class="settings-card">' +
        '<div class="settings-card__title">Output Schema</div>' +
        (fields.length ? fields.map(function (f) {
          return '<div class="field-item">' +
            '<span style="flex:1;font-size:12px">' + _esc(f.name) + '</span>' +
            '<span class="field-type-badge">' + _esc(f.type) + '</span>' +
          '</div>';
        }).join('') :
        '<div style="color:#8F8F8F;font-size:12px">Run pipeline to infer schema</div>') +
      '</div>' +

      /* Danger Zone card */
      '<div class="settings-card danger-zone" style="grid-column:1/-1">' +
        '<div class="settings-card__title">Danger Zone</div>' +
        '<div style="display:flex;align-items:center;justify-content:space-between">' +
          '<div>' +
            '<div style="font-size:13px;font-weight:500">Delete this pipeline</div>' +
            '<div style="font-size:12px;color:#8F8F8F;margin-top:2px">This action cannot be undone.</div>' +
          '</div>' +
          '<button class="btn btn--danger" id="cfg-delete-btn">Delete Pipeline</button>' +
        '</div>' +
      '</div>' +

      '</div></div>'; /* end settings-grid + settings-content */
  }

  function _getSourceItems(p) {
    var sources = [];
    (p.stages || []).forEach(function (s) {
      if (s.type === 'source' && s.config && s.config.sourceId) {
        sources.push(s.config.sourceId);
      }
    });
    return sources;
  }

  function _getOutputFields(p) {
    var outputName = null;
    (p.stages || []).forEach(function (s) {
      if (s.type === 'output' && s.config && s.config.name) outputName = s.config.name;
    });
    if (!outputName || !window.DatasetStore) return [];
    var data = DatasetStore.get(outputName);
    if (!data || !data.length) return [];
    return Object.keys(data[0]).map(function (k) {
      var sample = data[0][k];
      return { name: k, type: typeof sample === 'number' ? 'number' : 'string' };
    });
  }

  function _bindEvents($container, pipeline, options) {
    /* Schedule toggle */
    $container.on('change', '#cfg-sched-enabled', function () {
      $(this).is(':checked')
        ? $container.find('#cfg-sched-fields').show()
        : $container.find('#cfg-sched-fields').hide();
      _debounceSave($container, pipeline, options);
    });

    /* Auto-save on any input change */
    $container.on('input change', '.form-input, .form-select, .form-textarea, input[type=checkbox]',
      function () { _debounceSave($container, pipeline, options); });

    /* Delete */
    $container.on('click', '#cfg-delete-btn', function () {
      if (!confirm('Delete pipeline "' + pipeline.name + '"? This cannot be undone.')) return;
      if (window.DatasetStore) DatasetStore.deletePipeline(pipeline.id);
      if (options.onDelete) options.onDelete(pipeline.id);
      location.hash = '#dashboard';
      if (window.Toast) Toast.success('Pipeline deleted');
    });
  }

  function _debounceSave($container, pipeline, options) {
    clearTimeout(_debounceTimer);
    _debounceTimer = setTimeout(function () {
      var updated = Object.assign({}, pipeline, {
        name:        $container.find('#cfg-name').val().trim() || pipeline.name,
        type:        $container.find('#cfg-type').val(),
        description: $container.find('#cfg-desc').val().trim(),
        tags:        $container.find('#cfg-tags').val().split(',').map(function (t) { return t.trim(); }).filter(Boolean),
        schedule: {
          enabled:   $container.find('#cfg-sched-enabled').is(':checked'),
          frequency: $container.find('#cfg-sched-freq').val(),
          time:      $container.find('#cfg-sched-time').val()
        }
      });
      if (window.DatasetStore) DatasetStore.savePipeline(updated);
      if (options.onSave) options.onSave(updated);
    }, 600);
  }

  function _esc(str) {
    return $('<span>').text(String(str || '')).html();
  }

  return { render: render };
}());

window.PipelineConfig = PipelineConfig;
