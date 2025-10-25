# Configurazione Render per SPA Routing

## Problema
Quando si accede direttamente a URL come `/boats`, `/works`, `/orders` su Render, si ottiene un errore 404 o schermata bianca perché Render cerca un file fisico invece di servire `index.html` per il routing client-side.

## Soluzioni (in ordine di priorità)

### ✅ Soluzione 1: Configurazione tramite Dashboard Render (OBBLIGATORIA)

**Questa è l'unica soluzione che funziona al 100% su Render Static Sites.**

1. Vai su [Render Dashboard](https://dashboard.render.com)
2. Seleziona il tuo servizio `lni-frontend`
3. Nel menu laterale sinistro, clicca su **"Redirects/Rewrites"**
4. Clicca su **"Add Rule"** e aggiungi le seguenti regole **UNA PER UNA** (in questo ordine):

#### Regole da aggiungere:

| Source | Destination | Action | Note |
|--------|-------------|--------|------|
| `/*` | `/index.html` | **Rewrite** | Cattura TUTTI i path |

**IMPORTANTE**: 
- Usa **Rewrite** (NON Redirect) per mantenere l'URL nel browser
- Basta UNA SOLA regola `/*` → `/index.html` con action **Rewrite**
- Render applicherà questa regola solo se non esiste un file fisico al path richiesto

#### Screenshot esempio:
```
Source:      /*
Destination: /index.html
Action:      Rewrite
```

### 📋 Soluzione 2: File di configurazione (Backup)

I seguenti file sono già configurati nel progetto come backup:

#### `frontend/public/_redirects` (per Netlify/Render)
```
/*    /index.html   200
```

#### `render.yaml` (root del progetto)
```yaml
services:
  - type: web
    name: lni-frontend
    env: static
    buildCommand: cd frontend && npm install && npm run build
    staticPublishPath: frontend/dist
    routes:
      - type: rewrite
        source: /*
        destination: /index.html
```

**NOTA**: Questi file potrebbero non essere sufficienti. La configurazione via Dashboard è **necessaria**.

## Come Verificare che Funziona

Dopo aver configurato le regole nella Dashboard:

1. Fai un **nuovo deploy** su Render (o aspetta il prossimo auto-deploy)
2. Aspetta che il deploy sia **completato** (status: Live)
3. Prova ad accedere direttamente a questi URL (copia-incolla nella barra indirizzi):
   - `https://lni.onrender.com/boats`
   - `https://lni.onrender.com/works`
   - `https://lni.onrender.com/orders`
   - `https://lni.onrender.com/reports`

✅ **Successo**: Le pagine si caricano correttamente con il contenuto React  
❌ **Errore**: Vedi "404 Not Found" o schermata bianca

## Troubleshooting

### Problema: Vedo ancora 404 dopo aver configurato le regole

**Soluzioni**:
1. **Pulisci cache browser**: Ctrl+Shift+R (Windows/Linux) o Cmd+Shift+R (Mac)
2. **Prova in incognito**: Apri una finestra privata/incognito
3. **Verifica le regole**: Torna su Dashboard → Redirects/Rewrites e controlla che:
   - Source sia esattamente `/*` (con asterisco)
   - Destination sia esattamente `/index.html` (con slash iniziale)
   - Action sia **Rewrite** (non Redirect)
4. **Fai un nuovo deploy**: A volte Render richiede un nuovo deploy per applicare le regole

### Problema: Le regole non appaiono nella Dashboard

Se non vedi la sezione "Redirects/Rewrites":
1. Assicurati che il servizio sia di tipo **"Static Site"** (non Web Service)
2. Se è un Web Service, dovrai ricrearlo come Static Site

### Problema: Funziona su localhost ma non su Render

Questo è normale. In locale, Vite gestisce automaticamente il routing SPA. Su Render serve configurare le regole di rewrite.

## Note Tecniche

- **Rewrite vs Redirect**: 
  - **Rewrite**: Serve `/index.html` mantenendo l'URL originale (es. `/boats` rimane `/boats`)
  - **Redirect**: Cambia l'URL nel browser (es. `/boats` diventa `/`)
  - Per SPA usa sempre **Rewrite**

- **Ordine delle regole**: Non importa se hai solo `/*`, ma se aggiungi regole specifiche mettile prima

- **File statici**: Render serve sempre i file statici reali (CSS, JS, immagini) prima di applicare le regole di rewrite

- **Cache**: Render può cachare le risposte. Se fai modifiche, aspetta qualche minuto o forza il refresh

## Link Utili

- [Render Docs - Redirects/Rewrites](https://render.com/docs/redirects-rewrites)
- [React Router Deployment](https://reactrouter.com/en/main/guides/deployment)
