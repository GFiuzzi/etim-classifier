# Configurazione ETIM International API

## Panoramica

Questo progetto include l'integrazione completa con l'API ufficiale di ETIM International utilizzando OAuth2 authentication. La configurazione segue esattamente il formato documentato da ETIM International.

## 🔑 Configurazione OAuth2

Il formato di configurazione richiesto è esattamente questo:

```json
{
  "rest-client.environmentVariables": {
    "production": {
      "authUrl": "https://etimauth.etim-international.com",
      "baseUrl": "https://etimapi.etim-international.com",
      "client_id": "",
      "client_secret": "",
      "scope": "EtimApi"
    }
  }
}
```

## 🚀 Istruzioni di Configurazione

### 1. Richiedi le Credenziali

Visita il [portale ETIM API](https://etimapi.etim-international.com) per richiedere:
- `client_id`
- `client_secret`

### 2. Configurazione Automatica (Ubuntu 24.04)

Per Ubuntu 24.04 server, usa lo script di configurazione automatica:

```bash
sudo chmod +x configure-etim-api.sh
sudo ./configure-etim-api.sh
```

### 3. Configurazione Manuale

Copia il file `.env.example` in `.env`:

```bash
cp .env.example .env
nano .env
```

Inserisci le tue credenziali:
```
ETIM_CLIENT_ID=tuo_client_id_qui
ETIM_CLIENT_SECRET=tuo_client_secret_qui
ETIM_AUTH_URL=https://etimauth.etim-international.com
ETIM_BASE_URL=https://etimapi.etim-international.com
ETIM_SCOPE=EtimApi
```

### 4. Verifica della Configurazione

Dopo la configurazione, verifica lo stato:

```bash
curl http://localhost:3001/api/etim/config
```

## 📋 Variabili d'Ambiente

| Variabile | Descrizione | Default |
|-----------|-------------|---------|
| `ETIM_AUTH_URL` | URL di autenticazione OAuth2 | https://etimauth.etim-international.com |
| `ETIM_BASE_URL` | URL base API | https://etimapi.etim-international.com |
| `ETIM_CLIENT_ID` | Il tuo client ID | richiesto |
| `ETIM_CLIENT_SECRET` | Il tuo client secret | richiesto |
| `ETIM_SCOPE` | Scope OAuth2 | EtimApi |

## 🔧 Funzionalità Implementate

### Ricerca Classificazioni ETIM
```typescript
// Ricerca con supporto multi-lingua
const results = await etimAPIService.searchClassifications('cavo elettrico', {
  language: 'IT',
  version: '8.0',
  limit: 50
})
```

### Dettagli Classificazione
```typescript
// Ottieni dettagli completi di una classificazione
const classification = await etimAPIService.getClassification('EC000001', {
  language: 'IT',
  version: '8.0'
})
```

### Caratteristiche Prodotto
```typescript
// Ottieni tutte le caratteristiche per una classificazione
const features = await etimAPIService.getClassificationFeatures('EC000001', {
  language: 'IT',
  version: '8.0'
})
```

## 🛡️ Sicurezza

- **Token Caching**: I token OAuth2 sono automaticamente memorizzati in cache e rinnovati
- **Error Handling**: Gestione completa degli errori di autenticazione
- **Rate Limiting**: Rispetto dei limiti dell'API con retry automatico
- **No Logging**: Le credenziali non sono mai loggate o esposte

## 🔍 Debugging

### Verifica Connessione API
```bash
# Test autenticazione
curl -X POST https://etimauth.etim-international.com/connect/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=client_credentials&client_id=YOUR_ID&client_secret=YOUR_SECRET&scope=EtimApi"
```

### Log dell'Applicazione
```bash
# Visualizza log (Ubuntu)
sudo journalctl -u etim-classifier -f

# Log dettagliati
sudo journalctl -u etim-classifier --since "5 minutes ago"
```

## 🔄 Architettura Multi-Source

Il sistema implementa una gerarchia intelligente di fonti dati:

1. **Locale**: Dati mock locali (sempre disponibili)
2. **Dataset**: Dati aggiuntivi locali
3. **ETIM API**: API ufficiale ETIM International (se configurata)

**Fallback Automatico**: Se l'API ETIM non è disponibile, il sistema usa automaticamente i dati locali.

## 🚀 Deployment su Ubuntu 24.04

### Installazione Completa
```bash
# 1. Installa l'applicazione
sudo ./install-ubuntu-24.04-complete.sh

# 2. Configura ETIM API
sudo ./configure-etim-api.sh

# 3. Verifica lo stato
sudo systemctl status etim-classifier
```

### Configurazione Post-Installazione
```bash
# Modifica configurazione
sudo nano /var/www/etim-classifier/.env

# Riavvia servizio
sudo systemctl restart etim-classifier
```

## 📞 Supporto

Per problemi con l'integrazione ETIM API:
1. Verifica le credenziali nel file `.env`
2. Controlla i log del servizio
3. Testa la connettività con `curl`
4. Verifica lo stato con l'endpoint `/api/etim/config`

## 📚 Risorse Aggiuntive

- [Documentazione Ufficiale ETIM API](https://etimapi.etim-international.com)
- [Guida OAuth2 ETIM](https://etimapi.etim-international.com/oauth2)
- [ETIM Viewer](https://etimauth.etim-international.com)
- [Classification Management Tool (CMT)](https://etim-international.com)