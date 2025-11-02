# MGNREGA Report Card System

Web application for visualizing MGNREGA (Mahatma Gandhi National Rural Employment Guarantee Act) performance data across Indian districts.

## System Overview

**Stack:**
- Frontend: React 18.2 + MapLibre GL
- Backend: Node.js + Express + PostgreSQL 14
- ETL: Node-cron scheduler
- Deployment: Docker Compose

**Data Source:** Government of India Open Data API (data.gov.in)

## Architecture

```
┌─────────────┐     ┌─────────────┐     ┌──────────────┐
│   Browser   │────▶│   Nginx     │────▶│  PostgreSQL  │
│  (React)    │     │  (Backend)  │     │   Database   │
└─────────────┘     └─────────────┘     └──────────────┘
                           ▲                    ▲
                           │                    │
                    ┌──────┴──────┐            │
                    │ ETL Service │────────────┘
                    │ (Node-cron) │
                    └─────────────┘
                           ▲
                           │
                    ┌──────┴──────┐
                    │ data.gov.in │
                    │     API     │
                    └─────────────┘
```

## Features

- Interactive district map (740+ districts)
- Performance metrics visualization
- Multi-language support (15 languages)
- Automated data updates (every 12 hours)
- Offline support (PWA)

## Quick Start

**Prerequisites:**
- Docker & Docker Compose
- 4GB RAM minimum

**Local Development:**
```bash
docker-compose up -d
```

**Production Deployment:**
```bash
docker-compose -f docker-compose.prod.yml up -d
```

Access:
- Frontend: http://localhost:3000
- Backend: http://localhost:3001
- Database: localhost:5432

## Configuration

Create `.env` file in project root:

```env
DB_NAME=mgnrega
DB_USER=postgres
DB_PASSWORD=your_secure_password
CORS_ORIGIN=*
REACT_APP_API_URL=http://localhost:3001/api
GOV_API_ENDPOINT=https://api.data.gov.in/resource/ee03643a-ee4c-48c2-ac30-9f2ff26ab722
GOV_API_KEY=your_api_key
STATE_FILTER=
```

## Documentation

- [API Reference](./API.md)
- [Database Schema](./DATABASE.md)
- [Deployment Guide](./DEPLOYMENT.md)

## Project Structure

```
NREGA-FINAL/
├── backend/          # Express API server
├── frontend/         # React application
├── etl/             # Data extraction & loading
├── docs/            # Documentation
├── docker-compose.yml           # Development config
└── docker-compose.prod.yml      # Production config
```

## License

MIT
