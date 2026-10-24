
export default function DashboardOverview({
  leads,
  stats,
  systemHealth,
  n8nHealth,
  onNavigate
}) {
  const recentLeads = [...leads]
    .sort((a, b) =>
      new Date(b.created_at).getTime() -
      new Date(a.created_at).getTime()
    )
    .slice(0, 5);

  const formatDate = value => {
    if (!value) return '—';
    const date = new Date(value);
    return Number.isNaN(date.getTime())
      ? '—'
      : date.toLocaleString();
  };

  return (
    <div style={{ display: 'grid', gap: 24 }}>
      <section className="stats">
        {[
          ['Total Leads', stats.total, '◉'],
          ['High Priority', stats.high, '⚡'],
          ['Notifications Sent', stats.sent, '✉'],
          ['Pending Notifications', stats.pending, '◷']
        ].map(([label, value, symbol]) => (
          <div className="stat" key={label}>
            <div className="stat-top">
              <span>{label}</span>
              <span className="stat-icon">{symbol}</span>
            </div>
            <strong>{value}</strong>
          </div>
        ))}
      </section>

      <section className="panel">
        <div className="panel-heading">
          <div>
            <div className="eyebrow">LEAD ACTIVITY</div>
            <h2>Recent Customer Leads</h2>
            <p>Latest five leads from PostgreSQL.</p>
          </div>

          <button onClick={() => onNavigate('leads')}>
            View All Leads
          </button>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Customer</th>
                <th>Company</th>
                <th>Priority</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {recentLeads.map(lead => (
                <tr key={lead.id}>
                  <td>
                    <strong>{lead.full_name}</strong>
                    <small>{lead.email}</small>
                  </td>
                  <td>{lead.company || '—'}</td>
                  <td>
                    <span className={
                      'tag ' +
                      String(lead.ai_priority || 'none').toLowerCase()
                    }>
                      {lead.ai_priority || 'Unclassified'}
                    </span>
                  </td>
                  <td>{formatDate(lead.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {recentLeads.length === 0 && (
            <div className="empty">No leads available.</div>
          )}
        </div>
      </section>

      <section className="panel">
        <div className="panel-heading">
          <div>
            <div className="eyebrow">INFRASTRUCTURE</div>
            <h2>System Status</h2>
            <p>Latest reported connectivity checks.</p>
          </div>

          <button onClick={() => onNavigate('system-health')}>
            View System Health
          </button>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns:
              'repeat(auto-fit, minmax(180px, 1fr))',
            gap: 16,
            padding: 24
          }}
        >
          {[
            ['API & Database', systemHealth],
            ['n8n Service', n8nHealth]
          ].map(([label, state]) => (
            <div
              key={label}
              style={{
                border: '1px solid rgba(128,128,128,0.2)',
                borderRadius: 12,
                padding: 18
              }}
            >
              <div style={{ fontWeight: 600 }}>{label}</div>
              <div
                style={{
                  marginTop: 10,
                  fontSize: 13,
                  color: state === 'online'
                    ? '#15803d'
                    : state === 'checking'
                      ? '#64748b'
                      : '#dc2626'
                }}
              >
                ● {state === 'online'
                  ? 'Online'
                  : state === 'checking'
                    ? 'Checking'
                    : state === 'degraded'
                      ? 'Degraded'
                      : 'Unavailable'}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
