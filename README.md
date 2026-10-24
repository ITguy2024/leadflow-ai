
# LeadFlow AI

### AI-Powered Lead Management & Automation Platform

LeadFlow AI is a full-stack business automation platform that processes customer inquiries, qualifies leads using artificial intelligence, manages PostgreSQL records, sends Gmail notifications, and provides operational monitoring through a React dashboard.

## Technology Stack

- n8n — Workflow orchestration
- Google Gemini — AI lead qualification
- PostgreSQL 17 — Data storage
- Node.js and Express — Backend API
- React and Vite — Management dashboard
- Gmail — Sales notifications
- Docker Compose — Container management
- Nginx — Reverse proxy and local authentication

## Features

### AI Lead Qualification
- Customer form intake
- Data normalization and validation
- AI-generated priorities and summaries
- PostgreSQL lead storage

### Notification Automation
- Gmail notifications
- Duplicate-notification reservation protection
- Delivery result tracking
- Historical investigation records

### CRM Dashboard
- Customer search and filtering
- Lead priority indicators
- Notification monitoring
- n8n execution monitoring
- API, database, and n8n health indicators
- Automatic 30-second refresh
- Functional sidebar navigation

## System Architecture

See [Architecture Diagram](docs/diagrams/architecture.md).

## Project Structure

- `backend/` — Express API and PostgreSQL integration
- `frontend/` — React dashboard and Nginx configuration
- `docs/` — Architecture diagrams and screenshots
- `compose.yml` — Docker Compose configuration
- `.env.example` — Environment variable template

## Local Development

This application uses an existing Docker network named
`lead-crm-network` and an existing PostgreSQL/n8n environment.

1. Configure PostgreSQL and n8n.
2. Create a read-only PostgreSQL dashboard account.
3. Copy `.env.example` to `.env` and supply private values.
4. Create an Nginx Basic Authentication password file.
5. Review `compose.yml` and network settings.
6. Build the dashboard:

   `docker compose up -d --build`

7. Open `http://localhost:3000`.

This repository is not a standalone one-command deployment:
the n8n workflow, PostgreSQL schema, and required credentials
must be provisioned separately.

## Security

- Backend credentials stay in server-side environment variables.
- The dashboard uses a read-only PostgreSQL account.
- Nginx provides HTTP Basic Authentication.
- Dashboard ports are bound to localhost.
- Passwords, private keys, database dumps, and real customer
  records must not be committed.
- Public deployment requires HTTPS and additional security review.

## Testing

The system has been tested locally for:
- AI qualification and lead persistence
- Successful Gmail notification delivery
- Notification reservation and duplicate-prevention scenarios
- Dashboard authentication
- Notification investigation monitoring
- n8n execution history
- API and service health checks

## Limitations

- Gmail delivery and database updates are not an atomic operation.
  Some uncertain outcomes require manual reconciliation.
- Monitoring counts are limited to recently retrieved records.
- The local deployment is intended for development and demonstration.
- API/database health checks share a combined connectivity result.

## Project Status

Portfolio Version 1.0 — Locally developed and tested.

## Developer

Joseph M. Nicolas

Portfolio:
https://itguy2024.github.io/portfolio/
