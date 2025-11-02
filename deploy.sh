#!/bin/bash

# MGNREGA Report Card - Production Deployment Script for GCP VM
# Usage: ./deploy.sh

set -e

echo "🚀 Starting MGNREGA Report Card Deployment..."

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if .env exists
if [ ! -f .env ]; then
    echo -e "${RED}❌ Error: .env file not found!${NC}"
    echo "Please create .env file from .env.example"
    echo "cp .env.example .env"
    echo "Then edit .env with your configuration"
    exit 1
fi

# Load environment variables
source .env

# Validate required variables
if [ -z "$DB_PASSWORD" ]; then
    echo -e "${RED}❌ Error: Please set DB_PASSWORD in .env${NC}"
    exit 1
fi

if [ -z "$REACT_APP_API_URL" ]; then
    echo -e "${RED}❌ Error: Please set REACT_APP_API_URL in .env${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Environment variables validated${NC}"

# Stop existing containers
echo "🛑 Stopping existing containers..."
docker-compose -f docker-compose.prod.yml down

# Remove old images (optional - comment out if you want to keep them)
echo "🗑️  Removing old images..."
docker image prune -f

# Build new images
echo "🔨 Building production images..."
docker-compose -f docker-compose.prod.yml build --no-cache

# Start services
echo "🚀 Starting services..."
docker-compose -f docker-compose.prod.yml up -d

# Wait for services to be healthy
echo "⏳ Waiting for services to be healthy..."
sleep 10

# Check service status
echo "📊 Service Status:"
docker-compose -f docker-compose.prod.yml ps

# Check logs for errors
echo "📝 Recent logs:"
docker-compose -f docker-compose.prod.yml logs --tail=20

# Test backend health
echo "🏥 Testing backend health..."
sleep 5
if curl -f http://localhost:3001/api/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Backend is healthy${NC}"
else
    echo -e "${YELLOW}⚠ Backend health check failed (might still be starting)${NC}"
fi

# Test frontend
echo "🏥 Testing frontend..."
if curl -f http://localhost:80 > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Frontend is healthy${NC}"
else
    echo -e "${YELLOW}⚠ Frontend health check failed (might still be starting)${NC}"
fi

echo ""
echo -e "${GREEN}✅ Deployment complete!${NC}"
echo ""
echo "📍 Access your application:"
echo "   Frontend: http://$(curl -s ifconfig.me):80"
echo "   Backend:  http://$(curl -s ifconfig.me):3001"
echo ""
echo "📊 Monitor logs:"
echo "   docker-compose -f docker-compose.prod.yml logs -f"
echo ""
echo "🔄 Restart services:"
echo "   docker-compose -f docker-compose.prod.yml restart"
echo ""
echo "🛑 Stop services:"
echo "   docker-compose -f docker-compose.prod.yml down"
