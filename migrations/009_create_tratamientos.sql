-- Migración 009: Tabla tratamientos
CREATE TABLE tratamientos (
  id VARCHAR(20) PRIMARY KEY,
  mascota_id VARCHAR(20) NOT NULL REFERENCES mascotas(id),
  caso_id VARCHAR(20) REFERENCES casos_clinicos(id),
  nombre VARCHAR(150) NOT NULL,
  dosis VARCHAR(100) NOT NULL,
  duracion VARCHAR(100),
  fecha DATE NOT NULL,
  veterinario_id VARCHAR(20) NOT NULL REFERENCES veterinarios(id),
  fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_tratamientos_mascota ON tratamientos(mascota_id);
CREATE INDEX idx_tratamientos_caso ON tratamientos(caso_id);
