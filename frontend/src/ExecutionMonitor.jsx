
import { useEffect, useMemo, useState } from 'react';

export default function ExecutionMonitor() {
  const [executions, setExecutions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastChecked, setLastChecked] = useState(null);

  async function loadExecutions() {
    try {
      const response = await fetch('/api/monitoring/executions', {
        cache: 'no-store'
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const result = await response.json();

      if (!result.success || !Array.isArray(result.executions)) {
        throw new Error('Invalid execution data');
      }

      setExecutions(result.executions);
      setLastChecked(new Date());
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadExecutions();

    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        loadExecutions();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const stats = useMemo(() => ({
    successful: executions.filter(
      e => e.status === 'success'
    ).length,
    failed: executions.filter(
      e => ['error', 'crashed'].includes(e.status)
    ).length,
    running: executions.filter(
      e => e.status === 'running'
    ).length
  }), [executions]);

  const formatDate = value => {
    if (!value) return '—';

    const date = new Date(value);
    return Number.isNaN(date.getTime())
      ? '—'
      : date.toLocaleString();
  };

  const statusColors = {
    success: '#16a34a',
    error: '#dc2626',
    crashed: '#dc2626',
    running: '#2563eb',
    waiting: '#d97706',
    canceled: '#64748b'
  };

  return (
    <section className="panel" id="executions" style={{ marginTop: 24 }}>
      <div className="panel-heading">
        <div>
          <div className="eyebrow">AUTOMATION MONITORING</div>
          <h2>n8n Execution Monitoring Center</h2>
          <p>
            Recent workflow executions and operational status.
          </p>
        </div>

        <button onClick={loadExecutions} disabled={loading}>
          ↻ Refresh Executions
        </button>
      </div>

      {error && (
        <div className="error">
          Unable to refresh execution history: {error}
          {executions.length > 0 && (
            <span> — Showing previously loaded data.</span>
          )}
        </div>
      )}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns:
            'repeat(auto-fit, minmax(150px, 1fr))',
          gap: 14,
          padding: '18px 24px'
        }}
      >
        {[
          ['Successful', stats.successful, '#16a34a'],
          ['Failed', stats.failed, '#dc2626'],
          ['Running', stats.running, '#2563eb']
        ].map(([label, count, color]) => (
          <div
            key={label}
            style={{
              padding: 18,
              border: '1px solid rgba(128,128,128,0.2)',
              borderRadius: 12
            }}
          >
            <div style={{ fontSize: 13, opacity: 0.75 }}>
              {label}
            </div>
            <strong
              style={{
                display: 'block',
                marginTop: 8,
                fontSize: 28,
                color
              }}
            >
              {count}
            </strong>
          </div>
        ))}
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Execution ID</th>
              <th>Status</th>
              <th>Started</th>
              <th>Stopped</th>
              <th>Finished</th>
            </tr>
          </thead>

          <tbody>
            {executions.map(item => (
              <tr key={item.id}>
                <td>#{item.id}</td>

                <td>
                  <span
                    style={{
                      fontWeight: 600,
                      color: statusColors[item.status] || '#64748b'
                    }}
                  >
                    {item.status || 'Unknown'}
                  </span>
                </td>

                <td>{formatDate(item.startedAt)}</td>
                <td>{formatDate(item.stoppedAt)}</td>
                <td>
                  {item.finished === true
                    ? 'Yes'
                    : item.finished === false
                      ? 'No'
                      : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {!loading && !error && executions.length === 0 && (
          <div className="empty">
            No execution history available.
          </div>
        )}
      </div>

      <p
        style={{
          padding: '12px 24px',
          fontSize: 12,
          opacity: 0.7
        }}
      >
        Latest 20 executions only. Refreshes every 30 seconds.
        {lastChecked && (
          <> Last checked: {lastChecked.toLocaleTimeString()}.</>
        )}
        {' '}Successful execution does not necessarily confirm
        Gmail delivery.
      </p>
    </section>
  );
}
