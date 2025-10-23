# 🧪 TEST SELEZIONE TURNI - GUIDA RAPIDA

## 🎯 Obiettivo
Verificare che i turni si carichino e selezionino correttamente nella Dashboard.

---

## 📋 STEP 1: Verificare Database

Esegui questo comando per vedere i turni nel database:

```bash
cd /home/popp/LNI/lniworks
python check_shifts.py
```

**Output atteso:**
```
=== STAGIONI ===
ID: 1, Nome: Estate 2025, Anno: 2025

=== TURNI ===
ID: 1, Season: 1, Turno: 1, Date: 2025-06-01 -> 2025-06-30
ID: 2, Season: 1, Turno: 2, Date: 2025-07-01 -> 2025-07-31
ID: 3, Season: 1, Turno: 3, Date: 2025-08-01 -> 2025-08-31
ID: 4, Season: 1, Turno: 4, Date: 2025-09-01 -> 2025-09-30
ID: 5, Season: 1, Turno: 5, Date: 2025-10-01 -> 2025-10-31
ID: 6, Season: 1, Turno: 6, Date: 2025-11-01 -> 2025-11-30

=== TOTALE TURNI: 6 ===
```

✅ **Se vedi 6 turni con ID diversi** → Database OK
❌ **Se vedi turni duplicati** → Esegui `python app/db/clean_duplicate_shifts.py`

---

## 📋 STEP 2: Verificare Backend API

Testa l'endpoint API per i turni:

```bash
# Assicurati che il backend sia in esecuzione
cd /home/popp/LNI/lniworks
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

In un altro terminale, testa l'API:

```bash
# Ottieni il token (sostituisci con le tue credenziali)
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin"}'

# Copia il token dalla risposta, poi:
curl -X GET http://localhost:8000/shifts/season/1 \
  -H "Authorization: Bearer TUO_TOKEN_QUI"
```

**Output atteso:**
```json
[
  {
    "id": 1,
    "season_id": 1,
    "shift_number": 1,
    "start_date": "2025-06-01",
    "end_date": "2025-06-30",
    "created_at": "..."
  },
  {
    "id": 2,
    "season_id": 1,
    "shift_number": 2,
    ...
  },
  ...
]
```

✅ **Se vedi array con 6 turni** → Backend API OK
❌ **Se vedi errore 401** → Problema autenticazione
❌ **Se vedi array vuoto** → Problema query database

---

## 📋 STEP 3: Verificare Frontend

1. **Apri il browser** e vai su `http://localhost:5173` (o la tua porta)

2. **Apri DevTools** (F12) → Console

3. **Vai sulla Dashboard**

4. **Seleziona la stagione "Estate 2025"**

5. **Guarda la console** - Dovresti vedere:

```
🔄 Fetching shifts for season: 1
✅ Shifts received: [Array(6)]
📊 Dashboard State: {
  selectedSeason: { id: 1, name: "Estate 2025", year: 2025 },
  selectedShift: null,
  shifts: [Array(6)],
  shiftsLoading: false,
  shiftsError: null
}
```

6. **Sotto il dropdown "Turno"** dovresti vedere:
   - `✅ 6 turni trovati`

7. **Clicca sul dropdown "Turno"** - Dovresti vedere:
   - Turno 1 (dal 01/06/2025 al 30/06/2025)
   - Turno 2 (dal 01/07/2025 al 31/07/2025)
   - Turno 3 (dal 01/08/2025 al 31/08/2025)
   - Turno 4 (dal 01/09/2025 al 30/09/2025)
   - Turno 5 (dal 01/10/2025 al 31/10/2025)
   - Turno 6 (dal 01/11/2025 al 30/11/2025)

8. **Seleziona "Turno 1"**

9. **Guarda la console** - Dovresti vedere:

```
🔄 handleShiftChange called with: 1
📋 Available shifts: [Array(6)]
🎯 Found shift: { id: 1, season_id: 1, shift_number: 1, ... }
✅ Setting selected shift: { id: 1, ... }
📊 Dashboard State: {
  selectedSeason: { id: 1, ... },
  selectedShift: { id: 1, shift_number: 1, ... },
  shifts: [Array(6)],
  ...
}
```

10. **La Dashboard dovrebbe mostrare:**
    - Imbarcazioni danneggiate (numero)
    - Ultimi lavori aggiunti (lista)
    - Ultimi acquisti aggiunti (lista)

---

## 🐛 TROUBLESHOOTING

### ❌ Problema: "Nessun turno disponibile"

**Possibili cause:**

1. **Backend non in esecuzione**
   ```bash
   # Verifica se il backend è attivo
   curl http://localhost:8000/docs
   ```

2. **Errore autenticazione**
   - Apri DevTools → Network
   - Cerca la chiamata a `/shifts/season/1`
   - Se vedi 401: problema token
   - Se vedi 404: endpoint non trovato
   - Se vedi 500: errore backend

3. **Database vuoto**
   ```bash
   python check_shifts.py
   # Se non vedi turni, esegui:
   python app/db/add_seasons.py
   ```

### ❌ Problema: "Turni si caricano ma non si selezionano"

**Verifica console browser:**

```javascript
// Se vedi questo errore:
🔄 handleShiftChange called with: NaN
❌ Shift not found for id: NaN

// Significa che il value dell'option non è un numero
// Verifica che le option abbiano value={shift.id} e non value={shift}
```

**Soluzione:**
- Il codice è già corretto: `<option value={shift.id}>`
- Prova a pulire la cache: Ctrl+Shift+R

### ❌ Problema: "Turni duplicati"

```bash
# Esegui lo script di pulizia
cd /home/popp/LNI/lniworks
python app/db/clean_duplicate_shifts.py

# Poi aggiungi vincolo unicità
python app/db/add_unique_constraint.py
```

### ❌ Problema: "selectedShift rimane null"

**Verifica localStorage:**

```javascript
// Apri console browser
localStorage.getItem('selectedShift')

// Se è null o corrotto:
localStorage.clear()
location.reload()
```

### ❌ Problema: "Errore CORS"

**Verifica backend:**

```python
# In lniworks/app/main.py dovrebbe esserci:
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # O specifica il tuo frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## ✅ CHECKLIST FINALE

- [ ] Database contiene 6 turni senza duplicati
- [ ] Backend API restituisce 6 turni per season_id=1
- [ ] Frontend carica 6 turni quando selezioni stagione
- [ ] Dropdown mostra "✅ 6 turni trovati"
- [ ] Puoi selezionare un turno dal dropdown
- [ ] Console mostra "✅ Setting selected shift"
- [ ] Dashboard mostra dati del turno selezionato
- [ ] Navigando su Orders/Works vedi dati del turno

---

## 📞 DEBUG AVANZATO

Se il problema persiste, raccogli queste informazioni:

1. **Output di `check_shifts.py`**
2. **Screenshot della console browser con errori**
3. **Screenshot del Network tab (chiamata `/shifts/season/1`)**
4. **Output di `localStorage.getItem('selectedShift')`**

E condividile per analisi più approfondita!

---

## 🎉 SUCCESSO!

Se tutti i test passano:

✅ Database configurato correttamente
✅ Backend API funzionante
✅ Frontend carica e seleziona turni
✅ Flow completo Dashboard → Altre pagine funziona
✅ App pronta per l'uso! 🚀
