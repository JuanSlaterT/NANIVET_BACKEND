-- Migración 003: Tabla horarios_bloqueados
CREATE TABLE horarios_bloqueados (
  id VARCHAR(20) PRIMARY KEY,
  veterinario_id VARCHAR(20) NOT NULL REFERENCES veterinarios(id),
  fecha DATE NOT NULL,
  motivo TEXT,
  fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_horarios_bloqueados_vet_fecha ON horarios_bloqueados(veterinario_id, fecha);
