-- Migración 012: Tabla examenes_adjuntos
CREATE TABLE examenes_adjuntos (
  id VARCHAR(20) PRIMARY KEY,
  mascota_id VARCHAR(20) NOT NULL REFERENCES mascotas(id),
  caso_id VARCHAR(20) REFERENCES casos_clinicos(id),
  tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('radiografia', 'ecografia', 'laboratorio', 'otro')),
  titulo VARCHAR(200),
  descripcion TEXT,
  fecha DATE NOT NULL,
  archivo_url TEXT,
  veterinario_id VARCHAR(20) REFERENCES veterinarios(id),
  fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_examenes_mascota ON examenes_adjuntos(mascota_id);
CREATE INDEX idx_examenes_caso ON examenes_adjuntos(caso_id);
