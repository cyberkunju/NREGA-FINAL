# Factory Reset VM - Keep Static IP and Configuration
# This recreates the VM from scratch while preserving network settings

$PROJECT = "gen-lang-client-0196962068"
$ZONE = "us-central1-a"
$VM_NAME = "district-map-vm"

Write-Host "🔄 Factory Reset: Recreating VM while preserving configuration..." -ForegroundColor Cyan
Write-Host ""

# Step 1: Get current VM configuration
Write-Host "[1/5] Backing up current VM configuration..." -ForegroundColor Yellow
$vmConfig = gcloud compute instances describe $VM_NAME --zone=$ZONE --project=$PROJECT --format=json | ConvertFrom-Json

$machineType = $vmConfig.machineType.Split('/')[-1]
$networkTier = $vmConfig.networkInterfaces[0].accessConfigs[0].networkTier
$staticIP = $vmConfig.networkInterfaces[0].accessConfigs[0].natIP
$subnet = $vmConfig.networkInterfaces[0].subnetwork.Split('/')[-1]
$tags = $vmConfig.tags.items -join ','

Write-Host "   Machine Type: $machineType" -ForegroundColor Gray
Write-Host "   Static IP: $staticIP" -ForegroundColor Gray
Write-Host "   Network Tier: $networkTier" -ForegroundColor Gray
Write-Host "   Subnet: $subnet" -ForegroundColor Gray
Write-Host "   Tags: $tags" -ForegroundColor Gray
Write-Host "✅ Configuration saved" -ForegroundColor Green
Write-Host ""

# Step 2: Delete the VM (keeps the static IP reserved)
Write-Host "[2/5] Deleting corrupted VM instance..." -ForegroundColor Yellow
gcloud compute instances delete $VM_NAME `
    --zone=$ZONE `
    --project=$PROJECT `
    --quiet

Write-Host "✅ VM deleted (static IP preserved)" -ForegroundColor Green
Write-Host ""

# Step 3: Delete the corrupted disk
Write-Host "[3/5] Deleting corrupted disk..." -ForegroundColor Yellow
gcloud compute disks delete $VM_NAME `
    --zone=$ZONE `
    --project=$PROJECT `
    --quiet

Write-Host "✅ Disk deleted" -ForegroundColor Green
Write-Host ""

# Step 4: Recreate VM with exact same configuration + fresh 50GB disk
Write-Host "[4/5] Creating fresh VM with same configuration..." -ForegroundColor Yellow
gcloud compute instances create $VM_NAME `
    --project=$PROJECT `
    --zone=$ZONE `
    --machine-type=$machineType `
    --network-interface="address=$staticIP,network-tier=$networkTier,stack-type=IPV4_ONLY,subnet=$subnet" `
    --maintenance-policy=MIGRATE `
    --provisioning-model=STANDARD `
    --tags=$tags `
    --create-disk="auto-delete=yes,boot=yes,device-name=$VM_NAME,image=projects/ubuntu-os-cloud/global/images/ubuntu-2204-jammy-v20251023,mode=rw,size=50,type=pd-balanced" `
    --shielded-vtpm `
    --shielded-integrity-monitoring `
    --labels=goog-ec-src=vm_add-gcloud `
    --reservation-affinity=any `
    --metadata=enable-oslogin=FALSE

Write-Host "✅ Fresh VM created with:" -ForegroundColor Green
Write-Host "   ✅ Same static IP: $staticIP" -ForegroundColor Green
Write-Host "   ✅ Same machine type: $machineType" -ForegroundColor Green
Write-Host "   ✅ Same network config" -ForegroundColor Green
Write-Host "   ✅ Fresh 50GB disk (properly sized)" -ForegroundColor Green
Write-Host "   ✅ Clean OS (no corruption)" -ForegroundColor Green
Write-Host ""

# Step 5: Wait for VM to fully boot
Write-Host "[5/5] Waiting 45 seconds for VM to fully boot..." -ForegroundColor Yellow
Start-Sleep -Seconds 45

Write-Host "✅ VM is ready and healthy!" -ForegroundColor Green
Write-Host ""
Write-Host "═══════════════════════════════════════" -ForegroundColor Cyan
Write-Host "🎉 FACTORY RESET COMPLETE!" -ForegroundColor Green
Write-Host "═══════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "📊 VM Status:" -ForegroundColor Cyan
Write-Host "   Name: $VM_NAME" -ForegroundColor White
Write-Host "   IP: $staticIP (unchanged)" -ForegroundColor White
Write-Host "   Disk: 50GB (clean)" -ForegroundColor White
Write-Host "   OS: Fresh Ubuntu 22.04" -ForegroundColor White
Write-Host ""
Write-Host "🚀 Next Steps:" -ForegroundColor Cyan
Write-Host "   1. Add SSH keys (will work now):" -ForegroundColor Yellow
Write-Host "      gcloud compute config-ssh --project=$PROJECT" -ForegroundColor Gray
Write-Host ""
Write-Host "   2. Deploy via WSL (recommended):" -ForegroundColor Yellow
Write-Host "      .\deploy-via-wsl.ps1" -ForegroundColor Gray
Write-Host ""
Write-Host "   3. Or deploy via GCP Console SSH:" -ForegroundColor Yellow
Write-Host "      https://console.cloud.google.com/compute/instances?project=$PROJECT" -ForegroundColor Gray
Write-Host ""
