# Professional Deployment Script using gcloud SSH wrapper
# This bypasses local SSH issues by using Google's authentication

$PROJECT = "gen-lang-client-0196962068"
$ZONE = "us-central1-a"
$INSTANCE = "district-map-vm"

Write-Host "🚀 Starting professional deployment to GCP VM..." -ForegroundColor Cyan
Write-Host ""

# Step 1: Clone repository on VM
Write-Host "[1/5] Cloning repository..." -ForegroundColor Yellow
gcloud compute ssh $INSTANCE --zone=$ZONE --project=$PROJECT --command="
    if [ -d 'NREGA-FINAL' ]; then
        echo 'Repository exists, pulling latest...'
        cd NREGA-FINAL && git pull
    else
        echo 'Cloning repository...'
        git clone https://github.com/cyberkunju/NREGA-FINAL.git
    fi
"

# Step 2: Install Docker
Write-Host "[2/5] Installing Docker..." -ForegroundColor Yellow
gcloud compute ssh $INSTANCE --zone=$ZONE --project=$PROJECT --command="
    if ! command -v docker &> /dev/null; then
        echo 'Installing Docker...'
        curl -fsSL https://get.docker.com -o get-docker.sh
        sudo sh get-docker.sh
        sudo usermod -aG docker \`$USER
        echo 'Docker installed successfully'
    else
        echo 'Docker already installed'
    fi
"

# Step 3: Install Docker Compose
Write-Host "[3/5] Installing Docker Compose..." -ForegroundColor Yellow
gcloud compute ssh $INSTANCE --zone=$ZONE --project=$PROJECT --command="
    if ! command -v docker-compose &> /dev/null; then
        echo 'Installing Docker Compose...'
        sudo curl -L 'https://github.com/docker/compose/releases/latest/download/docker-compose-\`$(uname -s)-\`$(uname -m)' -o /usr/local/bin/docker-compose
        sudo chmod +x /usr/local/bin/docker-compose
        echo 'Docker Compose installed successfully'
    else
        echo 'Docker Compose already installed'
    fi
"

# Step 4: Create .env file
Write-Host "[4/5] Setting up environment..." -ForegroundColor Yellow
gcloud compute ssh $INSTANCE --zone=$ZONE --project=$PROJECT --command="
    cd NREGA-FINAL
    cat > .env << 'EOF'
# Database Configuration
POSTGRES_USER=nrega_user
POSTGRES_PASSWORD=*Q1q2q3q4
POSTGRES_DB=nrega_db
DB_HOST=postgres
DB_PORT=5432

# API Configuration
API_KEY=579b464db66ec23bdd000001d68ccbbe91b645a3578141daa6dc3a34
API_BASE_URL=https://api.data.gov.in/resource
DATASET_ID=579b464db66ec23bdd0000010b68a40085a1474d36ae78ea9fc61c

# Frontend Configuration
REACT_APP_API_URL=http://34.122.236.95:3001/api
REACT_APP_STATIC_IP=34.122.236.95

# Environment
NODE_ENV=production
EOF
    echo '.env file created'
"

# Step 5: Deploy application
Write-Host "[5/5] Deploying application..." -ForegroundColor Yellow
gcloud compute ssh $INSTANCE --zone=$ZONE --project=$PROJECT --command="
    cd NREGA-FINAL
    echo 'Stopping any existing containers...'
    sudo docker-compose -f docker-compose.prod.yml down -v 2>/dev/null || true
    
    echo 'Building and starting containers...'
    sudo docker-compose -f docker-compose.prod.yml up -d --build
    
    echo ''
    echo 'Waiting for containers to be ready...'
    sleep 10
    
    echo ''
    echo '=== Container Status ==='
    sudo docker-compose -f docker-compose.prod.yml ps
    
    echo ''
    echo '=== Application Logs (last 20 lines) ==='
    sudo docker-compose -f docker-compose.prod.yml logs --tail=20
"

Write-Host ""
Write-Host "✅ Deployment complete!" -ForegroundColor Green
Write-Host ""
Write-Host "🌐 Application URLs:" -ForegroundColor Cyan
Write-Host "   Frontend: http://34.122.236.95"
Write-Host "   Backend:  http://34.122.236.95:3001/api/health"
Write-Host ""
Write-Host "📊 To check logs: gcloud compute ssh $INSTANCE --zone=$ZONE --project=$PROJECT --command='cd NREGA-FINAL && sudo docker-compose -f docker-compose.prod.yml logs -f'"
