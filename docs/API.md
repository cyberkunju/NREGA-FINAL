# API Reference

Base URL: `http://localhost:3001/api`

## Authentication

No authentication required. All endpoints are public.

## Rate Limiting

100 requests per 15 minutes per IP address.

## Endpoints

### Health Check

**GET** `/health`

Returns service health status.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-11-02T06:14:38",
  "uptime": 19.918,
  "database": "connected",
  "databaseTime": "2025-11-02T06:14:38",
  "lastEtlRun": "2025-11-02T02:00:00",
  "database_pool": {
    "total": 10,
    "idle": 8,
    "waiting": 0
  }
}
```

### Districts

**GET** `/districts`

Returns list of all available districts.

**Query Parameters:**
- `state` (optional) - Filter by state name

**Response:**
```json
[
  {
    "id": 1,
    "name": "Pune",
    "state": "Maharashtra"
  }
]
```

### Performance Data

**GET** `/performance/heatmap-data`

Returns performance data for all districts (used for map visualization).

**Query Parameters:**
- `period` (optional) - Format: `YYYY-MM` (default: latest month)

**Response:**
```json
[
  {
    "districtName": "Pune",
    "stateName": "Maharashtra",
    "totalHouseholds": 17219,
    "averageDays": 42.3,
    "paymentPercentage": 95.5,
    "womenParticipationPercent": 48.5,
    "month": "10",
    "finYear": "2024-2025"
  }
]
```

**GET** `/performance/all`

Returns complete performance data for all districts.

**Query Parameters:**
- `month` (optional) - Filter by month (1-12)
- `finYear` (optional) - Filter by financial year (e.g., "2024-2025")

**Response:**
```json
[
  {
    "id": 1,
    "districtName": "Pune",
    "month": "10",
    "finYear": "2024-2025",
    "totalHouseholds": 17219,
    "averageDays": 42.3,
    "paymentPercentage": 95.5,
    "womenPersondays": 89456,
    "scPersondays": 45230,
    "stPersondays": 12340,
    "households100Days": 450,
    "averageWageRate": 285.50,
    "totalWorksCompleted": 234,
    "totalWorksOngoing": 56,
    "agricultureWorksPercent": 35.5,
    "nrmExpenditurePercent": 42.3,
    "categoryBWorksPercent": 22.2,
    "lastUpdated": "2025-11-02T06:15:29"
  }
]
```

**GET** `/performance/:district_name`

Returns performance data for a specific district.

**Path Parameters:**
- `district_name` - District name (case-insensitive, URL encoded)

**Query Parameters:**
- `period` (optional) - Format: `YYYY-MM`

**Response:**
```json
{
  "currentMonth": {
    "totalHouseholds": 17219,
    "averageDays": 42.3,
    "paymentPercentage": 95.5,
    "womenParticipationPercent": 48.5
  },
  "historical": [
    {
      "month": "09",
      "finYear": "2024-2025",
      "totalHouseholds": 16890,
      "averageDays": 40.1
    }
  ]
}
```

**GET** `/performance/:district_name/periods`

Returns available time periods for a specific district.

**Response:**
```json
[
  {
    "period": "2024-10",
    "label": "October 2024"
  },
  {
    "period": "2024-09",
    "label": "September 2024"
  }
]
```

## Error Responses

All errors return JSON with following structure:

```json
{
  "error": "Error message description"
}
```

**HTTP Status Codes:**
- `200` - Success
- `400` - Bad Request (invalid parameters)
- `404` - Resource not found
- `429` - Too many requests (rate limit exceeded)
- `500` - Internal server error
- `503` - Service unavailable (database connection failed)

## Data Caching

Backend caches responses for performance:
- Districts list: 24 hours
- Heatmap data: 6 hours
- Performance data: 1 hour

Cache headers included in responses.

## CORS

CORS enabled for all origins in development. Configure `CORS_ORIGIN` environment variable for production.
