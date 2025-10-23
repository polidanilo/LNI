# 🔧 GUIDA COMPLETA - RISOLUZIONE PROBLEMI APP LNI

## 📋 PROBLEMI IDENTIFICATI

### ❌ Problema 1: Turni Duplicati nel Database
- **Sintomo**: "Turno 2" appare più volte nel selettore Dashboard
- **Causa**: Script `add_seasons.py` eseguito più volte senza controlli
- **Impatto**: Impossibile selezionare turni correttamente

### ❌ Problema 2: Orders/Works Caricano Senza Turno
- **Sintomo**: Liste mostrate anche senza turno selezionato
- **Causa**: Query non richiedono `shift_id` obbligatorio
- **Impatto**: Dati inconsistenti, confusione utente

### ❌ Problema 3: Manca Vincolo Unicità Database
- **Sintomo**: Database permette turni duplicati
- **Causa**: Nessun vincolo UNIQUE su (season_id, shift_number)
- **Impatto**: Possibili duplicati futuri

---

## 🛠️ SOLUZIONE - PASSO PER PASSO

### **STEP 1: Pulire Turni Duplicati dal Database**

```bash
# 1. Entra nella directory backend
cd /home/popp/LNI/lniworks

# 2. Attiva ambiente virtuale (se necessario)
source venv/bin/activate

# 3. Esegui lo script di pulizia
python app/db/clean_duplicate_shifts.py
```

**Cosa fa lo script:**
- ✅ Analizza turni duplicati
- ✅ Mostra riepilogo duplicati trovati
- ✅ Chiede conferma prima di eliminare
- ✅ Mantiene solo il primo turno inserito per ogni (season_id, shift_number)
- ✅ Mostra riepilogo finale

**Output atteso:**
```
🔍 Analisi turni duplicati...

⚠️  Trovati 1 gruppi di turni duplicati:
   - Stagione 'Estate 2025', Turno 2: 3 copie

❓ Vuoi eliminare i duplicati? (mantiene solo il primo inserito) [s/N]: s

   🗑️  Eliminando turno ID 8 (Stagione 1, Turno 2)
   🗑️  Eliminando turno ID 9 (Stagione 1, Turno 2)

✅ Eliminati 2 turni duplicati!

📊 Riepilogo turni per stagione:
   Estate 2025 (2025):
      - Turno 1: 2025-06-01 → 2025-06-30
      - Turno 2: 2025-07-01 → 2025-07-31
      - Turno 3: 2025-08-01 → 2025-08-31
      - Turno 4: 2025-09-01 → 2025-09-30
```

---

### **STEP 2: Aggiungere Vincolo Unicità al Database**

```bash
# Esegui lo script per aggiungere vincolo
python app/db/add_unique_constraint.py
```

**Cosa fa lo script:**
- ✅ Verifica se vincolo esiste già
- ✅ Aggiunge `UNIQUE (season_id, shift_number)` alla tabella shifts
- ✅ Previene futuri duplicati

**Output atteso:**
```
🔧 Aggiunta vincolo di unicità su shifts...
✅ Vincolo di unicità aggiunto con successo!
   Ora non è più possibile inserire turni duplicati per la stessa stagione
```

**IMPORTANTE:** Se ricevi errore, significa che ci sono ancora duplicati. Torna allo STEP 1.

---

### **STEP 3: Riavviare Backend e Frontend**

```bash
# 1. Riavvia il backend (se in esecuzione)
# Premi Ctrl+C per fermare il server, poi:
cd /home/popp/LNI/lniworks
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# 2. In un altro terminale, riavvia il frontend
cd /home/popp/LNI/frontend
npm run dev
```

---

### **STEP 4: Verificare il Fix**

#### ✅ Test 1: Dashboard - Selezione Turni
1. Apri Dashboard
2. Seleziona "Estate 2025" (o altra stagione)
3. **VERIFICA**: Dropdown turni mostra ogni turno UNA SOLA VOLTA
4. Seleziona "Turno 1"
5. **VERIFICA**: Dati caricano correttamente

#### ✅ Test 2: Orders - Richiede Turno
1. Vai su pagina "Acquisti"
2. **SENZA turno selezionato**: Vedi messaggio "Seleziona una stagione e un turno dalla Dashboard"
3. Torna alla Dashboard, seleziona turno
4. Torna su "Acquisti"
5. **VERIFICA**: Lista ordini del turno selezionato appare

#### ✅ Test 3: Works - Richiede Turno
1. Vai su pagina "Lavori"
2. **SENZA turno selezionato**: Vedi messaggio "Seleziona una stagione e un turno dalla Dashboard"
3. Con turno selezionato: Lista lavori appare

#### ✅ Test 4: Boats - Gestione Turno
1. Vai su pagina "Imbarcazioni"
2. **SENZA turno selezionato**: Nessun problema carica (corretto)
3. Con turno selezionato: Problemi del turno appaiono
4. Aggiungi nuovo problema
5. **VERIFICA**: Problema salvato con shift_id corretto

#### ✅ Test 5: Reports - Gestione Stagione
1. Vai su pagina "Resoconto"
2. Seleziona stagione
3. Seleziona turni (checkbox)
4. **VERIFICA**: Tabella acquisti mostra solo ordini dei turni selezionati
5. Scarica Excel
6. **VERIFICA**: File contiene solo dati turni selezionati

---

## 🎯 MODIFICHE APPORTATE AL CODICE

