-- Migración 026: Actualizar tabla usuarios para Staff Management
-- Agregar campos de teléfono, especialidad y fecha_alta
-- Eliminar veterinario_id (ya no se necesita la relación)

-- Agregar nuevas columnas
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS telefono VARCHAR(20);
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS especialidad VARCHAR(100);
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS fecha_alta DATE;

-- Eliminar columna veterinario_id (se maneja ahora en el mismo usuario)
ALTER TABLE usuarios DROP COLUMN IF EXISTS veterinario_id;

-- Actualizar índices
DROP INDEX IF EXISTS idx_usuarios_rol;
CREATE INDEX idx_usuarios_rol ON usuarios(rol);

-- Actualizar fecha_creacion como created_at para consistencia
-- (fecha_creacion ya existe, solo agregamos updated_at)
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION trg_usuarios_actualizar()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_usuarios_actualizar ON usuarios;
CREATE TRIGGER trg_usuarios_actualizar
  BEFORE UPDATE ON usuarios
  FOR EACH ROW
  EXECUTE FUNCTION trg_usuarios_actualizar();
