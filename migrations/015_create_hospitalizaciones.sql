-- Migración 015: Tabla hospitalizaciones
CREATE TABLE hospitalizaciones (
  id VARCHAR(20) PRIMARY KEY,
  mascota_id VARCHAR(20) NOT NULL REFERENCES mascotas(id),
  caso_id VARCHAR(20) REFERENCES casos_clinicos(id),
  veterinario_id VARCHAR(20) NOT NULL REFERENCES veterinarios(id),
  cita_id VARCHAR(20) REFERENCES citas(id),
  fecha_ingreso TIMESTAMP WITH TIME ZONE NOT NULL,
  fecha_alta TIMESTAMP WITH TIME ZONE,
  jaula_area VARCHAR(20) NOT NULL,
  motivo TEXT NOT NULL,
  estado VARCHAR(20) NOT NULL DEFAULT 'hospitalizado' CHECK (estado IN ('hospitalizado', 'alta')),
  resumen_alta TEXT,
  indicaciones_alta TEXT,
  fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_hospitalizaciones_mascota ON hospitalizaciones(mascota_id);
CREATE INDEX idx_hospitalizaciones_estado ON hospitalizaciones(estado);
