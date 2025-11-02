# Test SSH After Daemon Restart
# Run this AFTER executing fix-vm-ssh.sh on the VM

param(
    [int]$WaitSeconds = 30
)

Write-Host "⏳ Waiting $WaitSeconds seconds for daemon to propagate keys..." -ForegroundColor Yellow
Start-Sleep -Seconds $WaitSeconds

Write-Host ""
Write-Host "🔑 Testing SSH with all available keys..." -ForegroundColor Cyan
Write-Host ""

# Test 1: Original google_compute_engine key
Write-Host "[Test 1] Using google_compute_engine key..." -ForegroundColor Yellow
C:\Windows\System32\OpenSSH\ssh.exe -i "$env:USERPROFILE\.ssh\google_compute_engine" `
    -o StrictHostKeyChecking=no `
    -o ConnectTimeout=10 `
    knava@34.122.236.95 "echo '✅ SUCCESS: google_compute_engine key works!' && whoami && hostname"

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ SSH connection successful with google_compute_engine!" -ForegroundColor Green
    exit 0
}

Write-Host "❌ google_compute_engine failed" -ForegroundColor Red
Write-Host ""

# Test 2: New nrega-vm key
Write-Host "[Test 2] Using nrega-vm key..." -ForegroundColor Yellow
C:\Windows\System32\OpenSSH\ssh.exe -i "$env:USERPROFILE\.ssh\nrega-vm" `
    -o StrictHostKeyChecking=no `
    -o ConnectTimeout=10 `
    knava@34.122.236.95 "echo '✅ SUCCESS: nrega-vm key works!' && whoami && hostname"

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ SSH connection successful with nrega-vm!" -ForegroundColor Green
    exit 0
}

Write-Host "❌ nrega-vm failed" -ForegroundColor Red
Write-Host ""

# Test 3: Via gcloud (will use plink but worth trying)
Write-Host "[Test 3] Using gcloud compute ssh..." -ForegroundColor Yellow
gcloud compute ssh district-map-vm --zone=us-central1-a --project=gen-lang-client-0196962068 --command="echo '✅ SUCCESS: gcloud SSH works!' && whoami"

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ gcloud SSH connection successful!" -ForegroundColor Green
    exit 0
}

Write-Host "❌ gcloud failed" -ForegroundColor Red
Write-Host ""

Write-Host "❌ All SSH methods failed" -ForegroundColor Red
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Verify fix-vm-ssh.sh was run on the VM via GCP Console" -ForegroundColor White
Write-Host "2. Check the output showed 'active' for both services" -ForegroundColor White
Write-Host "3. Verify keys are in ~/.ssh/authorized_keys on the VM" -ForegroundColor White
Write-Host "4. If still failing, use WSL solution: .\deploy-via-wsl.ps1" -ForegroundColor White
