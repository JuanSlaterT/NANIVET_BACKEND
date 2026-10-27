-- Migración 024: Tabla catálogo de vacunas
CREATE TABLE catalogo_vacunas (
  id VARCHAR(20) PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL UNIQUE,
  intervalo_dias INTEGER NOT NULL CHECK (intervalo_dias > 0),
  especie VARCHAR(20) NOT NULL DEFAULT 'all' CHECK (especie IN ('all', 'Perro', 'Gato', 'Conejo', 'Ave')),
  activa BOOLEAN DEFAULT true,
  fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  fecha_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_catalogo_vacunas_activa ON catalogo_vacunas(activa);
CREATE INDEX idx_catalogo_vacunas_especie ON catalogo_vacunas(especie);

-- Trigger para actualizar fecha_actualizacion automáticamente
CREATE OR REPLACE FUNCTION actualizar_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.fecha_actualizacion = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_catalogo_vacunas_actualizar
  BEFORE UPDATE ON catalogo_vacunas
  FOR EACH ROW EXECUTE FUNCTION actualizar_timestamp();
