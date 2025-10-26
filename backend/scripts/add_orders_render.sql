-- Script per aggiungere ordini manualmente su Render PostgreSQL
-- 
-- ISTRUZIONI:
-- 1. Vai su Render Dashboard > tuo database PostgreSQL
-- 2. Clicca su "Connect" e poi "PSQL Command"
-- 3. Copia e incolla questo script modificando i valori
--
-- NOTA: Sostituisci i valori tra <...> con i tuoi dati reali

-- 1. Prima trova l'ID dell'utente "test"
SELECT id, username FROM users WHERE username = 'test';
-- Annota l'ID che ottieni (es: 5)

-- 2. Trova gli ID dei turni della stagione 2025
SELECT s.id, s.shift_number, se.year 
FROM shifts s 
JOIN seasons se ON s.season_id = se.id 
WHERE se.year = 2025
ORDER BY s.shift_number;
-- Annota gli ID dei turni (es: turno 1 = id 1, turno 2 = id 2, etc.)

-- 3. Inserisci gli ordini (modifica i valori come necessario)

-- Esempio Ordine 1
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
  'Silla',  -- titolo
  'Calce',  -- descrizione
  15.00,  -- importo
  'Altro',  -- categoria
  '2025-09-06',  -- data ordine (YYYY-MM-DD)
  1,  -- shift_id: ID del turno (sostituisci con l'ID trovato sopra)
  1,  -- user_id: ID utente "test" (sostituisci con l'ID trovato sopra)
  'completed',  -- status: 'pending' o 'completed'
  'test',  -- created_by: username
  NOW(),
  NOW()
);

-- Esempio Ordine 2
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
  'Acquisto materiale pulizia',
  'Detergenti e spugne per manutenzione',
  85.50,
  'Manutenzione',
  '2025-02-10',
  2,
  1,
  'completed',
  'test',
  NOW(),
  NOW()
);

-- Esempio Ordine 3
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
  'Riparazione motore gommone',
  'Sostituzione candele e filtro olio',
  450.00,
  'Riparazioni',
  '2025-03-05',
  3,
  1,
  'pending',
  'test',
  NOW(),
  NOW()
);

-- Esempio Ordine 4
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
  'Acquisto giubbotti salvagente',
  'Rinnovo dotazioni di sicurezza',
  320.00,
  'Sicurezza',
  '2025-03-20',
  4,
  1,
  'pending',
  'test',
  NOW(),
  NOW()
);

-- Esempio Ordine 5
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
  'Manutenzione pontile',
  'Vernice e materiale per riparazione pontile',
  180.00,
  'Manutenzione',
  '2025-04-01',
  5,
  1,
  'completed',
  'test',
  NOW(),
  NOW()
);

-- Verifica che gli ordini siano stati inseriti
SELECT 
  id,
  title,
  amount,
  category,
  order_date,
  shift_id,
  user_id,
  status,
  created_by
FROM orders
WHERE created_by = 'test'  -- filtra per username
ORDER BY order_date DESC;
