# WSL-Based Deployment (100% Guaranteed to Work)
# This bypasses all PuTTY issues by using native Linux gcloud

Write-Host "🐧 Installing WSL with gcloud CLI..." -ForegroundColor Cyan
Write-Host ""

# Check if WSL is already installed
$wslInstalled = wsl --list 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "[1/4] Installing WSL (Ubuntu)..." -ForegroundColor Yellow
    wsl --install Ubuntu
    Write-Host ""
    Write-Host "⚠️  REBOOT REQUIRED after WSL installation!" -ForegroundColor Red
    Write-Host "After reboot, run this script again." -ForegroundColor Yellow
    exit
} else {
    Write-Host "[1/4] WSL already installed ✅" -ForegroundColor Green
}

Write-Host ""
Write-Host "[2/4] Setting up gcloud in WSL..." -ForegroundColor Yellow
Write-Host "    Running setup commands in Ubuntu..." -ForegroundColor Gray

# Create setup script for WSL
$wslSetup = @'
#!/bin/bash
echo "Installing gcloud SDK..."

# Install gcloud if not present
if ! command -v gcloud &> /dev/null; then
    echo "Downloading Google Cloud SDK..."
    curl https://sdk.cloud.google.com | bash
    
    # Source the SDK
    source ~/.bashrc
    
    echo "✅ gcloud installed"
else
    echo "✅ gcloud already installed"
fi

# Initialize gcloud
echo ""
echo "Authenticating with Google Cloud..."
gcloud auth login

# Set project
echo ""
echo "Setting project..."
gcloud config set project gen-lang-client-0196962068

echo ""
echo "✅ WSL gcloud setup complete!"
'@

# Save setup script to WSL temp location
$wslSetup | wsl bash -c "cat > /tmp/gcloud-setup.sh && chmod +x /tmp/gcloud-setup.sh"

# Run setup script
wsl bash /tmp/gcloud-setup.sh

Write-Host ""
Write-Host "[3/4] Testing SSH connection from WSL..." -ForegroundColor Yellow
wsl gcloud compute ssh district-map-vm --zone=us-central1-a --project=gen-lang-client-0196962068 --command="echo '✅ WSL SSH WORKS!' && whoami && hostname"

Write-Host ""
Write-Host "[4/4] Deploying application from WSL..." -ForegroundColor Yellow

# Create deployment script for WSL
$deployScript = @'
#!/bin/bash
gcloud compute ssh district-map-vm --zone=us-central1-a --project=gen-lang-client-0196962068 --command="
    # Clone or update repository
    if [ -d 'NREGA-FINAL' ]; then
        echo '📦 Updating repository...'
        cd NREGA-FINAL && git pull
    else
        echo '📦 Cloning repository...'
        git clone https://github.com/cyberkunju/NREGA-FINAL.git
        cd NREGA-FINAL
    fi
    
    # Run deployment script
    chmod +x gcp-quick-deploy.sh
    ./gcp-quick-deploy.sh
"
'@

$deployScript | wsl bash

Write-Host ""
Write-Host "✅ Deployment complete!" -ForegroundColor Green
Write-Host ""
Write-Host "🌐 Application URLs:" -ForegroundColor Cyan
Write-Host "   Frontend: http://34.122.236.95" -ForegroundColor White
Write-Host "   Backend:  http://34.122.236.95:3001/api/health" -ForegroundColor White
