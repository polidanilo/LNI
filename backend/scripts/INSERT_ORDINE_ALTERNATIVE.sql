-- VERSIONI ALTERNATIVE per inserire l'ordine "Silla"
-- Prova queste versioni in ordine finché una funziona

-- ============================================
-- VERSIONE 1: Minuscolo (più comune)
-- ============================================
INSERT INTO orders (
  title, description, amount, category, order_date, 
  shift_id, user_id, status, created_by, created_at, updated_at
) VALUES (
  'Silla', 'Calce', 15.00, 'Altro', '2025-09-06',
  1, 1, 'completed', 'test', NOW(), NOW()
);

-- ============================================
-- VERSIONE 2: Maiuscolo
-- ============================================
INSERT INTO orders (
  title, description, amount, category, order_date, 
  shift_id, user_id, status, created_by, created_at, updated_at
) VALUES (
  'Silla', 'Calce', 15.00, 'Altro', '2025-09-06',
  1, 1, 'COMPLETED', 'test', NOW(), NOW()
);

-- ============================================
-- VERSIONE 3: Pending invece di completed
-- ============================================
INSERT INTO orders (
  title, description, amount, category, order_date, 
  shift_id, user_id, status, created_by, created_at, updated_at
) VALUES (
  'Silla', 'Calce', 15.00, 'Altro', '2025-09-06',
  1, 1, 'pending', 'test', NOW(), NOW()
);

-- ============================================
-- VERSIONE 4: PENDING maiuscolo
-- ============================================
INSERT INTO orders (
  title, description, amount, category, order_date, 
  shift_id, user_id, status, created_by, created_at, updated_at
) VALUES (
  'Silla', 'Calce', 15.00, 'Altro', '2025-09-06',
  1, 1, 'PENDING', 'test', NOW(), NOW()
);

-- ============================================
-- VERIFICA: Controlla quale valore è stato inserito
-- ============================================
SELECT * FROM orders WHERE title = 'Silla';

-- ============================================
-- PULIZIA: Se hai inserito ordini di prova sbagliati
-- ============================================
-- DELETE FROM orders WHERE title = 'Silla';
