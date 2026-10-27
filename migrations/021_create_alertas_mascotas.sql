-- Migración 021: Tabla alertas_mascotas
CREATE TABLE alertas_mascotas (
  id VARCHAR(20) PRIMARY KEY,
  mascota_id VARCHAR(20) NOT NULL REFERENCES mascotas(id) ON DELETE CASCADE,
  tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('alergia', 'agresivo', 'enfermedad_cronica', 'medicacion_activa', 'otra')),
  descripcion TEXT NOT NULL,
  activa BOOLEAN DEFAULT true,
  creado_por VARCHAR(120),
  fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_alertas_mascota ON alertas_mascotas(mascota_id);
CREATE INDEX idx_alertas_activa ON alertas_mascotas(activa);
