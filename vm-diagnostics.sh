#!/bin/bash
# Complete SSH Diagnostic Script for GCP VM
# Based on comprehensive research - run via GCP Console SSH
# This generates a full diagnostic report

echo "============================================"
echo "GCP VM SSH DIAGNOSTIC REPORT"
echo "Generated: $(date)"
echo "============================================"
echo ""

echo "### 1. SYSTEM INFORMATION ###"
echo "Hostname: $(hostname)"
echo "Username: $(whoami)"
echo "OS: $(cat /etc/os-release | grep PRETTY_NAME)"
echo "Kernel: $(uname -r)"
echo ""

echo "### 2. DISK SPACE (Critical: was 100% full) ###"
df -h /
echo ""

echo "### 3. GOOGLE-ACCOUNTS-DAEMON STATUS ###"
sudo systemctl status google-accounts-daemon --no-pager | head -20
echo ""
echo "Is Active? $(sudo systemctl is-active google-accounts-daemon)"
echo "Is Enabled? $(sudo systemctl is-enabled google-accounts-daemon)"
echo ""

echo "### 4. DAEMON LOGS (Last 30 lines) ###"
sudo journalctl -u google-accounts-daemon -n 30 --no-pager
echo ""

echo "### 5. SSH DAEMON STATUS ###"
sudo systemctl status ssh --no-pager | head -15
echo ""
echo "Is Active? $(sudo systemctl is-active ssh)"
echo ""

echo "### 6. METADATA SERVER RESPONSE ###"
echo "Querying: http://metadata.google.internal/computeMetadata/v1/instance/attributes/ssh-keys"
METADATA_KEYS=$(curl -s -H "Metadata-Flavor: Google" \
  http://metadata.google.internal/computeMetadata/v1/instance/attributes/ssh-keys)

if [ -z "$METADATA_KEYS" ]; then
    echo "❌ NO SSH KEYS IN METADATA!"
else
    echo "✅ Metadata contains SSH keys"
    echo "Number of keys: $(echo "$METADATA_KEYS" | grep -c "ssh-")"
    echo "Keys for 'knava' user: $(echo "$METADATA_KEYS" | grep -c "knava:")"
    echo ""
    echo "First 200 characters of metadata:"
    echo "$METADATA_KEYS" | head -c 200
    echo "..."
fi
echo ""

echo "### 7. AUTHORIZED_KEYS FILE ###"
if [ -f ~/.ssh/authorized_keys ]; then
    echo "✅ File exists: ~/.ssh/authorized_keys"
    echo "Permissions: $(ls -l ~/.ssh/authorized_keys)"
    echo "Number of keys: $(wc -l < ~/.ssh/authorized_keys)"
    echo "Last modified: $(stat -c '%y' ~/.ssh/authorized_keys)"
    echo ""
    echo "File contents (first 3 lines):"
    head -3 ~/.ssh/authorized_keys
    echo ""
else
    echo "❌ FILE MISSING: ~/.ssh/authorized_keys"
    echo "This is the problem - daemon hasn't created the file!"
fi
echo ""

echo "### 8. SSH DIRECTORY PERMISSIONS ###"
ls -la ~/.ssh/
echo ""
echo "Expected permissions:"
echo "  ~/.ssh/ should be: drwx------ (700)"
echo "  ~/.ssh/authorized_keys should be: -rw------- (600)"
echo ""

echo "### 9. RECENT SSH AUTHENTICATION FAILURES ###"
echo "Last 15 publickey failures:"
sudo grep "Failed publickey" /var/log/auth.log 2>/dev/null | tail -15 || echo "No failures found in auth.log"
echo ""

echo "### 10. SSH DAEMON CONFIG ###"
echo "PubkeyAuthentication setting:"
sudo grep -i "^PubkeyAuthentication" /etc/ssh/sshd_config || echo "Not explicitly set (defaults to yes)"
echo ""
echo "AuthorizedKeysFile setting:"
sudo grep -i "^AuthorizedKeysFile" /etc/ssh/sshd_config || echo "Not explicitly set (defaults to .ssh/authorized_keys)"
echo ""

echo "### 11. OS LOGIN STATUS ###"
OS_LOGIN=$(curl -s -H "Metadata-Flavor: Google" \
  http://metadata.google.internal/computeMetadata/v1/instance/attributes/enable-oslogin)
echo "OS Login enabled: $OS_LOGIN"
if [ "$OS_LOGIN" = "TRUE" ]; then
    echo "⚠️  WARNING: OS Login is ENABLED but you're trying to use metadata keys!"
    echo "These are incompatible. Disable OS Login or use OS Login authentication."
fi
echo ""

echo "### 12. USER ACCOUNT CHECK ###"
echo "Current user in /etc/passwd:"
grep "^$(whoami):" /etc/passwd
echo ""
echo "Groups: $(groups)"
echo ""

echo "### 13. NETWORK CONNECTIVITY ###"
echo "Can reach metadata server?"
curl -s -H "Metadata-Flavor: Google" \
  http://metadata.google.internal/computeMetadata/v1/instance/hostname > /dev/null && \
  echo "✅ Metadata server reachable" || echo "❌ Cannot reach metadata server"
echo ""

echo "### 14. RECENT SYSTEM LOGS ###"
echo "Last 10 relevant system messages:"
sudo journalctl -p err -n 10 --no-pager
echo ""

echo "============================================"
echo "DIAGNOSTIC COMPLETE"
echo "============================================"
echo ""
echo "KEY FINDINGS TO CHECK:"
echo "1. Is google-accounts-daemon 'active'?"
echo "2. Do metadata keys exist and contain 'knava:'?"
echo "3. Does ~/.ssh/authorized_keys file exist?"
echo "4. Do key counts match (metadata vs authorized_keys)?"
echo "5. Is OS Login disabled (should be FALSE)?"
echo "6. Are there recent 'Failed publickey' errors?"
echo ""
echo "MOST COMMON FIXES:"
echo "• If daemon not active: sudo systemctl restart google-accounts-daemon"
echo "• If authorized_keys missing: Wait 60 seconds for propagation"
echo "• If OS Login is TRUE: Run previous command to disable it"
echo "• If keys mismatch: Metadata hasn't propagated yet"
