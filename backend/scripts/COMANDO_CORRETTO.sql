-- COMANDO CORRETTO per inserire l'ordine "Silla"
-- Esegui questo comando nel tuo database Render

-- PRIMA: Verifica i valori enum corretti
SELECT enumlabel FROM pg_enum WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'orderstatus');
-- Annota i valori esatti (es: 'pending', 'completed' oppure 'PENDING', 'COMPLETED')

-- POI: Inserisci l'ordine usando il valore corretto
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
  'Milesi (contanti)',
  'Tubi in gomma',
  54.00,
  'Manutenzione',
  '2025-08-19',
  6,  -- shift_id del Primo turno
  1,  -- user_id dell'utente test
  'COMPLETED',  -- Nota: enum PostgreSQL è case-sensitive, prova COMPLETED
  'test',  -- username
  NOW(),
  NOW()
);

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
  'Nauty Delta',
  'Riparazione su motori suzuki 1 e 3',
  778.00,
  'Manutenzione',
  '2025-10-18',
  6,  -- shift_id del Primo turno
  1,  -- user_id dell'utente test
  'COMPLETED',  -- Nota: enum PostgreSQL è case-sensitive, prova COMPLETED
  'test',  -- username
  NOW(),
  NOW()
);

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
  'Fogli ferramenta',
  'Pennelli, duplicato chiave',
  25.00,
  'Consumabili',
  '2025-09-01',
  6,  -- shift_id del Primo turno
  1,  -- user_id dell'utente test
  'COMPLETED',  -- Nota: enum PostgreSQL è case-sensitive, prova COMPLETED
  'test',  -- username
  NOW(),
  NOW()
);

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
  'Tecnomat',
  'Materiale per apertura stagione 2k26',
  1012.00,
  'Consumabili',
  '2025-09-01',
  6,  -- shift_id del Primo turno
  1,  -- user_id dell'utente test
  'COMPLETED',  -- Nota: enum PostgreSQL è case-sensitive, prova COMPLETED
  'test',  -- username
  NOW(),
  NOW()
);








-- Verifica che l'ordine sia stato inserito
SELECT * FROM orders WHERE title = 'Silla';
