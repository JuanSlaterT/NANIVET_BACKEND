-- Migración 001: Tabla usuarios (Staff Management)
-- Usuarios del sistema con roles diferenciados
-- Staff Management: cada usuario es un miembro del staff
--
-- Roles: admin, veterinario, recepcionista
-- Los veterinarios tienen especialidad, los demás no
CREATE TABLE usuarios (
  id VARCHAR(20) PRIMARY KEY,
  nombre VARCHAR(120) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  rol VARCHAR(20) NOT NULL CHECK (rol IN ('admin', 'veterinario', 'recepcionista')),
  telefono VARCHAR(20),
  especialidad VARCHAR(100),
  activo BOOLEAN DEFAULT true,
  fecha_alta DATE,
  fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ultima_conexion TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_usuarios_email ON usuarios(email);
CREATE INDEX idx_usuarios_rol ON usuarios(rol);

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
