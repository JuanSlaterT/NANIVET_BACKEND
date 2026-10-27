-- Migración: Crear tabla de puntuaciones de cita
-- Sistema de calificación pública /puntuar/[id]
-- Reemplaza el antiguo sistema de encuestas

CREATE TABLE puntuaciones (
  id VARCHAR(20) PRIMARY KEY,
  cita_id VARCHAR(20) NOT NULL REFERENCES citas(id),
  token VARCHAR(50) UNIQUE NOT NULL,
  mascota_id VARCHAR(20) NOT NULL REFERENCES mascotas(id),
  veterinario_id VARCHAR(20) NOT NULL REFERENCES veterinarios(id),
  calificacion INTEGER CHECK (calificacion >= 1 AND calificacion <= 5),
  recomienda BOOLEAN,
  comentario TEXT,
  respondida BOOLEAN DEFAULT false,
  fecha_respuesta TIMESTAMP WITH TIME ZONE,
  fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_puntuaciones_cita ON puntuaciones(cita_id);
CREATE INDEX idx_puntuaciones_token ON puntuaciones(token);
CREATE INDEX idx_puntuaciones_veterinario ON puntuaciones(veterinario_id);
CREATE INDEX idx_puntuaciones_respondida ON puntuaciones(respondida);
