# Database Schema

PostgreSQL 14 database schema for MGNREGA data storage.

## Tables

### districts

Stores unique district identifiers.

```sql
CREATE TABLE districts (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  state VARCHAR(100) NOT NULL DEFAULT 'India',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT unique_district_state UNIQUE(name, state)
);
```

**Indexes:**
- `idx_district_name` on `name`

### monthly_performance

Stores monthly performance metrics for each district.

```sql
CREATE TABLE monthly_performance (
  id SERIAL PRIMARY KEY,
  district_name VARCHAR(100) NOT NULL,
  month VARCHAR(20) NOT NULL,
  fin_year VARCHAR(10) NOT NULL,
  total_households_worked INTEGER NOT NULL,
  avg_days_employment_per_hh DECIMAL(8,2) NOT NULL,
  payment_percentage_15_days DECIMAL(8,2) NOT NULL,
  women_persondays BIGINT,
  persondays_of_central_liability BIGINT,
  sc_persondays BIGINT,
  st_persondays BIGINT,
  households_100_days BIGINT,
  average_wage_rate NUMERIC(10,2),
  total_works_completed BIGINT,
  total_works_ongoing BIGINT,
  agriculture_works_percent NUMERIC(5,2),
  nrm_expenditure_percent NUMERIC(5,2),
  category_b_works_percent NUMERIC(5,2),
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT unique_district_month_year UNIQUE(district_name, month, fin_year)
);
```

**Indexes:**
- `idx_monthly_performance_district` on `district_name`
- `idx_monthly_performance_period` on `(month, fin_year)`
- `idx_monthly_performance_updated` on `last_updated DESC`

**Constraints:**
- Unique combination of `(district_name, month, fin_year)`

## Column Descriptions

### monthly_performance

| Column | Type | Description |
|--------|------|-------------|
| `id` | SERIAL | Primary key |
| `district_name` | VARCHAR(100) | District name |
| `month` | VARCHAR(20) | Month (1-12) |
| `fin_year` | VARCHAR(10) | Financial year (e.g., "2024-2025") |
| `total_households_worked` | INTEGER | Total households provided employment |
| `avg_days_employment_per_hh` | DECIMAL(8,2) | Average days of employment per household |
| `payment_percentage_15_days` | DECIMAL(8,2) | Percentage of payments made within 15 days |
| `women_persondays` | BIGINT | Total persondays by women |
| `persondays_of_central_liability` | BIGINT | Persondays under central liability |
| `sc_persondays` | BIGINT | Persondays by Scheduled Caste workers |
| `st_persondays` | BIGINT | Persondays by Scheduled Tribe workers |
| `households_100_days` | BIGINT | Households completing 100 days |
| `average_wage_rate` | NUMERIC(10,2) | Average wage rate in INR |
| `total_works_completed` | BIGINT | Total works completed |
| `total_works_ongoing` | BIGINT | Total ongoing works |
| `agriculture_works_percent` | NUMERIC(5,2) | Percentage of agriculture-related works |
| `nrm_expenditure_percent` | NUMERIC(5,2) | Natural resource management expenditure percentage |
| `category_b_works_percent` | NUMERIC(5,2) | Category B works percentage |
| `last_updated` | TIMESTAMP | Last data update timestamp |

## Connection Details

**Development:**
- Host: `postgres` (Docker network) or `localhost`
- Port: `5432`
- Database: `mgnrega`
- User: `postgres`
- Password: Set in `.env` file

**Connection Pool:**
- Max connections: 10
- Idle timeout: 30 seconds
- Connection timeout: 10 seconds

## Backup

**Manual backup:**
```bash
docker exec mgnrega-db pg_dump -U postgres mgnrega > backup.sql
```

**Restore:**
```bash
docker exec -i mgnrega-db psql -U postgres mgnrega < backup.sql
```

## Maintenance

**Check database size:**
```sql
SELECT pg_size_pretty(pg_database_size('mgnrega'));
```

**Vacuum and analyze:**
```sql
VACUUM ANALYZE monthly_performance;
```

**Check index usage:**
```sql
SELECT schemaname, tablename, indexname, idx_scan
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan;
```

## Data Volume

Approximate storage requirements:
- 740 districts × 12 months × 18 columns ≈ 160,000 rows/year
- Estimated size: 50-100 MB/year
