# Guida Importazione Dati 2025

Questa guida spiega come importare i dati esistenti dal 2025 nel nuovo database.

## 📋 Prerequisiti

1. Backend in esecuzione su `http://localhost:8000`
2. Python 3.8+ installato
3. Libreria `requests` installata: `pip install requests`
4. Credenziali admin per l'accesso

## 🚀 Metodi di Importazione

### Metodo 1: Da File JSON (Diretto)

Se hai già i dati in formato JSON:

```bash
cd /home/popp/LNI/backend/scripts
python import_2025_data.py --json-file data_2025.json
```

### Metodo 2: Da File CSV

Se hai i dati in formato CSV (Excel, Google Sheets, etc.):

#### Passo 1: Prepara i file CSV

Crea 4 file CSV con queste intestazioni:

**users.csv**
```csv
username,password,role
mario.rossi,temp2025,user
luca.bianchi,temp2025,user
```

**orders.csv**
```csv
title,amount,category,order_date,shift_id,season_id,status,notes,created_by
Rifornimento carburante,250.00,Carburante,2025-01-15,1,1,completed,Note opzionali,mario.rossi
```

**works.csv**
```csv
title,description,category,work_date,shift_id,season_id,status,notes,created_by
Pulizia pontile,Descrizione dettagliata,Pulizia,2025-01-15,1,1,completed,Note,mario.rossi
```

**problems.csv**
```csv
boat_id,description,part_affected,reported_date,shift_id,season_id,status,created_by
1,Perdita olio motore,Motore,2025-01-15,1,1,closed,mario.rossi
```

#### Passo 2: Converti CSV in JSON

```bash
python csv_to_json.py \
  --users users.csv \
  --orders orders.csv \
  --works works.csv \
  --problems problems.csv \
  --output data_2025.json
```

#### Passo 3: Importa i dati

```bash
python import_2025_data.py --json-file data_2025.json
```

## 📝 Note Importanti

### Utenti Non Registrati

Se hai dati creati da utenti non ancora registrati nell'app:

1. **Opzione A**: Includi gli utenti nel file `users` con password temporanee
2. **Opzione B**: Assegna i dati a un utente esistente modificando il campo `created_by`

### ID Shift e Season

- **shift_id**: Da 1 a 6 (Primo, Secondo, Terzo, Quarto, Quinto, Sesto turno)
- **season_id**: 1 per la stagione 2025 (verifica nel database)

### Status

- **Orders**: `pending` o `completed`
- **Works**: `pending` o `completed`
- **Problems**: `open` o `closed`

### Boat ID

Per i problemi, devi conoscere l'ID della barca nel database. Puoi:
1. Controllare nel database: `SELECT id, name FROM boats;`
2. Usare l'API: `GET http://localhost:8000/api/boats`

## 🔧 Opzioni Avanzate

### Cambiare URL API

```bash
python import_2025_data.py \
  --json-file data_2025.json \
  --api-url http://tuoserver:8000/api
```

### Credenziali Admin Diverse

```bash
python import_2025_data.py \
  --json-file data_2025.json \
  --admin-user tuo_admin \
  --admin-pass tua_password
```

## 📊 Esempio Completo

```bash
# 1. Converti i CSV
python csv_to_json.py \
  --users utenti_2025.csv \
  --orders ordini_2025.csv \
  --works lavori_2025.csv \
  --problems problemi_2025.csv \
  --output dati_completi_2025.json

# 2. Importa nel database
python import_2025_data.py --json-file dati_completi_2025.json

# Output atteso:
# ✓ Login effettuato come admin
# 📝 Importazione utenti...
#   ✓ Utente creato: mario.rossi
#   ✓ Utente creato: luca.bianchi
# 💰 Importazione ordini...
#   ✓ Ordine creato: Rifornimento carburante
# 🔧 Importazione lavori...
#   ✓ Lavoro creato: Pulizia pontile
# ⚠️  Importazione problemi...
#   ✓ Problema creato: Perdita olio motore
# 
# ================================================
# 📊 RIEPILOGO IMPORTAZIONE
# ================================================
# ✓ Utenti creati:    2
# ✓ Ordini creati:    1
# ✓ Lavori creati:    1
# ✓ Problemi creati:  1
# ✗ Errori:           0
# ================================================
```

## ❓ Troubleshooting

### Errore: "Connection refused"
- Verifica che il backend sia in esecuzione
- Controlla l'URL dell'API

### Errore: "Login failed"
- Verifica username e password admin
- Usa le opzioni `--admin-user` e `--admin-pass`

### Errore: "User already exists"
- Non è un problema! Lo script continua con gli altri dati
- Gli utenti esistenti vengono saltati

### Errore: "Invalid boat_id"
- Verifica che l'ID della barca esista nel database
- Usa l'API per vedere le barche disponibili

## 🔄 Importazione Incrementale

Puoi eseguire lo script più volte. Gli utenti duplicati verranno saltati, mentre ordini/lavori/problemi verranno sempre creati (anche se simili).

Per evitare duplicati, filtra i dati prima dell'importazione.

## 📞 Supporto

Per problemi o domande, controlla i log del backend e dello script di importazione.
