import express from 'express';
import { pool } from './database.js';

const app = express();
const PORT = 3001;

app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({
      status: 'ok',
      database: 'connected'
    });
  } catch (error) {
    console.error('Database health check failed');
    res.status(503).json({
      status: 'error',
      database: 'unavailable'
    });
  }
});

app.get('/api/leads', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        l.id,
        l.full_name,
        l.email,
        l.company,
        l.service_needed,
        l.estimated_budget,
        l.ai_priority,
        l.ai_summary,
        l.created_at,
        nl.status AS notification_status
      FROM leads l
      LEFT JOIN notification_logs nl
        ON nl.lead_id = l.id
       AND nl.notification_type = 'new_lead'
      ORDER BY l.created_at DESC
      LIMIT 100
    `);

    res.json(result.rows);
  } catch (error) {
    console.error('Unable to retrieve leads');
    res.status(500).json({
      error: 'Unable to retrieve leads'
    });
  }
});

app.get('/api/health/n8n', async (req, res) => {
  try {
    const response = await fetch('http://n8n:5678/healthz', {
      signal: AbortSignal.timeout(5000)
    });

    if (!response.ok) {
      return res.status(503).json({
        status: 'offline',
        service: 'n8n'
      });
    }

    return res.json({
      status: 'online',
      service: 'n8n'
    });

  } catch (error) {
    console.error('n8n health check failed:', error.message);

    return res.status(503).json({
      status: 'offline',
      service: 'n8n'
    });
  }
});

app.get('/api/monitoring/executions', async (req, res) => {
  const baseUrl = process.env.N8N_BASE_URL;
  const workflowId = process.env.N8N_WORKFLOW_ID;
  const apiKey = process.env.N8N_API_KEY;

  if (!baseUrl || !workflowId || !apiKey) {
    return res.status(503).json({
      success: false,
      error: 'n8n monitoring is not configured'
    });
  }

  try {
    const url = new URL(
      '/api/v1/executions',
      baseUrl
    );

    url.searchParams.set('workflowId', workflowId);
    url.searchParams.set('limit', '20');
    url.searchParams.set('includeData', 'false');

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'X-N8N-API-KEY': apiKey,
        'Accept': 'application/json'
      },
      signal: AbortSignal.timeout(10000)
    });

    if (!response.ok) {
      console.error(
        'n8n executions API returned HTTP',
        response.status
      );

      return res.status(502).json({
        success: false,
        error: 'Unable to retrieve n8n execution history'
      });
    }

    const result = await response.json();

    if (!Array.isArray(result.data)) {
      throw new Error('Unexpected n8n API response');
    }

    const executions = result.data.map(item => ({
      id: item.id,
      workflowId: item.workflowId,
      status: item.status,
      startedAt: item.startedAt,
      stoppedAt: item.stoppedAt,
      finished: item.finished
    }));

    return res.json({
      success: true,
      count: executions.length,
      scope: 'latest_20_executions',
      executions
    });

  } catch (error) {
    console.error(
      'n8n monitoring request failed:',
      error.message
    );

    return res.status(502).json({
      success: false,
      error: 'n8n monitoring service unavailable'
    });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Dashboard API listening on port ${PORT}`);
});

app.get('/api/notifications', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
    nl.id,
    nl.lead_id,
    l.full_name,
    l.email,
    l.company,
    nl.notification_type,
    nl.status,
    nl.gmail_message_id,
    nl.error_message,
    nl.created_at,
    nl.sent_at,
    ni.investigation_status,
    ni.root_cause,
    ni.investigation_notes,
    ni.reviewed_by,
    ni.updated_at AS investigation_updated_at
FROM notification_logs nl
JOIN leads l
    ON l.id = nl.lead_id
LEFT JOIN notification_investigations ni
    ON ni.notification_id = nl.id
ORDER BY nl.created_at DESC, nl.id DESC
LIMIT 100

    `);

    res.json({
      success: true,
      count: result.rows.length,
      notifications: result.rows
    });
  } catch (error) {
    console.error('Notification retrieval failed:', error.message);

    res.status(500).json({
      success: false,
      error: 'Unable to retrieve notification history'
    });
  }
});
