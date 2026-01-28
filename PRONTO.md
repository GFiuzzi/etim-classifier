# ✅ ETIM Classifier - Pronto per Ubuntu Server 24.04

## 🚀 Installazione Completata

Il progetto ETIM Classifier è ora completamente configurato per il deployment su Ubuntu Server 24.04!

## 📋 Componenti Installati

### ✅ Frontend React + TypeScript
- **Framework**: React 18.2 con TypeScript
- **Build Tool**: Vite 4.4
- **Styling**: Tailwind CSS 3.3
- **State Management**: Zustand
- **Icons**: Lucide React

### ✅ Backend Express + TypeScript  
- **Server**: Express.js 4.18
- **Security**: Helmet, CORS, Compression
- **API**: RESTful endpoints per ETIM
- **Multi-source**: Local → Dataset → API priority

### ✅ Configurazione Ubuntu Server
- **Service**: Systemd service file
- **Reverse Proxy**: Nginx configuration
- **Security**: Firewall, headers, file permissions
- **Logging**: Journald + file logging

### ✅ Script di Installazione
- **Automated**: Script completo per Ubuntu 24.04
- **Manual**: Istruzioni dettagliate step-by-step
- **Backup**: Script di backup automatico
- **Monitoring**: Logrotate + health checks

## 🎯 Caratteristiche Principali

### 🔍 Ricerca ETIM Multi-Fonte
- **Locale**: Database locale JSON
- **Dataset**: Dataset ufficiale ETIM
- **API**: API ETIM internazionale
- **Fallback**: Priorità Local → Dataset → API

### 📊 Esportazione Dati
- **CSV**: Esportazione in formato CSV
- **JSON**: API REST con JSON response
- **Batch**: Supporto per esportazioni bulk

### ⚙️ Configurazione Avanzata
- **Auto-refresh**: Aggiornamento automatico
- **Multi-lingua**: Supporto internazionale
- **Responsive**: UI mobile-friendly
- **Accessibile**: WCAG 2.1 compliant

## 🛠️ Struttura Directory

```
/var/www/etim-classifier/
├── api/                          # Backend Express
│   ├── routes/                   # API Routes
│   ├── services/                 # Business Logic
│   ├── app.ts                    # Express App
│   └── index.ts                  # Server Entry
├── src/                          # Frontend React
│   ├── components/               # React Components
│   ├── pages/                    # Page Components
│   ├── hooks/                    # Custom Hooks
│   ├── App.tsx                   # Main App
│   └── main.tsx                  # React Entry
├── systemd/                      # Systemd Config
│   └── etim-classifier.service   # Service File
├── nginx/                        # Nginx Config
│   └── etim-classifier.conf      # Site Config
├── dist/                         # Build Output
├── data/                         # Data Files
├── logs/                         # Log Files
└── install-ubuntu-24.04-complete.sh  # Install Script
```

## 🚀 Deployment Rapido

### 1. Copia su Server Ubuntu
```bash
# Copia il progetto su server Ubuntu
scp -r /percorso/etim-classifier user@server:/var/www/
```

### 2. Esegui Installazione
```bash
# SSH nel server
ssh user@server

# Vai alla directory
cd /var/www/etim-classifier

# Rendi eseguibile lo script
chmod +x install-ubuntu-24.04-complete.sh

# Esegui installazione
sudo ./install-ubuntu-24.04-complete.sh
```

### 3. Verifica Installazione
```bash
# Controlla stato servizio
sudo systemctl status etim-classifier

# Controlla nginx
sudo nginx -t

# Controlla health endpoint
curl http://localhost/health
```

## 🔧 Configurazione Post-Installazione

### Environment Variables
```bash
# Copia file environment
cp .env.example .env

# Modifica configurazione
nano .env
```

### Firewall UFW
```bash
# Configura firewall
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

### SSL/TLS (Opzionale)
```bash
# Installa Certbot
sudo apt install certbot python3-certbot-nginx

# Ottieni certificato SSL
sudo certbot --nginx -d tuodominio.com
```

## 📊 Monitoraggio

### Health Check
- **Endpoint**: `http://localhost/health`
- **Response**: `{ "status": "healthy", "timestamp": "..." }`

### Log Management
```bash
# Visualizza log applicazione
sudo journalctl -u etim-classifier -f

# Visualizza log nginx
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### System Monitoring
```bash
# Controlla risorse
htop

# Controlla porte
sudo netstat -tlnp | grep :80
sudo netstat -tlnp | grep :3001
```

## 🔄 Aggiornamenti

### Aggiornamento Applicazione
```bash
# Ferma servizio
sudo systemctl stop etim-classifier

# Backup
./backup-etim.sh

# Aggiorna codice
git pull origin main

# Ricostruisci
npm install
npm run build

# Riavvia
sudo systemctl start etim-classifier
```

### Aggiornamento Sistema
```bash
# Aggiorna Ubuntu
sudo apt update && sudo apt upgrade -y

# Riavvia servizi
sudo systemctl restart etim-classifier nginx
```

## 🆘 Risoluzione Problemi

### Servizio non parte
```bash
# Controlla log
sudo journalctl -u etim-classifier -n 50

# Verifica configurazione
sudo systemctl status etim-classifier
```

### Nginx errori
```bash
# Test configurazione
sudo nginx -t

# Controlla log
sudo tail -f /var/log/nginx/error.log
```

### Permessi
```bash
# Correggi permessi
sudo chown -R etim-classifier:etim-classifier /var/www/etim-classifier
sudo chmod -R 755 /var/www/etim-classifier
```

## 📞 Supporto

Per assistenza:
1. 📋 Controlla i log: `sudo journalctl -u etim-classifier -f`
2. 🔧 Verifica configurazione: `sudo nginx -t`
3. 📊 Controlla servizi: `sudo systemctl status etim-classifier nginx`
4. 📖 Consulta: `INSTALLAZIONE.md` per dettagli completi

## 🎉 Successo!

✅ **Il tuo ETIM Classifier è pronto per Ubuntu Server 24.04!**

L'applicazione è completamente funzionale con:
- 🖥️ Frontend React moderno
- 🔧 Backend Express robusto  
- 🛡️ Configurazione sicura per produzione
- 📊 Multi-source data integration
- 🚀 Deployment script completo

**Prossimi passi**: Esegui lo script di installazione sul tuo server Ubuntu 24.04!