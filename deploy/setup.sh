#!/usr/bin/env bash
# Installation du serveur SEFIKH (Ubuntu 24.04, VPS Infomaniak). À lancer une seule fois, en root :
#   ssh root@IP 'bash -s' < deploy/setup.sh
set -euo pipefail
export DEBIAN_FRONTEND=noninteractive

# Système, pare-feu, mises à jour de sécurité automatiques
apt-get update -y && apt-get upgrade -y
apt-get install -y curl git ufw unattended-upgrades ca-certificates gnupg debian-keyring debian-archive-keyring apt-transport-https postgresql postgresql-contrib
ufw allow OpenSSH && ufw allow 80 && ufw allow 443 && ufw --force enable
dpkg-reconfigure -f noninteractive unattended-upgrades

# Mémoire d'échange : la compilation Next.js et CLIP dépassent ponctuellement 4 Go
if [ ! -f /swapfile ]; then fallocate -l 4G /swapfile && chmod 600 /swapfile && mkswap /swapfile && swapon /swapfile && echo '/swapfile none swap sw 0 0' >> /etc/fstab; fi

# Node.js 22
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt-get install -y nodejs

# Caddy (serveur web + certificats HTTPS automatiques)
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' > /etc/apt/sources.list.d/caddy-stable.list
apt-get update -y && apt-get install -y caddy

# Utilisateur applicatif et dossiers
id sefikh >/dev/null 2>&1 || useradd -m -s /bin/bash sefikh
mkdir -p /srv/sefikh/storage /srv/sefikh/backups && chown -R sefikh:sefikh /srv/sefikh

# Base PostgreSQL locale (le mot de passe est généré une fois et rangé dans /srv/sefikh/.db-password)
if [ ! -f /srv/sefikh/.db-password ]; then
  openssl rand -hex 24 > /srv/sefikh/.db-password && chmod 600 /srv/sefikh/.db-password && chown sefikh:sefikh /srv/sefikh/.db-password
  PW=$(cat /srv/sefikh/.db-password)
  sudo -u postgres psql -c "CREATE USER sefikh WITH PASSWORD '$PW';"
  sudo -u postgres psql -c "CREATE DATABASE sefikh OWNER sefikh;"
fi
echo "Installation terminée."
