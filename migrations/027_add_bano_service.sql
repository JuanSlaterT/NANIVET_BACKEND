ALTER TABLE citas
  DROP CONSTRAINT IF EXISTS citas_tipo_servicio_check;

ALTER TABLE citas
  ADD CONSTRAINT citas_tipo_servicio_check
  CHECK (tipo_servicio IN (
    'consulta',
    'vacunacion',
    'cirugia',
    'desparasitacion',
    'urgencia',
    'estetica',
    'bano',
    'control'
  ));
