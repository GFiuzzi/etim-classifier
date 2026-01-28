# ETIM Classifier - Ubuntu 24.04 Server Installation

## Requisiti di Sistema

- Ubuntu Server 24.04 LTS
- Node.js 20.x o superiore
- Nginx (come reverse proxy)
- 2GB RAM minimo
- 10GB spazio disco disponibile

## Installazione Rapida

1. **Scarica il progetto:**
```bash
cd /var/www
git clone <repository-url> etim-classifier
cd etim-classifier
```

2. **Esegui lo script di installazione:**
```bash
chmod +x install-ubuntu-24.04-complete.sh
sudo ./install-ubuntu-24.04-complete.sh
```

## Installazione Manuale

### 1. Installazione Dipendenze

```bash
# Aggiorna il sistema
sudo apt update && sudo apt upgrade -y

# Installa Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo bash -
sudo apt-get install -y nodejs

# Installa Nginx e altri pacchetti
sudo apt install -y nginx git curl wget build-essential
```

### 2. Configurazione Applicazione

```bash
# Crea directory
sudo mkdir -p /var/www/etim-classifier
sudo chown -R $USER:$USER /var/www/etim-classifier

# Installa dipendenze npm
npm install

# Build del progetto
npm run build
```

### 3. Configurazione Systemd

```bash
# Copia il file di servizio
sudo cp systemd/etim-classifier.service /etc/systemd/system/

# Ricarica systemd
sudo systemctl daemon-reload

# Abilita il servizio
sudo systemctl enable etim-classifier

# Avvia il servizio
sudo systemctl start etim-classifier
```

### 4. Configurazione Nginx

```bash
# Copia la configurazione
sudo cp nginx/etim-classifier.conf /etc/nginx/sites-available/

# Crea il link
sudo ln -sf /etc/nginx/sites-available/etim-classifier /etc/nginx/sites-enabled/

# Rimuovi il default
sudo rm -f /etc/nginx/sites-enabled/default

# Test della configurazione
sudo nginx -t

# Riavvia Nginx
sudo systemctl restart nginx
```

## Gestione del Servizio

### Comandi Systemd
```bash
# Stato del servizio
sudo systemctl status etim-classifier

# Riavvia il servizio
sudo systemctl restart etim-classifier

# Ferma il servizio
sudo systemctl stop etim-classifier

# Avvia il servizio
sudo systemctl start etim-classifier

# Visualizza i log
sudo journalctl -u etim-classifier -f
```

### Comandi Nginx
```bash
# Test configurazione
sudo nginx -t

# Ricarica configurazione
sudo systemctl reload nginx

# Riavvia Nginx
sudo systemctl restart nginx

# Visualizza log Nginx
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log
```

## Struttura Directory

```
/var/www/etim-classifier/
├── api/                    # Backend Express
├── src/                    # Frontend React
├── dist/                   # Build output
├── data/                   # Database e file dati
├── logs/                   # Log files
├── systemd/                # Systemd service files
├── nginx/                  # Nginx configuration
├── install-ubuntu-24.04-complete.sh  # Script installazione
└── package.json
```

## Configurazione Ambiente

Copia il file `.env.example` in `.env` e configura le variabili:

```bash
cp .env.example .env
nano .env
```

### Variabili Importanti:
- `NODE_ENV`: production
- `PORT`: 3001 (porta backend)
- `ETIM_API_BASE_URL`: URL API ETIM internazionale
- `DATABASE_PATH`: percorso database locale

## Sicurezza

### Firewall UFW
```bash
# Installa UFW
sudo apt install ufw

# Configura regole base
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'

# Abilita firewall
sudo ufw enable
```

### Fail2ban
```bash
# Installa fail2ban
sudo apt install fail2ban

# Configura per Nginx
sudo cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

## Backup

### Script di Backup
```bash
#!/bin/bash
# backup-etim.sh

BACKUP_DIR="/backup/etim-classifier"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Backup database e configurazioni
tar -czf $BACKUP_DIR/etim-backup-$DATE.tar.gz \
  /var/www/etim-classifier/data \
  /var/www/etim-classifier/.env \
  /etc/nginx/sites-available/etim-classifier \
  /etc/systemd/system/etim-classifier.service

# Rimuovi backup vecchi (più di 30 giorni)
find $BACKUP_DIR -name "etim-backup-*.tar.gz" -mtime +30 -delete
```

### Automazione Backup
```bash
# Aggiungi a crontab
sudo crontab -e

# Aggiungi questa linea per backup giornaliero alle 2 AM
0 2 * * * /var/www/etim-classifier/backup-etim.sh
```

## Monitoraggio

### Logrotate
```bash
# Crea configurazione logrotate
sudo nano /etc/logrotate.d/etim-classifier

# Aggiungi:
/var/www/etim-classifier/logs/*.log {
    daily
    rotate 30
    compress
    delaycompress
    missingok
    notifempty
    create 644 etim-classifier etim-classifier
}
```

### Monitoraggio Sistema
```bash
# Installa monitoring tools
sudo apt install htop iotop nethogs

# Monitora risorse
htop

# Monitora I/O
echo 1 | sudo tee /proc/sys/vm/block_dump
sudo dmesg -c | grep -i etim
```

## Risoluzione Problemi

### Servizio non parte
```bash
# Controlla log
sudo journalctl -u etim-classifier -n 50

# Controlla configurazione
sudo systemctl status etim-classifier

# Verifica porte
sudo netstat -tlnp | grep 3001
```

### Nginx errori
```bash
# Controlla configurazione
sudo nginx -t

# Controlla log
sudo tail -f /var/log/nginx/error.log
```

### Permessi
```bash
# Correggi permessi
sudo chown -R etim-classifier:etim-classifier /var/www/etim-classifier
sudo chmod -R 755 /var/www/etim-classifier
sudo chmod -R 644 /var/www/etim-classifier/dist
```

## Aggiornamenti

### Aggiornamento Applicazione
```bash
# Ferma il servizio
sudo systemctl stop etim-classifier

# Backup
./backup-etim.sh

# Aggiorna codice
git pull origin main

# Installa nuove dipendenze
npm install

# Ricostruisci
npm run build

# Riavvia servizio
sudo systemctl start etim-classifier

# Verifica
sudo systemctl status etim-classifier
```

### Aggiornamento Sistema
```bash
# Aggiorna pacchetti sistema
sudo apt update && sudo apt upgrade -y

# Aggiorna Node.js (se necessario)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo bash -
sudo apt-get install -y nodejs

# Riavvia servizi
sudo systemctl restart etim-classifier
sudo systemctl restart nginx
```

## Supporto

Per problemi o domande:
1. Controlla i log: `sudo journalctl -u etim-classifier -f`
2. Verifica la configurazione: `sudo nginx -t`
3. Controlla lo stato dei servizi: `sudo systemctl status etim-classifier nginx`