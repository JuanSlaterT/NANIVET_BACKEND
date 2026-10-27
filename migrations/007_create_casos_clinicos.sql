-- Migración 007: Tabla casos_clinicos
CREATE TABLE casos_clinicos (
  id VARCHAR(20) PRIMARY KEY,
  mascota_id VARCHAR(20) NOT NULL REFERENCES mascotas(id),
  motivo TEXT NOT NULL,
  soap_subjetivo TEXT,
  soap_objetivo TEXT,
  soap_analisis TEXT,
  soap_plan TEXT,
  diagnostico TEXT,
  estado VARCHAR(20) NOT NULL DEFAULT 'abierto' CHECK (estado IN ('abierto', 'seguimiento', 'cerrado')),
  fecha_hora_inicio TIMESTAMP WITH TIME ZONE NOT NULL,
  veterinario_id VARCHAR(20) NOT NULL REFERENCES veterinarios(id),
  fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  fecha_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_casos_mascota ON casos_clinicos(mascota_id);
CREATE INDEX idx_casos_estado ON casos_clinicos(estado);
CREATE INDEX idx_casos_veterinario ON casos_clinicos(veterinario_id);
CREATE INDEX idx_casos_fecha ON casos_clinicos(fecha_hora_inicio);
