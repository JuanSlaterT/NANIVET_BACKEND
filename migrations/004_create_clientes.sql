-- Migración 004: Tabla clientes
CREATE TABLE clientes (
  id VARCHAR(20) PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  apellido VARCHAR(100) NOT NULL,
  telefono VARCHAR(20) NOT NULL,
  cedula VARCHAR(20) UNIQUE NOT NULL,
  email VARCHAR(150),
  direccion TEXT,
  consentimiento_datos BOOLEAN NOT NULL DEFAULT false,
  consentimiento_fecha TIMESTAMP WITH TIME ZONE,
  consentimiento_version VARCHAR(10),
  consentimiento_comunicaciones BOOLEAN DEFAULT false,
  consentimiento_comunicaciones_fecha TIMESTAMP WITH TIME ZONE,
  fecha_revocacion TIMESTAMP WITH TIME ZONE,
  fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  fecha_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_clientes_cedula ON clientes(cedula);
CREATE INDEX idx_clientes_telefono ON clientes(telefono);
CREATE INDEX idx_clientes_consiento ON clientes(consentimiento_datos);
