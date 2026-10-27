-- Migración 022: Tabla plantillas
CREATE TABLE plantillas (
  id VARCHAR(20) PRIMARY KEY,
  nombre VARCHAR(200) NOT NULL,
  tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('diagnostico', 'tratamiento')),
  contenido TEXT NOT NULL,
  categoria VARCHAR(100),
  activo BOOLEAN DEFAULT true,
  uso_count INTEGER DEFAULT 0,
  creado_por VARCHAR(120),
  fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  fecha_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_plantillas_tipo ON plantillas(tipo);
CREATE INDEX idx_plantillas_categoria ON plantillas(categoria);
