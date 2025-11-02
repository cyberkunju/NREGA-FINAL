---
inclusion: always
---

# Product Overview

MGNREGA Report Card System is a web application that visualizes performance data for India's Mahatma Gandhi National Rural Employment Guarantee Act (MGNREGA) program across 740+ districts.

## Core Features

- Interactive district-level map visualization using MapLibre GL
- Performance metrics dashboard showing employment statistics, payment efficiency, and work completion rates
- Multi-language support for 15 Indian languages (Hindi, Tamil, Telugu, Marathi, etc.)
- Automated data updates every 12 hours from Government of India Open Data API
- Progressive Web App (PWA) with offline support

## User Flow

1. User lands on district selector page with interactive map
2. User selects a district (via map click or search)
3. System displays comprehensive report card with current and historical performance metrics
4. User can switch languages and navigate between districts

## Data Source

All data is fetched from the Government of India's Open Data API (data.gov.in) and stored locally in PostgreSQL for fast access and offline capability.

## Target Audience

- Government officials monitoring MGNREGA implementation
- Citizens checking local employment program performance
- Researchers analyzing rural employment trends
- NGOs and civil society organizations
