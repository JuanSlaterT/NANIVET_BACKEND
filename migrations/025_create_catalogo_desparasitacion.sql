-- Migración 025: Tabla catálogo de desparasitación
CREATE TABLE catalogo_desparasitacion (
  id VARCHAR(20) PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL UNIQUE,
  intervalo_meses INTEGER NOT NULL CHECK (intervalo_meses > 0),
  via VARCHAR(20) NOT NULL CHECK (via IN ('Oral', 'Subcutánea', 'Tópica', 'Inyectable')),
  activa BOOLEAN DEFAULT true,
  fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  fecha_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_catalogo_desparasitacion_activa ON catalogo_desparasitacion(activa);

CREATE TRIGGER trg_catalogo_desparasitacion_actualizar
  BEFORE UPDATE ON catalogo_desparasitacion
  FOR EACH ROW EXECUTE FUNCTION actualizar_timestamp();
