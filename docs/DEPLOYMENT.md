# Deployment Guide

## Prerequisites

- Docker 20.10+
- Docker Compose 2.0+
- 4GB RAM minimum
- 10GB disk space

## Environment Configuration

Create `.env` file in project root:

```env
# Database
DB_NAME=mgnrega
DB_USER=postgres
DB_PASSWORD=your_secure_password_here

# Backend
CORS_ORIGIN=*

# Frontend
REACT_APP_API_URL=http://YOUR_SERVER_IP:3001/api

# ETL
GOV_API_ENDPOINT=https://api.data.gov.in/resource/ee03643a-ee4c-48c2-ac30-9f2ff26ab722
GOV_API_KEY=579b464db66ec23bdd000001d68ccbbe91b645a3578141daa6dc3a34
STATE_FILTER=
```

Replace:
- `your_secure_password_here` with strong password
- `YOUR_SERVER_IP` with server's external IP address

## Local Development

**Start all services:**
```bash
docker-compose up -d
```

**Check status:**
```bash
docker-compose ps
```

**View logs:**
```bash
docker-compose logs -f
```

**Stop services:**
```bash
docker-compose down
```

Access:
- Frontend: http://localhost:3000
- Backend: http://localhost:3001
- PostgreSQL: localhost:5432

## Production Deployment

### Initial Setup

**1. Clone repository:**
```bash
git clone https://github.com/cyberkunju/NREGA-FINAL.git
cd NREGA-FINAL
```

**2. Configure environment:**
```bash
cp .env.example .env
nano .env  # Edit with your values
```

**3. Deploy:**
```bash
chmod +x deploy.sh
./deploy.sh
```

### Using Deployment Scripts

**Quick deployment on fresh VM:**
```bash
chmod +x gcp-quick-deploy.sh
./gcp-quick-deploy.sh
```

**Health check:**
```bash
chmod +x healthcheck.sh
./healthcheck.sh
```

## Service Ports

| Service | Port | Protocol |
|---------|------|----------|
| Frontend | 80 (prod) / 3000 (dev) | HTTP |
| Backend | 3001 | HTTP |
| PostgreSQL | 5432 | TCP |

## Firewall Configuration

**GCP:**
```bash
gcloud compute firewall-rules create mgnrega-allow-http \
  --allow tcp:80,tcp:3001 \
  --source-ranges 0.0.0.0/0
```

**AWS:**
```bash
aws ec2 authorize-security-group-ingress \
  --group-id sg-xxxxx \
  --protocol tcp \
  --port 80 \
  --cidr 0.0.0.0/0

aws ec2 authorize-security-group-ingress \
  --group-id sg-xxxxx \
  --protocol tcp \
  --port 3001 \
  --cidr 0.0.0.0/0
```

## Health Checks

**Backend:**
```bash
curl http://localhost:3001/api/health
```

**Frontend:**
```bash
curl -I http://localhost:3000
```

**Database:**
```bash
docker exec mgnrega-db pg_isready -U postgres
```

**ETL:**
```bash
docker logs mgnrega-etl --tail=50
```

## Resource Requirements

**Minimum:**
- CPU: 2 cores
- RAM: 4GB
- Disk: 10GB

**Recommended:**
- CPU: 2-4 cores
- RAM: 8GB
- Disk: 30GB

**Docker Resource Limits (production):**
- PostgreSQL: 512MB RAM
- Backend: 512MB RAM
- Frontend: 256MB RAM
- ETL: 384MB RAM

## ETL Schedule

ETL runs automatically:
- Initial run on startup
- Scheduled: Every 12 hours (2:00 AM and 2:00 PM)
- Duration: ~30-60 seconds per run

**Manual ETL trigger:**
```bash
docker exec mgnrega-etl node index.js --run-once
```

## Backup and Recovery

**Backup database:**
```bash
docker exec mgnrega-db pg_dump -U postgres mgnrega > backup_$(date +%Y%m%d).sql
```

**Restore database:**
```bash
docker exec -i mgnrega-db psql -U postgres mgnrega < backup_20250102.sql
```

**Backup volumes:**
```bash
docker run --rm -v nrega-final_postgres_data:/data -v $(pwd):/backup alpine tar czf /backup/postgres_data.tar.gz /data
```

## Updating Application

**1. Pull latest changes:**
```bash
git pull origin main
```

**2. Rebuild and restart:**
```bash
./deploy.sh
```

**3. Zero-downtime update:**
```bash
docker-compose -f docker-compose.prod.yml up -d --build --no-deps frontend
docker-compose -f docker-compose.prod.yml up -d --build --no-deps backend
```

## Monitoring

**Container stats:**
```bash
docker stats
```

**Check logs:**
```bash
docker-compose logs -f --tail=100 backend
docker-compose logs -f --tail=100 frontend
docker-compose logs -f --tail=100 etl
```

**Database queries:**
```bash
docker exec -it mgnrega-db psql -U postgres -d mgnrega
```

```sql
-- Check record count
SELECT COUNT(*) FROM monthly_performance;

-- Check latest data
SELECT district_name, month, fin_year, last_updated 
FROM monthly_performance 
ORDER BY last_updated DESC 
LIMIT 10;
```

## Troubleshooting

**Services not starting:**
```bash
docker-compose down -v
docker-compose up -d
docker-compose logs
```

**Database connection failed:**
```bash
docker exec mgnrega-db pg_isready -U postgres
docker-compose restart postgres
```

**Frontend build errors:**
```bash
docker-compose down frontend
docker-compose up -d --build frontend
```

**Clear all data and restart:**
```bash
docker-compose down -v
docker volume rm nrega-final_postgres_data
docker-compose up -d
```

## Security Recommendations

1. Change default database password
2. Use environment variables for secrets
3. Enable SSL/TLS for production
4. Restrict CORS_ORIGIN to specific domains
5. Use firewall rules to limit database access
6. Regular security updates: `docker-compose pull`
7. Enable Docker security scanning

## Performance Optimization

**Enable PostgreSQL query caching:**
```bash
docker exec -it mgnrega-db psql -U postgres -d mgnrega -c "ALTER SYSTEM SET shared_buffers = '256MB';"
```

**Enable nginx compression (production):**
Already configured in `frontend/nginx.conf`

**Monitor slow queries:**
```sql
SELECT query, mean_exec_time, calls 
FROM pg_stat_statements 
ORDER BY mean_exec_time DESC 
LIMIT 10;
```
