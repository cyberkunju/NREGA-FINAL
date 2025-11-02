---
inclusion: always
---

# Project Structure

## Root Directory

```
NREGA-FINAL/
├── backend/              # Express API server
├── frontend/             # React application
├── etl/                  # Data pipeline service
├── docs/                 # Documentation
├── .env                  # Environment variables (not in git)
├── .env.example          # Environment template
├── docker-compose.yml    # Development orchestration
├── docker-compose.prod.yml  # Production orchestration
└── district-state-mapping.json  # District-to-state reference data
```

## Backend Structure

```
backend/
├── db/
│   ├── connection.js     # PostgreSQL connection pool
│   └── init.sql          # Database schema initialization
├── routes/
│   ├── districts.js      # GET /api/districts
│   ├── performance.js    # GET /api/performance/*
│   └── health.js         # GET /api/health
├── utils/                # Shared utilities
├── server.js             # Main Express application
├── package.json
├── Dockerfile            # Development image
└── Dockerfile.prod       # Production image
```

### Backend Conventions

- **Route handlers** in `routes/` directory, one file per resource
- **Database queries** use parameterized queries to prevent SQL injection
- **Error handling** via centralized Express error middleware
- **Logging** to console with timestamp and duration
- **Response format**: JSON with consistent error structure `{ error: { code, message } }`
- **Middleware order**: CORS → Compression → Body parsing → Logging → Rate limiting → Routes → Error handler

## Frontend Structure

```
frontend/
├── public/               # Static assets
├── src/
│   ├── components/       # Reusable React components
│   │   ├── IndiaDistrictMap/    # Map visualization
│   │   ├── LanguageSwitcher/    # Language selector
│   │   ├── Layout/              # Page layout wrapper
│   │   ├── Onboarding/          # First-time user guide
│   │   └── ReportCard/          # Performance metrics display
│   ├── pages/            # Route-level page components
│   │   ├── DistrictSelector.js  # Home page with map
│   │   ├── ReportCard.js        # District detail page
│   │   └── NotFound.js          # 404 page
│   ├── context/
│   │   └── AppContext.js        # Global state management
│   ├── services/
│   │   └── api.js               # Axios API client
│   ├── utils/            # Helper functions
│   │   ├── formatters.js        # Number/date formatting
│   │   ├── districtNameMapping.js  # Name normalization
│   │   └── locationDetection.js    # User location detection
│   ├── i18n/
│   │   └── config.js            # i18next configuration
│   ├── locales/          # Translation files (15 languages)
│   │   ├── en/
│   │   ├── hi/
│   │   ├── ta/
│   │   └── ...
│   ├── data/             # Static JSON data
│   ├── App.js            # Root component with routing
│   ├── index.js          # React entry point
│   └── serviceWorkerRegistration.js  # PWA setup
├── nginx.conf            # Production Nginx config
├── package.json
├── Dockerfile            # Development image
└── Dockerfile.prod       # Production image
```

### Frontend Conventions

- **Component structure**: Each component in its own folder with `.js` and `.css` files
- **Routing**: React Router v6 with routes defined in `App.js`
- **State management**: Context API via `AppContext.js` for global state
- **API calls**: Centralized in `services/api.js` with error handling
- **Styling**: CSS modules, one file per component
- **i18n**: Translation keys in `locales/{lang}/translation.json`
- **Naming**: PascalCase for components, camelCase for utilities

## ETL Structure

```
etl/
├── data-fetcher.js       # Fetch from government API
├── data-transformer.js   # Transform and validate data
├── data-loader.js        # Load into PostgreSQL
├── district-state-mapping.js  # District-state lookup
├── index.js              # Main orchestrator with cron
├── package.json
├── Dockerfile            # Development image
└── Dockerfile.prod       # Production image
```

### ETL Conventions

- **Pipeline stages**: Fetch → Transform → Load (separate modules)
- **Scheduling**: node-cron runs every 12 hours (configurable)
- **Error handling**: Retry logic for API failures, transaction rollback for DB errors
- **Logging**: Detailed logs for each stage with timestamps
- **Idempotency**: Upsert operations to handle duplicate runs

## Documentation

```
docs/
├── README.md             # Project overview and quick start
├── API.md                # API endpoint reference
├── DATABASE.md           # Database schema and queries
├── DEPLOYMENT.md         # Deployment instructions
├── MOBILE_FIXES_APPLIED.md  # Mobile optimization notes
└── TODO_LATER.md         # Future enhancements
```

## Configuration Files

- **`.env`**: Environment variables (gitignored, use `.env.example` as template)
- **`docker-compose.yml`**: Development with hot reload and volume mounts
- **`docker-compose.prod.yml`**: Production with optimized builds
- **`package.json`**: Root level is empty (each service has its own)
- **`.dockerignore`**: Excludes `node_modules`, `.git`, etc. from Docker context

## Deployment Scripts

- **`deploy.sh`**: Bash script for Linux/WSL deployment
- **`deploy-via-gcloud.ps1`**: PowerShell for Google Cloud deployment
- **`quick-deploy.ps1`**: Fast deployment script
- **`setup-vm.sh`**: Initial VM configuration
- **`healthcheck.sh`**: Service health verification

## Key Patterns

- **Microservices**: Each service (frontend, backend, ETL) is independently deployable
- **Docker-first**: All services run in containers, even in development
- **Environment-based config**: No hardcoded values, everything via `.env`
- **API-first**: Backend exposes RESTful JSON API, frontend consumes it
- **Database-centric**: PostgreSQL is single source of truth
- **Separation of concerns**: Clear boundaries between data fetching (ETL), serving (backend), and presentation (frontend)
