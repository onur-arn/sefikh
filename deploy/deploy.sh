#!/usr/bin/env bash
# Déploiement : récupère main, installe, met à jour le schéma de la base, compile et redémarre.
# Lancé sur le serveur par l'utilisateur sefikh :  bash /srv/sefikh/app/deploy/deploy.sh
set -euo pipefail
cd /srv/sefikh/app
git fetch --quiet origin main && git reset --hard --quiet origin/main
set -a && . /srv/sefikh/.env && set +a
# onnxruntime (recherche par image) : pas de version GPU à télécharger
export ONNXRUNTIME_NODE_INSTALL_CUDA=skip
npm ci --no-audit --no-fund
node scripts/prisma-postgres.mjs
npx prisma db push --schema prisma/postgres/schema.prisma --skip-generate
npx prisma generate --schema prisma/postgres/schema.prisma
NODE_OPTIONS=--max-old-space-size=3072 npm run build
sudo /bin/systemctl restart sefikh
echo "Déployé : $(git log --oneline -1)"
