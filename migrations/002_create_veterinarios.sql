-- Migración 002: Tabla veterinarios (Catálogo de horarios)
-- Los veterinarios son un catálogo de horarios, NO de staff
-- El staff está en la tabla usuarios
-- user_id vincula con usuarios.id (staff)
CREATE TABLE veterinarios (
  id VARCHAR(20) PRIMARY KEY,
  user_id VARCHAR(20) REFERENCES usuarios(id),
  nombre VARCHAR(120) NOT NULL,
  especialidad VARCHAR(100),
  telefono VARCHAR(20),
  horario_inicio TIME NOT NULL DEFAULT '08:00',
  horario_fin TIME NOT NULL DEFAULT '17:00',
  dias_semana INTEGER[] NOT NULL DEFAULT '{1,2,3,4,5,6}',
  intervalo_minutos INTEGER NOT NULL DEFAULT 30,
  activo BOOLEAN DEFAULT true
);

CREATE INDEX idx_veterinarios_activo ON veterinarios(activo);
CREATE INDEX idx_veterinarios_user_id ON veterinarios(user_id);
