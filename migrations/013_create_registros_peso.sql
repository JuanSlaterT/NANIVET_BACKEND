-- Migración 013: Tabla registros_peso
CREATE TABLE registros_peso (
  id VARCHAR(20) PRIMARY KEY,
  mascota_id VARCHAR(20) NOT NULL REFERENCES mascotas(id),
  peso_kg NUMERIC(5,2) NOT NULL,
  fecha DATE NOT NULL,
  fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_registros_peso_mascota ON registros_peso(mascota_id);
