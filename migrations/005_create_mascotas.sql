-- Migración 005: Tabla mascotas
CREATE TABLE mascotas (
  id VARCHAR(20) PRIMARY KEY,
  cliente_id VARCHAR(20) NOT NULL REFERENCES clientes(id) ON DELETE RESTRICT,
  nombre VARCHAR(80) NOT NULL,
  especie VARCHAR(20) NOT NULL CHECK (especie IN ('Perro', 'Gato', 'Conejo', 'Ave', 'Otro')),
  sexo VARCHAR(10) NOT NULL CHECK (sexo IN ('Macho', 'Hembra')),
  fecha_nacimiento DATE,
  raza VARCHAR(100),
  color VARCHAR(50),
  foto_url TEXT,
  esterilizado BOOLEAN DEFAULT false,
  microchip VARCHAR(50),
  alergias TEXT,
  notas TEXT,
  fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  fecha_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_mascotas_cliente ON mascotas(cliente_id);
CREATE INDEX idx_mascotas_especie ON mascotas(especie);
CREATE INDEX idx_mascotas_nombre ON mascotas(nombre);
