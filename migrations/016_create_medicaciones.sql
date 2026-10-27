-- Migración 016: Tabla medicaciones_hospitalizacion
CREATE TABLE medicaciones_hospitalizacion (
  id VARCHAR(20) PRIMARY KEY,
  hospitalizacion_id VARCHAR(20) NOT NULL REFERENCES hospitalizaciones(id) ON DELETE CASCADE,
  medicamento VARCHAR(150) NOT NULL,
  dosis VARCHAR(100) NOT NULL,
  via VARCHAR(50) NOT NULL,
  frecuencia VARCHAR(100) NOT NULL,
  horas_programadas JSONB NOT NULL,
  fecha_inicio DATE NOT NULL,
  fecha_fin DATE,
  fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_medicaciones_hospitalizacion ON medicaciones_hospitalizacion(hospitalizacion_id);
