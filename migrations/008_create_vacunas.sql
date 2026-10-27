-- Migración 008: Tabla vacunas
CREATE TABLE vacunas (
  id VARCHAR(20) PRIMARY KEY,
  mascota_id VARCHAR(20) NOT NULL REFERENCES mascotas(id),
  caso_id VARCHAR(20) REFERENCES casos_clinicos(id),
  nombre VARCHAR(100) NOT NULL,
  lote VARCHAR(50) NOT NULL,
  fecha_aplicacion DATE NOT NULL,
  proxima_dosis DATE,
  veterinario_id VARCHAR(20) NOT NULL REFERENCES veterinarios(id),
  fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_vacunas_mascota ON vacunas(mascota_id);
CREATE INDEX idx_vacunas_caso ON vacunas(caso_id);
CREATE INDEX idx_vacunas_proxima ON vacunas(proxima_dosis);
