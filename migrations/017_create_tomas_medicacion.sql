-- Migración 017: Tabla tomas_medicacion
CREATE TABLE tomas_medicacion (
  id VARCHAR(20) PRIMARY KEY,
  medicacion_id VARCHAR(20) NOT NULL REFERENCES medicaciones_hospitalizacion(id) ON DELETE CASCADE,
  fecha DATE NOT NULL,
  hora_programada VARCHAR(10) NOT NULL,
  administrada BOOLEAN NOT NULL DEFAULT false,
  hora_real VARCHAR(10),
  usuario_administro VARCHAR(120),
  fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_tomas_medicacion_medicacion ON tomas_medicacion(medicacion_id);
