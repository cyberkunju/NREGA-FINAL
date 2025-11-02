# Quick Deploy Script - Build locally, deploy to server
# This avoids slow builds on the weak VM

param(
    [switch]$SkipBuild,
    [switch]$OnlyFrontend
)

Write-Host "🚀 Quick Deploy to GCP VM" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan

# Configuration
$VM_IP = "34.122.236.95"
$VM_USER = "knava"
$SSH_KEY = "$env:USERPROFILE\.ssh\google_compute_engine"
$REMOTE_DIR = "NREGA-FINAL"

if (-not $SkipBuild) {
    Write-Host "`n📦 Building Docker images locally (fast!)..." -ForegroundColor Yellow
    
    if ($OnlyFrontend) {
        docker-compose -f docker-compose.prod.yml build frontend
    } else {
        docker-compose -f docker-compose.prod.yml build
    }
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Build failed!" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "✅ Build completed!" -ForegroundColor Green
    
    # Save images to tar files
    Write-Host "`n💾 Saving Docker images..." -ForegroundColor Yellow
    
    if ($OnlyFrontend) {
        docker save nrega-final-frontend | gzip > frontend-image.tar.gz
    } else {
        docker save nrega-final-frontend | gzip > frontend-image.tar.gz
        docker save nrega-final-backend | gzip > backend-image.tar.gz
        docker save nrega-final-etl | gzip > etl-image.tar.gz
    }
    
    Write-Host "✅ Images saved!" -ForegroundColor Green
}

# Upload images to VM
Write-Host "`n📤 Uploading to VM..." -ForegroundColor Yellow

if ($OnlyFrontend) {
    scp -i $SSH_KEY frontend-image.tar.gz ${VM_USER}@${VM_IP}:~/
} else {
    if (Test-Path frontend-image.tar.gz) { scp -i $SSH_KEY frontend-image.tar.gz ${VM_USER}@${VM_IP}:~/ }
    if (Test-Path backend-image.tar.gz) { scp -i $SSH_KEY backend-image.tar.gz ${VM_USER}@${VM_IP}:~/ }
    if (Test-Path etl-image.tar.gz) { scp -i $SSH_KEY etl-image.tar.gz ${VM_USER}@${VM_IP}:~/ }
}

Write-Host "✅ Upload completed!" -ForegroundColor Green

# Load images and restart containers on VM
Write-Host "`n🔄 Deploying on VM..." -ForegroundColor Yellow

$deployScript = @"
echo '📥 Loading Docker images...'
if [ -f frontend-image.tar.gz ]; then
    gunzip -c frontend-image.tar.gz | sudo docker load
    rm frontend-image.tar.gz
fi
if [ -f backend-image.tar.gz ]; then
    gunzip -c backend-image.tar.gz | sudo docker load
    rm backend-image.tar.gz
fi
if [ -f etl-image.tar.gz ]; then
    gunzip -c etl-image.tar.gz | sudo docker load
    rm etl-image.tar.gz
fi

echo '🔄 Restarting containers...'
cd $REMOTE_DIR
sudo docker-compose -f docker-compose.prod.yml up -d --no-build

echo '✅ Deployment complete!'
sudo docker-compose -f docker-compose.prod.yml ps
"@

ssh -i $SSH_KEY ${VM_USER}@${VM_IP} $deployScript

# Cleanup local tar files
Write-Host "`n🧹 Cleaning up..." -ForegroundColor Yellow
Remove-Item -Path *.tar.gz -ErrorAction SilentlyContinue

Write-Host "`n✅ Deployment successful!" -ForegroundColor Green
Write-Host "🌐 Site: https://mgnrega.cyberkunju.dev" -ForegroundColor Cyan
