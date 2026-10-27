-- Migración 027: Actualizar tabla veterinarios para Staff Management
-- Agregar user_id para vincular con el usuario de staff
-- La tabla veterinarios ahora es un catálogo de horarios, no de staff

-- Agregar columna user_id
ALTER TABLE veterinarios ADD COLUMN IF NOT EXISTS user_id VARCHAR(20) REFERENCES usuarios(id);

-- Actualizar índice
DROP INDEX IF EXISTS idx_veterinarios_activo;
CREATE INDEX idx_veterinarios_activo ON veterinarios(activo);
CREATE INDEX IF NOT EXISTS idx_veterinarios_user_id ON veterinarios(user_id);

-- Actualizar seed data para veterinarios
-- Ahora los veterinarios deben tener un user_id que referencia a usuarios
