#!/bin/bash

# Quick GCP Deployment Script
# This script automates the deployment on a fresh GCP VM

set -e

echo "🚀 MGNREGA Report Card - GCP Quick Deploy"
echo "=========================================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Check if running on GCP VM
if ! curl -s -H "Metadata-Flavor: Google" http://metadata.google.internal/computeMetadata/v1/instance/zone > /dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  Warning: This doesn't appear to be a GCP VM${NC}"
    echo "This script is optimized for GCP Compute Engine."
    read -p "Continue anyway? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Step 1: Update system
echo -e "${BLUE}📦 Updating system packages...${NC}"
sudo apt-get update
sudo apt-get upgrade -y

# Step 2: Install Docker
echo -e "${BLUE}🐳 Installing Docker...${NC}"
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    rm get-docker.sh
    echo -e "${GREEN}✓ Docker installed${NC}"
else
    echo -e "${GREEN}✓ Docker already installed${NC}"
fi

# Step 3: Install Docker Compose
echo -e "${BLUE}🔧 Installing Docker Compose...${NC}"
if ! command -v docker-compose &> /dev/null; then
    sudo curl -L "https://github.com/docker/compose/releases/download/v2.23.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    echo -e "${GREEN}✓ Docker Compose installed${NC}"
else
    echo -e "${GREEN}✓ Docker Compose already installed${NC}"
fi

# Step 4: Get External IP
echo -e "${BLUE}🌐 Using static external IP...${NC}"
EXTERNAL_IP="34.122.236.95"
echo -e "${GREEN}✓ External IP: $EXTERNAL_IP (static)${NC}"

# Step 5: Create .env file if not exists
if [ ! -f .env ]; then
    echo -e "${BLUE}⚙️  Creating environment configuration...${NC}"
    
    # Generate secure database password
    DB_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)
    
    # Create .env file
    cat > .env << EOF
# Database Configuration
DB_NAME=mgnrega
DB_USER=postgres
DB_PASSWORD=$DB_PASSWORD

# Backend Configuration
CORS_ORIGIN=*

# Frontend Configuration
REACT_APP_API_URL=http://$EXTERNAL_IP:3001/api

# ETL Configuration
GOV_API_ENDPOINT=https://api.data.gov.in/resource/ee03643a-ee4c-48c2-ac30-9f2ff26ab722
GOV_API_KEY=579b464db66ec23bdd000001d68ccbbe91b645a3578141daa6dc3a34
STATE_FILTER=
EOF
    
    echo -e "${GREEN}✓ .env file created${NC}"
    echo -e "${GREEN}✓ API key already configured${NC}"
    echo -e "${YELLOW}⚠️  Database password: $DB_PASSWORD${NC}"
    echo -e "${YELLOW}⚠️  Save this password securely!${NC}"
else
    echo -e "${GREEN}✓ .env file already exists${NC}"
fi

# Step 6: Make scripts executable
echo -e "${BLUE}🔧 Setting up scripts...${NC}"
chmod +x deploy.sh healthcheck.sh
echo -e "${GREEN}✓ Scripts ready${NC}"

# Step 7: Deploy application
echo -e "${BLUE}🚀 Deploying application...${NC}"
echo "This may take 5-10 minutes..."
./deploy.sh

# Step 8: Setup auto-start on reboot
echo -e "${BLUE}🔄 Setting up auto-start on reboot...${NC}"
cat > /tmp/mgnrega-startup.service << EOF
[Unit]
Description=MGNREGA Report Card
After=docker.service
Requires=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=$(pwd)
ExecStart=/usr/local/bin/docker-compose -f docker-compose.prod.yml up -d
ExecStop=/usr/local/bin/docker-compose -f docker-compose.prod.yml down
User=$USER

[Install]
WantedBy=multi-user.target
EOF

sudo mv /tmp/mgnrega-startup.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable mgnrega-startup.service
echo -e "${GREEN}✓ Auto-start configured${NC}"

# Step 9: Final instructions
echo ""
echo -e "${GREEN}✅ Deployment Complete!${NC}"
echo ""
echo "📍 Your application is running at:"
echo "   Frontend: http://$EXTERNAL_IP"
echo "   Backend:  http://$EXTERNAL_IP:3001"
echo ""
echo "📊 Useful commands:"
echo "   Check status:  ./healthcheck.sh"
echo "   View logs:     docker-compose -f docker-compose.prod.yml logs -f"
echo "   Restart:       docker-compose -f docker-compose.prod.yml restart"
echo "   Stop:          docker-compose -f docker-compose.prod.yml down"
echo ""
echo "🔐 Your database password is saved in .env file"
echo ""
echo "⚠️  IMPORTANT NEXT STEPS:"
echo "1. Setup HTTPS with a domain name (recommended)"
echo "2. Configure backup strategy"
echo "3. Enable monitoring and alerts"
echo "4. Review GCP_DEPLOYMENT.md for detailed instructions"
echo ""
echo "🎉 Happy deploying!"
