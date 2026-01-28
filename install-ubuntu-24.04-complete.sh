#!/bin/bash

# Script di installazione completo per ETIM Classifier su Ubuntu 24.04 Server
# Questo script configura tutto il necessario per il deployment in produzione

set -e

echo "=== Installazione ETIM Classifier su Ubuntu 24.04 ==="

# Aggiornamento sistema
echo "Aggiornamento sistema..."
apt update && apt upgrade -y

# Installazione Node.js 20.x
echo "Installazione Node.js 20.x..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

# Installazione dipendenze di sistema
echo "Installazione dipendenze di sistema..."
apt install -y nginx git curl wget unzip build-essential

# Creazione directory applicazione
echo "Creazione directory applicazione..."
mkdir -p /var/www/etim-classifier
cd /var/www/etim-classifier

# Copia file progetto (assumendo che il progetto sia già qui)
echo "Copia file progetto..."
if [ -d "api" ] && [ -d "src" ]; then
    echo "File progetto trovati"
else
    echo "ERRORE: File progetto non trovati!"
    exit 1
fi

# Installazione dipendenze npm
echo "Installazione dipendenze npm..."
npm install

# Build del progetto
echo "Build del progetto..."
npm run build

# Creazione utente dedicato
echo "Creazione utente dedicato..."
useradd -r -s /bin/false etim-classifier || true
chown -R etim-classifier:etim-classifier /var/www/etim-classifier
chmod -R 755 /var/www/etim-classifier

# Configurazione systemd
echo "Configurazione systemd..."
cp systemd/etim-classifier.service /etc/systemd/system/
systemctl daemon-reload
systemctl enable etim-classifier

# Configurazione nginx
echo "Configurazione nginx..."
cp nginx/etim-classifier.conf /etc/nginx/sites-available/etim-classifier
ln -sf /etc/nginx/sites-available/etim-classifier /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test configurazione nginx
nginx -t

# Configurazione firewall (se UFW è attivo)
if command -v ufw &> /dev/null; then
    echo "Configurazione firewall..."
    ufw allow 'Nginx Full'
fi

# Avvio servizi
echo "Avvio servizi..."
systemctl start etim-classifier
systemctl restart nginx

echo "=== Installazione completata! ==="
echo "L'applicazione è ora in esecuzione su:"
echo "- Frontend: http://localhost"
echo "- Backend API: http://localhost/api"
echo ""
echo "Comandi utili:"
echo "- systemctl status etim-classifier  # Stato del servizio"
echo "- systemctl restart etim-classifier # Riavvio servizio"
echo "- journalctl -u etim-classifier -f  # Log in tempo reale"
echo "- nginx -t                          # Test configurazione nginx"