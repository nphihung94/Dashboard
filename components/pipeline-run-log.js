/**
 * pipeline-run-log.js
 * Renders the Run Log tab — table of pipeline execution history.
 *
 * API:
 *   PipelineRunLog.render($container, runs)
 *   runs: [{id, timestamp, status, duration, inputRows, outputRows, error}]
 */

var PipelineRunLog = (function () {
  'use strict';

  function render($container, runs) {
    runs = runs || [];

    if (!runs.length) {
      $container.html(
        '<div class="run-log-content">' +
        '<div class="empty-state">' +
          '<div class="empty-state__icon">▷</div>' +
          '<div class="empty-state__title">No runs yet</div>' +
          '<div class="empty-state__desc">Click "Run Pipeline" to execute and record the first run.</div>' +
        '</div></div>'
      );
      return;
    }

    var rows = runs.map(function (run, idx) {
      var statusPill = _statusPill(run.status);
      var ts = run.timestamp ? new Date(run.timestamp).toLocaleString() : '—';
      var dur = run.duration != null ? (run.duration / 1000).toFixed(2) + 's' : '—';
      return '<tr>' +
        '<td style="color:#8F8F8F;font-size:11px">#' + (idx + 1) + '</td>' +
        '<td style="font-size:12px">' + _esc(ts) + '</td>' +
        '<td>' + statusPill + '</td>' +
        '<td style="text-align:right;font-size:12px">' + _esc(dur) + '</td>' +
        '<td style="text-align:right;font-size:12px">' + (run.inputRows != null ? run.inputRows : '—') + '</td>' +
        '<td style="text-align:right;font-size:12px">' + (run.outputRows != null ? run.outputRows : '—') + '</td>' +
        (run.error ? '<td style="font-size:11px;color:#C62828;max-width:200px;overflow:hidden;text-overflow:ellipsis">' + _esc(run.error) + '</td>' : '<td></td>') +
      '</tr>';
    }).join('');

    $container.html(
      '<div class="run-log-content">' +
      '<div class="card" style="overflow:auto">' +
        '<table class="data-table">' +
          '<thead><tr>' +
            '<th>#</th>' +
            '<th>Timestamp</th>' +
            '<th>Status</th>' +
            '<th style="text-align:right">Duration</th>' +
            '<th style="text-align:right">Input Rows</th>' +
            '<th style="text-align:right">Output Rows</th>' +
            '<th>Error</th>' +
          '</tr></thead>' +
          '<tbody>' + rows + '</tbody>' +
        '</table>' +
      '</div></div>'
    );
  }

  function _statusPill(status) {
    var cls = status === 'success' ? 'run-status-pill--success'
            : status === 'error'   ? 'run-status-pill--error'
            : 'run-status-pill--running';
    var dot = status === 'success' ? '✓' : status === 'error' ? '✗' : '…';
    return '<span class="run-status-pill ' + cls + '">' + dot + ' ' + _esc(status || 'unknown') + '</span>';
  }

  function _esc(str) {
    return $('<span>').text(String(str || '')).html();
  }

  return { render: render };
}());

window.PipelineRunLog = PipelineRunLog;
