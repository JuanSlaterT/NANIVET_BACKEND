-- Migración 011: Tabla cirugias
CREATE TABLE cirugias (
  id VARCHAR(20) PRIMARY KEY,
  mascota_id VARCHAR(20) NOT NULL REFERENCES mascotas(id),
  caso_id VARCHAR(20) REFERENCES casos_clinicos(id),
  tipo VARCHAR(150) NOT NULL,
  fecha DATE NOT NULL,
  veterinario_id VARCHAR(20) NOT NULL REFERENCES veterinarios(id),
  anestesia TEXT,
  notas TEXT,
  prognosis VARCHAR(100),
  fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_cirugias_mascota ON cirugias(mascota_id);
CREATE INDEX idx_cirugias_caso ON cirugias(caso_id);
