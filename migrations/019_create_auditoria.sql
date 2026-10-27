-- Migración 019: Tabla auditoria
CREATE TABLE auditoria (
  id VARCHAR(20) PRIMARY KEY,
  usuario VARCHAR(120) NOT NULL,
  rol VARCHAR(20) NOT NULL,
  fecha_hora TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  accion VARCHAR(30) NOT NULL CHECK (accion IN ('crear', 'editar', 'eliminar', 'consultar', 'revocar', 'confirmar', 'cancelar', 'reprogramar', 'enviar_campaña', 'alta_hospitalizacion')),
  entidad VARCHAR(50) NOT NULL,
  entidad_id VARCHAR(20) NOT NULL,
  valores_anteriores JSONB,
  valores_nuevos JSONB,
  diff_campos JSONB,
  ip_address INET,
  user_agent TEXT
);

CREATE INDEX idx_auditoria_usuario ON auditoria(usuario);
CREATE INDEX idx_auditoria_entidad ON auditoria(entidad, entidad_id);
CREATE INDEX idx_auditoria_accion ON auditoria(accion);
CREATE INDEX idx_auditoria_fecha ON auditoria(fecha_hora);
