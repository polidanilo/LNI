-- Query per verificare i valori enum corretti nel database PostgreSQL

-- 1. Verifica i valori dell'enum OrderStatus
SELECT 
    t.typname AS enum_name,
    e.enumlabel AS enum_value
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid  
WHERE t.typname = 'orderstatus'
ORDER BY e.enumsortorder;

-- Output atteso:
-- enum_name   | enum_value
-- ------------+------------
-- orderstatus | pending
-- orderstatus | completed
-- (oppure PENDING, COMPLETED se maiuscolo)

-- 2. Se vuoi vedere tutti gli enum del database:
SELECT 
    t.typname AS enum_name,
    e.enumlabel AS enum_value
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid  
ORDER BY t.typname, e.enumsortorder;
