

import { useEffect, useMemo, useState } from 'react';
import './App.css';
import ExecutionMonitor from './ExecutionMonitor';
import DashboardOverview from './DashboardOverview';
import SystemHealth from './SystemHealth';

export default function App() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [priority, setPriority] = useState('All');
  const [status, setStatus] = useState('All');
  const [selected, setSelected] = useState(null);
const [activeSection, setActiveSection] = useState('dashboard');

function navigateTo(sectionId) {
  setActiveSection(sectionId);
  window.scrollTo({ top: 0, behavior: 'instant' });
}
  const [systemHealth, setSystemHealth] = useState('checking');
  // Notification monitoring
  const [notifications, setNotifications] = useState([]);
  const [notificationLoading, setNotificationLoading] = useState(true);
  const [notificationError, setNotificationError] = useState('');
  const [notificationSearch, setNotificationSearch] = useState('');
  const [notificationFilter, setNotificationFilter] = useState('All');
  const [n8nHealth, setN8nHealth] = useState('checking');
  async function loadLeads() {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/leads', {
        cache: 'no-store'
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();

      if (!Array.isArray(data)) {
        throw new Error('Unexpected API response');
      }

      setLeads(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function loadNotifications() {
    setNotificationLoading(true);
    setNotificationError('');

    try {
      const response = await fetch('/api/notifications', {
        cache: 'no-store'
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();

      if (
        data.success !== true ||
        !Array.isArray(data.notifications)
      ) {
        throw new Error('Unexpected notifications response');
      }

      setNotifications(data.notifications);
    } catch (err) {
      setNotificationError(err.message);
    } finally {
      setNotificationLoading(false);
    }
  }

async function checkSystemHealth() {
  try {
    const response = await fetch('/api/health', {
      cache: 'no-store'
    });

    if (!response.ok) {
      setSystemHealth('offline');
      return;
    }

    const data = await response.json();

    setSystemHealth(
      data.status === 'ok' &&
      data.database === 'connected'
        ? 'online'
        : 'degraded'
    );
  } catch {
    setSystemHealth('offline');
  }
}

async function checkN8nHealth() {
  try {
    const response = await fetch('/api/health/n8n', {
      cache: 'no-store'
    });

    if (!response.ok) {
      setN8nHealth('offline');
      return;
    }

    const data = await response.json();

    setN8nHealth(
      data.status === 'online' ? 'online' : 'offline'
    );
  } catch {
    setN8nHealth('offline');
  }
}

  function refreshAll() {
  loadLeads();
  loadNotifications();
  checkSystemHealth();
  checkN8nHealth();  
}

  useEffect(() => {
    refreshAll();

    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        refreshAll();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const stats = useMemo(() => ({
    total: leads.length,
    high: leads.filter(
      l => l.ai_priority?.toLowerCase() === 'high'
    ).length,
    sent: leads.filter(
      l => l.notification_status === 'sent'
    ).length,
    pending: leads.filter(
      l => l.notification_status === 'pending'
    ).length
  }), [leads]);

  const notificationStats = useMemo(() => ({
    sent: notifications.filter(
      n => n.status === 'sent'
    ).length,
    pending: notifications.filter(
      n => n.status === 'pending'
    ).length,
    failed: notifications.filter(
      n => n.status === 'failed'
    ).length
  }), [notifications]);

  const filtered = useMemo(() => leads.filter(lead => {
    const query = search.toLowerCase();

    const matchesSearch = [
      lead.full_name,
      lead.email,
      lead.company,
      lead.service_needed
    ].some(value => String(value ?? '')
      .toLowerCase().includes(query));

    const matchesPriority = priority === 'All' ||
      (lead.ai_priority ?? 'Unclassified').toLowerCase() ===
      priority.toLowerCase();

    const matchesStatus = status === 'All' ||
      (lead.notification_status ?? 'No notification') === status;

    return matchesSearch && matchesPriority && matchesStatus;
  }), [leads, search, priority, status]);

  const filteredNotifications = useMemo(() => {
    return notifications.filter(item => {
      const query = notificationSearch.toLowerCase();

      const matchesSearch = [
        item.full_name,
        item.email,
        item.company,
        item.gmail_message_id,
        item.error_message,
        item.id
      ].some(value => String(value ?? '')
        .toLowerCase().includes(query));

      const matchesStatus =
        notificationFilter === 'All' ||
        item.status === notificationFilter;

      return matchesSearch && matchesStatus;
    });
  }, [notifications, notificationSearch, notificationFilter]);

  const dateText = value => value
    ? new Date(value).toLocaleString()
    : '—';

const isStalePending = notification => {
  if (notification.status !== 'pending' || !notification.created_at) {
    return false;
  }

  const created = new Date(notification.created_at).getTime();

  if (!Number.isFinite(created)) {
    return false;
  }

  return Date.now() - created > 15 * 60 * 1000;
};

  return (
    <div className="app">
      
<aside className="sidebar">
  <div className="brand">◈ LeadFlow AI</div>

  <div className="side-label">WORKSPACE</div>

  {[
    ['dashboard', '▦', 'Dashboard'],
    ['leads', '◎', 'Leads Overview'],
    ['notifications', '✉', 'Notification Monitor'],
    ['executions', '◷', 'Execution Monitor'],
    ['system-health', '◉', 'System Health']
  ].map(([id, symbol, label]) => (
    <button
      key={id}
      type="button"
      className={
        activeSection === id
          ? 'sidebar-link active'
          : 'sidebar-link'
      }
      onClick={() => navigateTo(id)}
    >
      <span aria-hidden="true">{symbol}</span>
      <span>{label}</span>
    </button>
  ))}

  <div className="side-bottom">
    AI Lead Management v1.2
  </div>
</aside>


      <main className="main">
        <header className="header">
          <div>
            <div className="eyebrow">OVERVIEW</div>
            <h1>Lead Dashboard</h1>
            <p>Monitor your AI-qualified leads and notifications.</p>
          </div>

<div
  style={{
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 13,
    fontWeight: 600
  }}
>
  <span
    style={{
      width: 10,
      height: 10,
      borderRadius: '50%',
      background:
        systemHealth === 'online'
          ? '#16a34a'
          : systemHealth === 'checking'
            ? '#94a3b8'
            : systemHealth === 'degraded'
              ? '#f59e0b'
              : '#dc2626'
    }}
  />

  {systemHealth === 'online'
    ? 'API & Database Online'
    : systemHealth === 'checking'
      ? 'Checking System'
      : systemHealth === 'degraded'
        ? 'System Degraded'
        : 'API Unavailable'}
</div>

<div
  style={{
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 13,
    fontWeight: 600
  }}
>
  <span
    style={{
      width: 10,
      height: 10,
      borderRadius: '50%',
      background:
        n8nHealth === 'online'
          ? '#16a34a'
          : n8nHealth === 'checking'
            ? '#94a3b8'
            : '#dc2626'
    }}
  />

  {n8nHealth === 'online'
    ? 'n8n Service Online'
    : n8nHealth === 'checking'
      ? 'Checking n8n'
      : 'n8n Service Offline'}
</div>

          <button
            onClick={refreshAll}
            disabled={loading || notificationLoading}
          >
            {loading || notificationLoading
              ? 'Loading...'
              : '↻ Refresh Data'}
          </button>
        </header>

        {error && (
          <div className="error">
            Unable to load leads: {error}
          </div>
        )}

{activeSection === 'dashboard' && (
  <DashboardOverview
    leads={leads}
    stats={stats}
    systemHealth={systemHealth}
    n8nHealth={n8nHealth}
    onNavigate={navigateTo}
  />
)}

        
{activeSection === 'system-health' && (
  <SystemHealth
    systemHealth={systemHealth}
    n8nHealth={n8nHealth}
    onRefresh={() => {
      checkSystemHealth();
      checkN8nHealth();
    }}
  />
)}

      

    
<section
  className="panel"
  id="leads"
  style={{
    display: activeSection === 'leads'
      ? 'block'
      : 'none'
  }}
>

          <div className="panel-heading">
            <div>
              <h2>Customer Leads</h2>
              <p>{filtered.length} records displayed</p>
            </div>

            <div className="filters">
              <input
                placeholder="Search customers..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />

              <select
                value={priority}
                onChange={e => setPriority(e.target.value)}
              >
                {['All', 'High', 'Medium', 'Low', 'Unclassified']
                  .map(v => <option key={v}>{v}</option>)}
              </select>

              <select
                value={status}
                onChange={e => setStatus(e.target.value)}
              >
                {[
                  'All',
                  'sent',
                  'pending',
                  'failed',
                  'No notification'
                ].map(v => <option key={v}>{v}</option>)}
              </select>
            </div>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Company</th>
                  <th>Service</th>
                  <th>Priority</th>
                  <th>Notification</th>
                  <th>Created</th>
                  <th></th>
                </tr>
              </thead>

              <tbody>
                {filtered.map(lead => (
                  <tr key={lead.id}>
                    <td>
                      <strong>{lead.full_name}</strong>
                      <small>{lead.email}</small>
                    </td>

                    <td>{lead.company || '—'}</td>
                    <td>{lead.service_needed || '—'}</td>

                    <td>
                      <span className={
                        'tag ' +
                        String(lead.ai_priority || 'none').toLowerCase()
                      }>
                        {lead.ai_priority || 'Unclassified'}
                      </span>
                    </td>

                    <td>
                      <span className={
                        'tag ' +
                        String(
                          lead.notification_status || 'none'
                        ).toLowerCase()
                      }>
                        {lead.notification_status || 'No notification'}
                      </span>
                    </td>

                    <td>{dateText(lead.created_at)}</td>

                    <td>
                      <button
                        className="view"
                        onClick={() => setSelected(lead)}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {!loading && filtered.length === 0 && (
              <div className="empty">No matching leads found.</div>
            )}
          </div>
        </section>

        {/* Notification Monitoring Center */}
        
{/* Notification Monitoring Center */}
<section
  className="panel"
  id="notifications"
  style={{
    marginTop: 24,
    display: activeSection === 'notifications'
      ? 'block'
      : 'none'
  }}
>

          <div className="panel-heading">
            <div>
              <div className="eyebrow">AUTOMATION MONITORING</div>
              <h2>Notification Monitoring Center</h2>
              <p>
                Gmail notification history from PostgreSQL.
                Showing the latest 100 records.
              </p>
            </div>

            <div className="filters">
              <input
                placeholder="Search notifications..."
                value={notificationSearch}
                onChange={e =>
                  setNotificationSearch(e.target.value)
                }
              />

              <select
                value={notificationFilter}
                onChange={e =>
                  setNotificationFilter(e.target.value)
                }
              >
                {['All', 'sent', 'pending', 'failed']
                  .map(v => <option key={v}>{v}</option>)}
              </select>
            </div>
          </div>

          {notificationError && (
            <div className="error">
              Unable to load notifications: {notificationError}
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
              ['Sent', notificationStats.sent, '#15803d'],
              ['Pending', notificationStats.pending, '#d97706'],
              ['Failed', notificationStats.failed, '#dc2626']
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
                  <th>ID</th>
                  <th>Customer</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Gmail Message ID</th>
                  <th>Created</th>
                  <th>Sent</th>
                  <th>Error Details</th>
                  <th>Investigation</th>
                </tr>
              </thead>

              <tbody>
                {filteredNotifications.map(item => (
                  <tr key={item.id}>
                    <td>#{item.id}</td>

                    <td>
                      <strong>{item.full_name || 'Unknown'}</strong>
                      <small>{item.email || '—'}</small>
                    </td>

                    <td>{item.notification_type || '—'}</td>

                    <td>
  <span className={
    'tag ' +
    String(item.status || 'none').toLowerCase()
  }>
    {item.status || 'Unknown'}
  </span>

  
{item.status === 'pending' &&
 item.investigation_status === 'historical_test' && (
  <div
    style={{
      color: '#64748b',
      fontSize: 12,
      fontWeight: 600,
      marginTop: 6
    }}
  >
    Historical test — documented
  </div>
)}

{isStalePending(item) &&
 item.investigation_status !== 'historical_test' &&
 item.investigation_status !== 'resolved' && (
  <div
    style={{
      color: '#b45309',
      fontSize: 12,
      fontWeight: 600,
      marginTop: 6
    }}
  >
    ⚠ Needs investigation
  </div>
)}

</td>

                    <td
                      style={{
                        maxWidth: 180,
                        overflowWrap: 'anywhere'
                      }}
                    >
                      {item.gmail_message_id || '—'}
                    </td>

                    <td>{dateText(item.created_at)}</td>
                    <td>{dateText(item.sent_at)}</td>

                    <td
                      style={{
                        maxWidth: 220,
                        overflowWrap: 'anywhere'
                      }}
                    >
                      {item.error_message || '—'}
                    </td>

<td style={{ minWidth: 220, maxWidth: 320 }}>
  {item.investigation_status ? (
    <div>
      <span className="tag pending">
        {item.investigation_status.replaceAll('_', ' ')}
      </span>

      <div style={{ marginTop: 8, fontSize: 12 }}>
        <strong>Root cause:</strong>
        <p>{item.root_cause || 'Not documented'}</p>
      </div>

      {item.investigation_notes && (
        <details style={{ fontSize: 12 }}>
          <summary style={{ cursor: 'pointer' }}>
            View investigation notes
          </summary>
          <p>{item.investigation_notes}</p>
          <p>
            Reviewed by: {item.reviewed_by || 'Unknown'}
          </p>
        </details>
      )}
    </div>
  ) : (
    <span style={{ color: '#64748b' }}>
      Not investigated
    </span>
  )}
</td>

                  </tr>
                ))}
              </tbody>
            </table>

            {!notificationLoading &&
              filteredNotifications.length === 0 && (
                <div className="empty">
                  No matching notification records found.
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
            Read-only monitoring. Pending records require investigation
            before any retry. Counts reflect the latest 100 records.
          </p>
        </section>
{activeSection === 'executions' && (
  <ExecutionMonitor />
)}
        <p className="footer">
          Read-only dashboard · Connected to PostgreSQL through
          LeadFlow AI API
        </p>
      </main>

      {selected && (
        <div
          className="overlay"
          onClick={() => setSelected(null)}
        >
          <section
            className="details"
            onClick={e => e.stopPropagation()}
          >
            <button
              className="close"
              onClick={() => setSelected(null)}
            >
              ✕
            </button>

            <div className="eyebrow">LEAD DETAILS</div>
            <h2>{selected.full_name}</h2>
            <p>{selected.email}</p>

            <hr />

            <dl>
              <dt>Company</dt>
              <dd>{selected.company || '—'}</dd>

              <dt>Service</dt>
              <dd>{selected.service_needed || '—'}</dd>

              <dt>Budget</dt>
              <dd>{selected.estimated_budget || '—'}</dd>

              <dt>Priority</dt>
              <dd>{selected.ai_priority || 'Unclassified'}</dd>

              <dt>Notification</dt>
              <dd>
                {selected.notification_status || 'No notification'}
              </dd>
            </dl>

            <h3>AI Qualification Summary</h3>
            <p className="summary">
              {selected.ai_summary || 'No AI summary available.'}
            </p>
          </section>
        </div>
      )}
    </div>
  );
}
