---
inclusion: always
---

# Technology Stack

## Architecture

Three-tier microservices architecture with Docker containerization:
- **Frontend**: React SPA served via Nginx
- **Backend**: Node.js REST API
- **ETL**: Scheduled data pipeline
- **Database**: PostgreSQL 14

## Frontend Stack

- **Framework**: React 18.2 with React Router v6
- **Mapping**: MapLibre GL for interactive district maps
- **Geospatial**: Turf.js for geographic calculations
- **Animation**: Framer Motion
- **i18n**: react-i18next with 15 language translations
- **HTTP Client**: Axios
- **Build Tool**: Create React App (react-scripts 5.0.1)
- **PWA**: Service Worker for offline support

## Backend Stack

- **Runtime**: Node.js with Express 4.18
- **Database Client**: node-postgres (pg)
- **Middleware**: 
  - CORS for cross-origin requests
  - Compression for response optimization
  - express-rate-limit (100 req/min per IP)
- **Environment**: dotenv for configuration

## ETL Stack

- **Scheduler**: node-cron for automated data fetching
- **HTTP Client**: Axios for API calls
- **Database**: PostgreSQL connection via pg

## Database

- **RDBMS**: PostgreSQL 14 Alpine
- **Connection Pool**: Max 10 connections, 30s idle timeout
- **Tables**: `districts`, `monthly_performance`
- **Indexes**: Optimized for district name, period, and update time queries

## Development Tools

- **Containerization**: Docker & Docker Compose
- **Testing**: Jest for unit tests
- **Dev Server**: nodemon for backend hot reload
- **Linting**: ESLint (react-app config)

## Common Commands

### Local Development
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f [service_name]

# Stop services
docker-compose down

# Rebuild after changes
docker-compose up -d --build
```

### Backend
```bash
cd backend
npm install          # Install dependencies
npm run dev          # Start with nodemon (hot reload)
npm start            # Start production server
npm test             # Run Jest tests
```

### Frontend
```bash
cd frontend
npm install          # Install dependencies
npm start            # Start dev server (port 3000)
npm run build        # Production build
npm test             # Run tests (non-watch mode)
npm run build:analyze # Analyze bundle size
```

### ETL
```bash
cd etl
npm install          # Install dependencies
npm start            # Run ETL pipeline
npm test             # Run tests
```

### Database
```bash
# Access PostgreSQL shell
docker exec -it mgnrega-db psql -U postgres -d mgnrega

# Backup database
docker exec mgnrega-db pg_dump -U postgres mgnrega > backup.sql

# Restore database
docker exec -i mgnrega-db psql -U postgres mgnrega < backup.sql
```

## Environment Configuration

All services use `.env` file in project root. Key variables:
- `DB_NAME`, `DB_USER`, `DB_PASSWORD` - Database credentials
- `CORS_ORIGIN` - Allowed frontend origins
- `REACT_APP_API_URL` - Backend API endpoint
- `GOV_API_ENDPOINT`, `GOV_API_KEY` - Government data source
- `STATE_FILTER` - Optional state filtering for ETL

## Production Deployment

Use `docker-compose.prod.yml` for production:
```bash
docker-compose -f docker-compose.prod.yml up -d
```

Production differences:
- Multi-stage Docker builds for smaller images
- Nginx serves static React build
- No volume mounts (code baked into images)
- Optimized for performance and security
