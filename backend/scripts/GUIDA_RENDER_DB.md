# Guida: Aggiungere Ordini Manualmente su Render Database

## 📋 Prerequisiti
- Accesso al dashboard di Render
- Database PostgreSQL attivo su Render

## 🚀 Procedura Passo-Passo

### Passo 1: Accedi al Database

1. Vai su [Render Dashboard](https://dashboard.render.com/)
2. Seleziona il tuo database PostgreSQL
3. Clicca sul tab **"Connect"**
4. Troverai diverse opzioni di connessione

### Passo 2: Apri la Console PSQL

**Opzione A - PSQL Command (Consigliata)**
1. Nel tab "Connect", cerca la sezione **"PSQL Command"**
2. Copia il comando che inizia con `PGPASSWORD=...`
3. Apri il terminale sul tuo computer
4. Incolla e esegui il comando
5. Sarai connesso al database

**Opzione B - Web Shell**
1. Nel tab "Connect", clicca su **"Connect"** in alto a destra
2. Seleziona **"External Connection"**
3. Usa un client come DBeaver, pgAdmin o TablePlus con le credenziali fornite

### Passo 3: Trova gli ID Necessari

Prima di inserire ordini, devi trovare:

#### A. ID dell'utente "test"
```sql
SELECT id, username FROM users WHERE username = 'test';
```
Output esempio:
```
 id | username 
----+----------
  5 | test
```
**Annota l'ID** (es: 5)

#### B. ID dei turni della stagione 2025
```sql
SELECT s.id, s.shift_number, se.year 
FROM shifts s 
JOIN seasons se ON s.season_id = se.id 
WHERE se.year = 2025
ORDER BY s.shift_number;
```
Output esempio:
```
 id | shift_number | year 
----+--------------+------
  1 |            1 | 2025
  2 |            2 | 2025
  3 |            3 | 2025
  4 |            4 | 2025
  5 |            5 | 2025
  6 |            6 | 2025
```
**Annota gli ID dei turni** (es: turno 1 = id 1, turno 2 = id 2, etc.)

### Passo 4: Inserisci gli Ordini

Usa il file `add_orders_render.sql` come template. Esempio:

```sql
INSERT INTO orders (
  title,
  description,
  amount,
  category,
  order_date,
  shift_id,
  user_id,
  status,
  created_by,
  created_at,
  updated_at
) VALUES (
  'Rifornimento carburante gennaio',
  'Rifornimento mensile per i gommoni',
  250.00,
  'Carburante',
  '2025-01-15',
  1,  -- shift_id: ID del turno (sostituisci con quello trovato)
  1,  -- user_id: ID utente test (sostituisci con quello trovato)
  'completed',
  'test',  -- created_by: username
  NOW(),
  NOW()
);
```

#### Valori Importanti:

**shift_id** (Turno):
- `1` = Primo turno
- `2` = Secondo turno
- `3` = Terzo turno
- `4` = Quarto turno
- `5` = Quinto turno
- `6` = Sesto turno

**status** (Stato):
- `'pending'` = Programmato (da fare)
- `'completed'` = Effettuato (completato)

**category** (Categoria):
Puoi usare qualsiasi stringa, esempi:
- `'Carburante'`
- `'Manutenzione'`
- `'Riparazioni'`
- `'Sicurezza'`
- `'Attrezzatura'`

**order_date** (Data):
Formato: `'YYYY-MM-DD'` (es: `'2025-03-15'`)

### Passo 5: Verifica gli Ordini Inseriti

```sql
SELECT 
  id,
  title,
  amount,
  category,
  order_date,
  shift_id,
  status,
  created_by
FROM orders
WHERE created_by = 5  -- sostituisci con l'ID utente test
ORDER BY order_date DESC;
```

### Passo 6: Controlla nell'App

1. Fai logout e login nell'app con l'utente "test"
2. Vai alla pagina "Ordini"
3. Dovresti vedere gli ordini appena inseriti

## 🔄 Inserimento Multiplo Rapido

Per inserire più ordini velocemente, puoi eseguire tutti gli INSERT insieme:

```sql
-- Inserisci 5 ordini in una volta
INSERT INTO orders (title, description, amount, category, order_date, shift_id, user_id, status, created_by, created_at, updated_at) VALUES
('Ordine 1', 'Descrizione 1', 100.00, 'Categoria1', '2025-01-15', 1, 1, 'completed', 'test', NOW(), NOW()),
('Ordine 2', 'Descrizione 2', 200.00, 'Categoria2', '2025-02-15', 2, 1, 'completed', 'test', NOW(), NOW()),
('Ordine 3', 'Descrizione 3', 300.00, 'Categoria3', '2025-03-15', 3, 1, 'pending', 'test', NOW(), NOW()),
('Ordine 4', 'Descrizione 4', 400.00, 'Categoria4', '2025-04-15', 4, 1, 'pending', 'test', NOW(), NOW()),
('Ordine 5', 'Descrizione 5', 500.00, 'Categoria5', '2025-05-15', 5, 1, 'completed', 'test', NOW(), NOW());
```

## 📝 Template Veloce

Copia e modifica questo template per ogni ordine:

```sql
INSERT INTO orders (title, description, amount, category, order_date, shift_id, user_id, status, created_by, created_at, updated_at)
VALUES ('TITOLO', 'DESCRIZIONE', IMPORTO, 'CATEGORIA', 'YYYY-MM-DD', SHIFT_ID, USER_ID, 'STATUS', 'USERNAME', NOW(), NOW());
```

## ❓ Troubleshooting

### Errore: "null value in column user_id"
- Assicurati di aver sostituito `user_id` con l'ID corretto dell'utente

### Errore: "null value in column shift_id"
- Assicurati di aver sostituito `shift_id` con l'ID corretto del turno

### Errore: "invalid input syntax for type numeric"
- L'importo deve essere un numero senza virgolette: `250.00` non `'250.00'`

### Gli ordini non appaiono nell'app
- Verifica che `user_id` corrisponda all'ID dell'utente con cui hai fatto login
- Verifica che `shift_id` corrisponda a un turno della stagione corrente
- Prova a fare logout e login di nuovo

### Come eliminare un ordine inserito per errore
```sql
DELETE FROM orders WHERE id = ID_ORDINE;
```

## 🎯 Esempio Completo

```sql
-- 1. Trova ID utente
SELECT id FROM users WHERE username = 'test';
-- Risultato: id = 1

-- 2. Trova ID turno
SELECT s.id, s.shift_number FROM shifts s 
JOIN seasons se ON s.season_id = se.id 
WHERE se.year = 2025 AND s.shift_number = 1;
-- Risultato: id = 1

-- 3. Inserisci ordine
INSERT INTO orders (title, description, amount, category, order_date, shift_id, user_id, status, created_by, created_at, updated_at)
VALUES ('Rifornimento carburante', 'Benzina per gommoni', 250.00, 'Carburante', '2025-03-15', 1, 1, 'completed', 'test', NOW(), NOW());

-- 4. Verifica
SELECT * FROM orders WHERE created_by = 'test' ORDER BY created_at DESC LIMIT 1;
```

## 💡 Suggerimenti

- Usa date realistiche (non troppo nel futuro)
- Varia le categorie per testare i filtri
- Metti alcuni ordini come 'pending' e altri come 'completed'
- Usa importi diversi per testare l'ordinamento
- Distribuisci gli ordini su turni diversi

## 🔐 Sicurezza

- Non condividere le credenziali del database
- Usa sempre `NOW()` per `created_at` e `updated_at`
- Non modificare mai direttamente `id` (è auto-incrementale)
