-- Migración 018: Tabla evoluciones_hospitalizacion
CREATE TABLE evoluciones_hospitalizacion (
  id VARCHAR(20) PRIMARY KEY,
  hospitalizacion_id VARCHAR(20) NOT NULL REFERENCES hospitalizaciones(id) ON DELETE CASCADE,
  fecha DATE NOT NULL,
  signos_vitales TEXT,
  estado_general TEXT,
  observaciones TEXT,
  veterinario_id VARCHAR(20) NOT NULL REFERENCES veterinarios(id),
  fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_evoluciones_hospitalizacion ON evoluciones_hospitalizacion(hospitalizacion_id);
