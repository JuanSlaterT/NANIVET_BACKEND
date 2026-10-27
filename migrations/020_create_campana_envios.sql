-- Migración 020: Tabla campana_envios
CREATE TABLE campana_envios (
  id VARCHAR(20) PRIMARY KEY,
  segmento VARCHAR(40) NOT NULL CHECK (segmento IN ('vacunas_vencidas', 'desparasitacion_pendiente', 'clientes_inactivos', 'cumpleanos_mascotas')),
  cliente_id VARCHAR(20) NOT NULL REFERENCES clientes(id),
  mascota_id VARCHAR(20) REFERENCES mascotas(id),
  motivo TEXT NOT NULL,
  fecha_enviado TIMESTAMP WITH TIME ZONE,
  enviado_por VARCHAR(120),
  fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_campana_segmento ON campana_envios(segmento);
CREATE INDEX idx_campana_cliente ON campana_envios(cliente_id);
