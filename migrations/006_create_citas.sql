-- Migración 006: Tabla citas
CREATE TABLE citas (
  id VARCHAR(20) PRIMARY KEY,
  mascota_id VARCHAR(20) NOT NULL REFERENCES mascotas(id),
  veterinario_id VARCHAR(20) NOT NULL REFERENCES veterinarios(id),
  tipo_servicio VARCHAR(30) NOT NULL CHECK (tipo_servicio IN ('consulta', 'vacunacion', 'cirugia', 'desparasitacion', 'urgencia', 'estetica', 'control')),
  fecha_hora TIMESTAMP WITH TIME ZONE NOT NULL,
  estado VARCHAR(20) NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'confirmada', 'atendida', 'cancelada', 'no_asistio')),
  motivo TEXT,
  notas TEXT,
  token VARCHAR(50) UNIQUE NOT NULL,
  motivo_cancelacion TEXT,
  fecha_confirmacion TIMESTAMP WITH TIME ZONE,
  ultimo_cambio_por VARCHAR(50),
  confirmada_por_cliente BOOLEAN DEFAULT false,
  cancelada_por_cliente BOOLEAN DEFAULT false,
  peso_cita NUMERIC(5,2),
  fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  fecha_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_citas_mascota ON citas(mascota_id);
CREATE INDEX idx_citas_veterinario ON citas(veterinario_id);
CREATE INDEX idx_citas_fecha_hora ON citas(fecha_hora);
CREATE INDEX idx_citas_estado ON citas(estado);
CREATE INDEX idx_citas_token ON citas(token);
CREATE INDEX idx_citas_fecha_hora_estado ON citas(fecha_hora, estado);
