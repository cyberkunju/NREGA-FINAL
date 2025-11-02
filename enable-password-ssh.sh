#!/bin/bash
# Emergency script to enable password authentication
# Run this via serial console if SSH keys aren't working

echo "=== Enabling Password Authentication ==="

# Backup sshd config
sudo cp /etc/ssh/sshd_config /etc/ssh/sshd_config.backup

# Enable password authentication
sudo sed -i 's/^#\?PasswordAuthentication.*/PasswordAuthentication yes/' /etc/ssh/sshd_config
sudo sed -i 's/^#\?ChallengeResponseAuthentication.*/ChallengeResponseAuthentication yes/' /etc/ssh/sshd_config

# Restart SSH
sudo systemctl restart ssh

# Create password for current user
echo "Set password for current user:"
sudo passwd $(whoami)

echo ""
echo "✅ Password authentication enabled!"
echo "You can now SSH with: ssh knava@34.122.236.95"
echo "Then enter the password you just set"
