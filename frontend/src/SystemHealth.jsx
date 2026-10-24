
export default function SystemHealth({
  systemHealth,
  n8nHealth,
  onRefresh
}) {
  const services = [
    {
      name: 'API Server',
      description: 'Node.js backend connectivity',
      status: systemHealth
    },
    {
      name: 'PostgreSQL Database',
      description: 'CRM database connectivity',
      status: systemHealth
    },
    {
      name: 'n8n Automation Server',
      description: 'n8n service availability',
      status: n8nHealth
    }
  ];

  const getColor = status => {
    if (status === 'online') return '#16a34a';
    if (status === 'checking') return '#64748b';
    if (status === 'degraded') return '#d97706';
    return '#dc2626';
  };

  const getLabel = status => {
    if (status === 'online') return 'Online';
    if (status === 'checking') return 'Checking';
    if (status === 'degraded') return 'Degraded';
    return 'Unavailable';
  };

  return (
    <div style={{ display: 'grid', gap: 24 }}>
      <section className="panel">
        <div className="panel-heading">
          <div>
            <div className="eyebrow">INFRASTRUCTURE</div>
            <h2>System Health Monitoring</h2>
            <p>
              Monitor backend, database, and automation service availability.
            </p>
          </div>

          <button onClick={onRefresh}>
            ↻ Check Again
          </button>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns:
              'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 18,
            padding: 24
          }}
        >
          {services.map(service => (
            <div
              key={service.name}
              style={{
                padding: 24,
                border: '1px solid #e2e8f0',
                borderRadius: 12,
                background: '#ffffff'
              }}
            >
              <div style={{
                fontSize: 14,
                color: '#64748b',
                marginBottom: 12
              }}>
                {service.name}
              </div>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                marginBottom: 12
              }}>
                <span style={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  background: getColor(service.status)
                }} />

                <strong style={{
                  fontSize: 22,
                  color: getColor(service.status)
                }}>
                  {getLabel(service.status)}
                </strong>
              </div>

              <p style={{
                fontSize: 13,
                color: '#64748b'
              }}>
                {service.description}
              </p>
            </div>
          ))}
        </div>

        <p style={{
          padding: '0 24px 20px',
          color: '#64748b',
          fontSize: 12
        }}>
          Status checks run automatically every 30 seconds while
          the dashboard tab is active. Service availability
          does not guarantee successful workflow executions.
          API and database statuses use the same combined
          health endpoint.
        </p>
      </section>
    </div>
  );
}