### **Frontend - Orders.tsx**
```typescript
// ✅ PRIMA: Caricava sempre, anche senza turno
const { data: orders } = useQuery({
  queryFn: async () => {
    const response = await orderService.getAll({
      shift_id: selectedShift?.id, // ❌ Poteva essere undefined
    });
    return response.data;
  },
});

// ✅ DOPO: Richiede turno obbligatorio
const { data: orders } = useQuery({
  queryFn: async () => {
    if (!selectedShift?.id) return []; // ✅ Ritorna array vuoto
    const response = await orderService.getAll({
      shift_id: selectedShift.id, // ✅ Sempre definito
    });
    return response.data;
  },
  enabled: !!selectedShift?.id, // ✅ Query attiva solo con turno
});

// ✅ UI: Messaggio quando turno non selezionato
{!selectedShift ? (
  <div className="bg-blue-50 border border-blue-200 p-6 rounded">
    <p>Seleziona una stagione e un turno dalla Dashboard</p>
  </div>
) : /* ... lista ordini ... */}
```

### **Frontend - Works.tsx**
- ✅ Stesse modifiche di Orders.tsx
- ✅ Aggiunto `useAppContext` per accedere a `selectedShift`
- ✅ Query attiva solo con turno selezionato
- ✅ Messaggio UI quando turno mancante

### **Frontend - Boats.tsx**
- ✅ Già corretto! Usa `selectedShift` correttamente
- ✅ Problemi caricano solo con turno selezionato

### **Frontend - Reports.tsx**
- ✅ Già corretto! Gestisce stagione e turni multipli

### **Backend - Database**
- ✅ Vincolo UNIQUE su (season_id, shift_number)
- ✅ Previene duplicati futuri

---

## 📊 FLOW CORRETTO DELL'APP

```
1. USER apre Dashboard
   ↓
2. Seleziona Stagione (es. "Estate 2025")
   ↓
3. Dropdown Turni carica turni della stagione (SENZA DUPLICATI)
   ↓
4. Seleziona Turno (es. "Turno 2")
   ↓
5. AppContext salva selectedShift in localStorage
   ↓
6. USER naviga su altre pagine:
   
   📦 ORDERS:
   - Query attiva solo se selectedShift esiste
   - Mostra solo ordini di quel turno
   - Nuovi ordini salvati con shift_id corretto
   
   🔧 WORKS:
   - Query attiva solo se selectedShift esiste
   - Mostra solo lavori di quel turno
   - Nuovi lavori salvati con shift_id corretto
   
   ⛵ BOATS:
   - Mostra tutte le imbarcazioni
   - Problemi filtrati per turno selezionato
   - Nuovi problemi salvati con shift_id corretto
   
   📊 REPORTS:
   - Richiede selezione stagione
   - Permette selezione multipla turni
   - Export Excel contiene solo dati turni selezionati
```

---

## 🚨 TROUBLESHOOTING

### Problema: "Turni ancora duplicati dopo pulizia"
**Soluzione:**
```bash
# Controlla manualmente il database
cd /home/popp/LNI/lniworks
python -c "
from app.db.session import SessionLocal
from app.db.models import Shift
db = SessionLocal()
shifts = db.query(Shift).order_by(Shift.season_id, Shift.shift_number).all()
for s in shifts:
    print(f'ID: {s.id}, Season: {s.season_id}, Shift: {s.shift_number}')
"
```

### Problema: "Errore aggiunta vincolo unicità"
**Causa**: Ci sono ancora duplicati
**Soluzione**: Riesegui STEP 1 (pulizia duplicati)

### Problema: "Orders/Works ancora mostrano dati senza turno"
**Causa**: Browser cache
**Soluzione**:
1. Apri DevTools (F12)
2. Application → Storage → Clear site data
3. Ricarica pagina (Ctrl+Shift+R)

### Problema: "selectedShift null anche dopo selezione"
**Causa**: localStorage non sincronizzato
**Soluzione**:
```javascript
// Apri console browser (F12)
localStorage.clear();
location.reload();
// Poi riseleziona stagione e turno
```

---

## ✅ CHECKLIST FINALE

- [ ] STEP 1: Turni duplicati eliminati
- [ ] STEP 2: Vincolo unicità aggiunto
- [ ] STEP 3: Backend e frontend riavviati
- [ ] Test 1: Dashboard mostra turni senza duplicati
- [ ] Test 2: Orders richiede turno selezionato
- [ ] Test 3: Works richiede turno selezionato
- [ ] Test 4: Boats gestisce correttamente turno
- [ ] Test 5: Reports funziona con selezione multipla
- [ ] Nuovo ordine salvato con shift_id corretto
- [ ] Nuovo lavoro salvato con shift_id corretto
- [ ] Nuovo problema salvato con shift_id corretto

---

## 📞 SUPPORTO

Se incontri problemi:
1. Controlla i log del backend: `tail -f lniworks/logs/app.log`
2. Controlla console browser (F12)
3. Verifica che tutti gli script siano stati eseguiti
4. Riavvia backend e frontend

**File creati per la risoluzione:**
- `/lniworks/app/db/clean_duplicate_shifts.py` - Pulizia duplicati
- `/lniworks/app/db/add_unique_constraint.py` - Vincolo unicità
- `GUIDA_RISOLUZIONE_COMPLETA.md` - Questa guida

---

## 🎉 RISULTATO ATTESO

Dopo aver completato tutti gli step:

✅ **Dashboard**: Turni mostrati UNA SOLA VOLTA
✅ **Orders**: Mostra solo ordini del turno selezionato
✅ **Works**: Mostra solo lavori del turno selezionato
✅ **Boats**: Problemi filtrati per turno selezionato
✅ **Reports**: Export Excel contiene dati corretti
✅ **Flow completo**: Dashboard → Selezione → Altre pagine → Dati corretti
✅ **Persistenza**: Turno selezionato salvato in localStorage
✅ **Validazione**: Impossibile creare duplicati futuri

**L'app ora funziona correttamente con un flow preciso e validato!** 🚀
