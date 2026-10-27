-- Migración 010: Tabla desparasitaciones
CREATE TABLE desparasitaciones (
  id VARCHAR(20) PRIMARY KEY,
  mascota_id VARCHAR(20) NOT NULL REFERENCES mascotas(id),
  caso_id VARCHAR(20) REFERENCES casos_clinicos(id),
  producto VARCHAR(150) NOT NULL,
  dosis VARCHAR(100) NOT NULL,
  fecha DATE NOT NULL,
  proxima_dosis DATE,
  veterinario_id VARCHAR(20) NOT NULL REFERENCES veterinarios(id),
  fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_desparasitaciones_mascota ON desparasitaciones(mascota_id);
CREATE INDEX idx_desparasitaciones_caso ON desparasitaciones(caso_id);
CREATE INDEX idx_desparasitaciones_proxima ON desparasitaciones(proxima_dosis);
