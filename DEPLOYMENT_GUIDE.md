# Guida al Deployment Online

## Opzioni di Deployment

### Opzione 1: Vercel (Frontend) + Railway (Backend + Database) - CONSIGLIATO

#### Vantaggi:
- ✅ Gratuito per progetti piccoli
- ✅ Deploy automatico da GitHub
- ✅ SSL/HTTPS incluso
- ✅ Dominio personalizzato gratuito

#### Setup:

**1. Backend + Database su Railway**

```bash
# 1. Crea account su railway.app
# 2. Installa Railway CLI
npm install -g @railway/cli

# 3. Login
railway login

# 4. Nella cartella backend
cd lniworks
railway init

# 5. Aggiungi PostgreSQL
railway add postgresql

# 6. Deploy
railway up

# 7. Ottieni URL del backend
railway domain
```

**File da creare: `railway.json`**
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "uvicorn app.main:app --host 0.0.0.0 --port $PORT",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

**File da creare: `Procfile`**
```
web: uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

**2. Frontend su Vercel**

```bash
# 1. Crea account su vercel.com
# 2. Installa Vercel CLI
npm install -g vercel

# 3. Nella cartella frontend
cd frontend

# 4. Aggiorna .env con URL backend Railway
echo "VITE_API_URL=https://tuo-backend.railway.app" > .env.production

# 5. Deploy
vercel --prod
```

**File da creare: `vercel.json`**
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

---

### Opzione 2: Render (All-in-One)

#### Vantaggi:
- ✅ Backend e database sulla stessa piattaforma
- ✅ Gratuito per progetti piccoli
- ✅ SSL automatico

#### Setup:

**1. Database PostgreSQL**
- Vai su render.com → New → PostgreSQL
- Nome: `lni-database`
- Copia l'URL di connessione

**2. Backend**
- New → Web Service
- Connect repository GitHub
- Build Command: `pip install -r requirements.txt`
- Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- Environment Variables:
  ```
  DATABASE_URL=postgresql://...  (dall'URL copiato)
  SECRET_KEY=tua-chiave-segreta-super-sicura
  ```

**3. Frontend**
- New → Static Site
- Build Command: `npm run build`
- Publish Directory: `dist`
- Environment Variables:
  ```
  VITE_API_URL=https://tuo-backend.onrender.com
  ```

---

### Opzione 3: DigitalOcean App Platform

#### Vantaggi:
- ✅ Controllo completo
- ✅ Scalabile
- ⚠️ A pagamento ($5-12/mese)

#### Setup:

**1. Crea App**
- Vai su digitalocean.com → Apps
- Connect GitHub repository
- Seleziona branch `main`

**2. Configura Components**

**Database:**
- Type: Database
- Engine: PostgreSQL 14
- Plan: Basic ($7/mese)

**Backend:**
- Type: Web Service
- Build Command: `pip install -r requirements.txt`
- Run Command: `uvicorn app.main:app --host 0.0.0.0 --port 8080`
- HTTP Port: 8080
- Environment Variables:
  ```
  DATABASE_URL=${db.DATABASE_URL}
  SECRET_KEY=tua-chiave-segreta
  ```

**Frontend:**
- Type: Static Site
- Build Command: `npm run build`
- Output Directory: `dist`
- Environment Variables:
  ```
  VITE_API_URL=${backend.PUBLIC_URL}
  ```

---

## Configurazione Dominio Personalizzato

### Con Vercel:
1. Vai su Project Settings → Domains
2. Aggiungi `tuodominio.com`
3. Configura DNS:
   ```
   Type: CNAME
   Name: @
   Value: cname.vercel-dns.com
   ```

### Con Railway:
1. Vai su Settings → Domains
2. Aggiungi custom domain
3. Configura DNS:
   ```
   Type: CNAME
   Name: @
   Value: tuo-progetto.up.railway.app
   ```

---

## Variabili d'Ambiente

### Backend (.env)
```bash
DATABASE_URL=postgresql://user:password@host:5432/database
SECRET_KEY=chiave-segreta-super-lunga-e-sicura
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

### Frontend (.env.production)
```bash
VITE_API_URL=https://tuo-backend.railway.app
```

---

## Checklist Pre-Deploy

### Backend:
- [ ] `requirements.txt` aggiornato
- [ ] Variabili d'ambiente configurate
- [ ] Database migrations eseguite
- [ ] CORS configurato per dominio frontend
- [ ] SECRET_KEY cambiata (non usare quella di default!)

### Frontend:
- [ ] `VITE_API_URL` punta al backend in produzione
- [ ] Build test locale: `npm run build && npm run preview`
- [ ] Immagini e assets caricati correttamente

---

## Accesso da Telefono

Una volta deployato:

1. **Via Browser Mobile:**
   - Apri `https://tuodominio.com` su Safari/Chrome mobile
   - Aggiungi alla Home Screen per app-like experience

2. **PWA (Progressive Web App):**
   Aggiungi al frontend `manifest.json`:
   ```json
   {
     "name": "LNI Works",
     "short_name": "LNI",
     "start_url": "/",
     "display": "standalone",
     "background_color": "#FFF4EF",
     "theme_color": "#39A8FB",
     "icons": [
       {
         "src": "/icon-192.png",
         "sizes": "192x192",
         "type": "image/png"
       },
       {
         "src": "/icon-512.png",
         "sizes": "512x512",
         "type": "image/png"
       }
     ]
   }
   ```

---

## Costi Stimati

### Opzione Gratuita (Vercel + Railway):
- **Frontend (Vercel):** Gratuito
- **Backend (Railway):** Gratuito (500 ore/mese)
- **Database (Railway):** Gratuito (1GB storage)
- **Totale:** €0/mese ✅

### Opzione Professionale (Render):
- **Frontend:** Gratuito
- **Backend:** $7/mese
- **Database:** $7/mese
- **Totale:** €13/mese

### Opzione Premium (DigitalOcean):
- **App Platform:** $12/mese
- **Database:** $7/mese
- **Totale:** €18/mese

---

## Supporto e Troubleshooting

### Errori Comuni:

**1. CORS Error**
```python
# In backend/app/main.py
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://tuodominio.com"],  # Aggiungi dominio frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

**2. Database Connection Error**
- Verifica DATABASE_URL nelle variabili d'ambiente
- Controlla che il database sia attivo
- Verifica le credenziali

**3. Build Failed**
- Controlla i log di build
- Verifica che tutte le dipendenze siano in `requirements.txt` / `package.json`
- Testa build locale prima del deploy

---

## Monitoraggio

### Railway:
- Dashboard → Metrics
- Logs in tempo reale
- Alerts via email

### Vercel:
- Analytics integrato
- Real-time logs
- Performance monitoring

---

## Backup Database

```bash
# Con Railway CLI
railway run pg_dump > backup.sql

# Con PostgreSQL diretto
pg_dump -h host -U user -d database > backup.sql

# Restore
psql -h host -U user -d database < backup.sql
```

---

## Aggiornamenti

### Deploy Automatico (Consigliato):
1. Push su GitHub branch `main`
2. Vercel/Railway deploiano automaticamente
3. Verifica su dominio di produzione

### Deploy Manuale:
```bash
# Vercel
vercel --prod

# Railway
railway up
```
