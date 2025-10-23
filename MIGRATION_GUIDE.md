# Guida alla Migrazione Dati

## Elementi Necessari per Ogni Entità

### 1. PROBLEMA (Problem)
Campi richiesti dal database:
```python
- boat_id: int  # ID della barca
- boat_name: str  # Nome della barca
- boat_type: str  # Tipo (Optimist, 420, Laser, ecc.)
- part_affected: str  # Parte danneggiata (Scafo, Vela, Timone, ecc.)
- reported_date: date  # Data segnalazione
- status: str  # 'open' o 'closed'
- shift_id: int  # ID del turno
```

Campi opzionali:
```python
- notes: str  # Note aggiuntive
- reported_by: str  # Chi ha segnalato
```

### 2. LAVORO (Work)
Campi richiesti:
```python
- title: str  # Titolo del lavoro
- category: str  # Categoria (Manutenzione, Riparazione, Pulizia, ecc.)
- work_date: date  # Data del lavoro
- status: str  # 'pending' o 'completed'
- shift_id: int  # ID del turno
- user_id: int  # ID dell'utente che ha creato
```

Campi opzionali:
```python
- notes: str  # Descrizione dettagliata
- created_by: str  # Username del creatore
```

### 3. ORDINE (Order)
Campi richiesti:
```python
- title: str  # Titolo/descrizione dell'ordine
- amount: float  # Importo in euro
- category: str  # Categoria (Attrezzatura, Cibo, Materiali, ecc.)
- order_date: date  # Data dell'ordine
- status: str  # 'pending' o 'completed'
- shift_id: int  # ID del turno
- user_id: int  # ID dell'utente che ha creato
```

Campi opzionali:
```python
- notes: str  # Note aggiuntive
- created_by: str  # Username del creatore
```

## Come Importare i Dati

### Opzione 1: Script Python (Consigliato)

Crea un file `import_data.py`:

```python
import requests
import json
from datetime import datetime

# Configurazione
API_URL = "http://localhost:8000"  # URL del tuo backend
USERNAME = "admin"
PASSWORD = "admin123"

# 1. Login per ottenere il token
login_response = requests.post(f"{API_URL}/auth/login", json={
    "username": USERNAME,
    "password": PASSWORD
})
token = login_response.json()["access_token"]
headers = {"Authorization": f"Bearer {token}"}

# 2. Ottieni ID della stagione 2025
seasons_response = requests.get(f"{API_URL}/seasons", headers=headers)
season_2025 = next((s for s in seasons_response.json() if s["name"] == "2025"), None)

if not season_2025:
    # Crea stagione 2025
    season_response = requests.post(f"{API_URL}/seasons", 
        json={"name": "2025", "start_date": "2025-01-01", "end_date": "2025-12-31"},
        headers=headers
    )
    season_2025 = season_response.json()

# 3. Ottieni o crea turni
shifts_response = requests.get(f"{API_URL}/shifts?season_id={season_2025['id']}", headers=headers)
shifts = shifts_response.json()

# Se non ci sono turni, creali
if not shifts:
    for i in range(1, 11):  # Crea 10 turni
        requests.post(f"{API_URL}/shifts",
            json={
                "season_id": season_2025["id"],
                "shift_number": i,
                "start_date": f"2025-0{(i-1)//3+1}-{((i-1)%3)*10+1:02d}",
                "end_date": f"2025-0{(i-1)//3+1}-{((i-1)%3+1)*10:02d}"
            },
            headers=headers
        )
    shifts_response = requests.get(f"{API_URL}/shifts?season_id={season_2025['id']}", headers=headers)
    shifts = shifts_response.json()

first_shift_id = shifts[0]["id"]

# 4. Importa PROBLEMI
problems_data = [
    {
        "boat_name": "Optimist 1",
        "boat_type": "Optimist",
        "part_affected": "Scafo",
        "reported_date": "2025-01-15",
        "status": "open",
        "shift_id": first_shift_id,
        "notes": "Crepa sul lato sinistro"
    },
    # Aggiungi altri problemi...
]

for problem in problems_data:
    requests.post(f"{API_URL}/problems", json=problem, headers=headers)

# 5. Importa LAVORI
works_data = [
    {
        "title": "Pulizia barche",
        "category": "Pulizia",
        "work_date": "2025-01-16",
        "status": "completed",
        "shift_id": first_shift_id,
        "notes": "Pulizia completa di 5 Optimist"
    },
    # Aggiungi altri lavori...
]

for work in works_data:
    requests.post(f"{API_URL}/works", json=work, headers=headers)

# 6. Importa ORDINI
orders_data = [
    {
        "title": "Corda nuova",
        "amount": 45.50,
        "category": "Attrezzatura",
        "order_date": "2025-01-17",
        "status": "completed",
        "shift_id": first_shift_id
    },
    # Aggiungi altri ordini...
]

for order in orders_data:
    requests.post(f"{API_URL}/orders", json=order, headers=headers)

print("✅ Importazione completata!")
```

### Opzione 2: CSV Import

Se hai i dati in CSV, puoi usare pandas:

```python
import pandas as pd
import requests

# Leggi CSV
problems_df = pd.read_csv('problems.csv')
works_df = pd.read_csv('works.csv')
orders_df = pd.read_csv('orders.csv')

# Login e ottieni token (come sopra)
# ...

# Importa problemi
for _, row in problems_df.iterrows():
    requests.post(f"{API_URL}/problems", json=row.to_dict(), headers=headers)

# Importa lavori
for _, row in works_df.iterrows():
    requests.post(f"{API_URL}/works", json=row.to_dict(), headers=headers)

# Importa ordini
for _, row in orders_df.iterrows():
    requests.post(f"{API_URL}/orders", json=row.to_dict(), headers=headers)
```

### Opzione 3: Interfaccia Web

Usa l'app stessa per inserire i dati manualmente:
1. Accedi all'app
2. Seleziona stagione 2025 e turno
3. Usa i pulsanti "+" per aggiungere problemi/lavori/ordini

## Note Importanti

- **shift_id**: Ogni elemento DEVE essere associato a un turno valido
- **user_id**: Viene automaticamente assegnato dall'utente loggato
- **Date**: Formato ISO `YYYY-MM-DD` (es: `2025-01-15`)
- **Status**: Solo `'open'/'closed'` per problemi, `'pending'/'completed'` per lavori/ordini
- **Amount**: Numero decimale con punto (es: `45.50` non `45,50`)
