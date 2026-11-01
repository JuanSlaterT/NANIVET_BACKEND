ALTER TABLE clientes
  ALTER COLUMN cedula DROP NOT NULL;

-- PostgreSQL permite múltiples NULL en una restricción UNIQUE. Este índice
-- conserva la unicidad solo para cédulas realmente registradas.
ALTER TABLE clientes DROP CONSTRAINT IF EXISTS clientes_cedula_key;
DROP INDEX IF EXISTS clientes_cedula_key;
CREATE UNIQUE INDEX IF NOT EXISTS clientes_cedula_unique_not_null
  ON clientes (cedula)
  WHERE cedula IS NOT NULL;
