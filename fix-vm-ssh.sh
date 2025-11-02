#!/bin/bash
# Critical Fix: Restart SSH services after disk resize
# Run this via GCP Console SSH

echo "=== SSH Daemon Fix Script ==="
echo ""

echo "[1/6] Checking google-accounts-daemon status..."
sudo systemctl status google-accounts-daemon --no-pager

echo ""
echo "[2/6] Restarting google-accounts-daemon (picks up new disk space)..."
sudo systemctl restart google-accounts-daemon

echo ""
echo "[3/6] Restarting SSH daemon..."
sudo systemctl restart ssh

echo ""
echo "[4/6] Verifying both services are active..."
sudo systemctl is-active google-accounts-daemon ssh

echo ""
echo "[5/6] Checking metadata server response..."
curl -H "Metadata-Flavor: Google" \
  http://metadata.google.internal/computeMetadata/v1/instance/attributes/ssh-keys | grep "knava" || echo "No keys found in metadata"

echo ""
echo "[6/6] Checking authorized_keys file..."
echo "File permissions:"
ls -la ~/.ssh/authorized_keys 2>/dev/null || echo "File does not exist!"
echo ""
echo "Number of keys:"
wc -l ~/.ssh/authorized_keys 2>/dev/null || echo "0"
echo ""
echo "Last modified:"
stat ~/.ssh/authorized_keys 2>/dev/null | grep Modify || echo "N/A"

echo ""
echo "=== Daemon Logs (last 20 lines) ==="
sudo journalctl -u google-accounts-daemon -n 20 --no-pager

echo ""
echo "=== SSH Auth Failures (if any) ==="
sudo grep "Failed publickey" /var/log/auth.log 2>/dev/null | tail -10 || echo "No failures found"

echo ""
echo "✅ Fix complete! Wait 30 seconds, then try SSH from PowerShell."
