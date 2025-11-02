# Recreate VM Script - Fresh Start
# This deletes the broken VM and creates a new one

$PROJECT = "gen-lang-client-0196962068"
$ZONE = "us-central1-a"
$VM_NAME = "district-map-vm"
$STATIC_IP = "34.122.236.95"

Write-Host "🔄 Recreating VM with proper configuration..." -ForegroundColor Cyan
Write-Host ""

# Step 1: Delete the broken VM (keeps disk and IP)
Write-Host "[1/4] Deleting broken VM instance..." -ForegroundColor Yellow
gcloud compute instances delete $VM_NAME `
    --zone=$ZONE `
    --project=$PROJECT `
    --keep-disks=boot `
    --quiet

Write-Host "✅ VM deleted" -ForegroundColor Green
Write-Host ""

# Step 2: Delete the broken disk
Write-Host "[2/4] Deleting corrupted disk..." -ForegroundColor Yellow
gcloud compute disks delete $VM_NAME `
    --zone=$ZONE `
    --project=$PROJECT `
    --quiet

Write-Host "✅ Disk deleted" -ForegroundColor Green
Write-Host ""

# Step 3: Create new VM with 50GB disk from the start
Write-Host "[3/4] Creating new VM with 50GB disk..." -ForegroundColor Yellow
gcloud compute instances create $VM_NAME `
    --project=$PROJECT `
    --zone=$ZONE `
    --machine-type=e2-medium `
    --network-interface=address=$STATIC_IP,network-tier=PREMIUM,stack-type=IPV4_ONLY,subnet=default `
    --maintenance-policy=MIGRATE `
    --provisioning-model=STANDARD `
    --tags=http-server,https-server `
    --create-disk=auto-delete=yes,boot=yes,device-name=$VM_NAME,image=projects/ubuntu-os-cloud/global/images/ubuntu-2204-jammy-v20251023,mode=rw,size=50,type=pd-balanced `
    --no-shielded-secure-boot `
    --shielded-vtpm `
    --shielded-integrity-monitoring `
    --labels=goog-ec-src=vm_add-gcloud `
    --reservation-affinity=any

Write-Host "✅ VM created" -ForegroundColor Green
Write-Host ""

# Step 4: Wait for VM to boot
Write-Host "[4/4] Waiting 30 seconds for VM to boot..." -ForegroundColor Yellow
Start-Sleep -Seconds 30

Write-Host "✅ VM is ready!" -ForegroundColor Green
Write-Host ""
Write-Host "🎯 Next step: Deploy using WSL or GCP Console SSH" -ForegroundColor Cyan
Write-Host "   .\deploy-via-wsl.ps1" -ForegroundColor White
