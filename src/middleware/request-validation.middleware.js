const { z } = require('zod');

const shortText = z.string().trim().min(1).max(500);
const optionalText = z.string().trim().max(5000).nullable().optional();
const id = z.string().trim().min(1).max(128);
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}(?:T.*)?$/, 'Fecha inválida');
const email = z.string().trim().email().max(254);
const pathBoundary = z.array(z.string().min(1).max(256)).max(16);
const queryBoundary = z.record(z.union([
  z.string().max(2000),
  z.array(z.string().max(2000)).max(20),
]));

const objectBody = z.record(z.string(), z.unknown()).superRefine((value, ctx) => {
  const serialized = JSON.stringify(value);
  if (serialized.length > 1_000_000) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'El contenido supera el tamaño permitido' });
  }
  if (serialized.includes('__proto__') || serialized.includes('constructor')) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'El contenido contiene propiedades no permitidas' });
  }
});

const schemas = [
  ['POST', /^\/auth\/login$/, z.object({ email, password: z.string().min(8).max(200) })],
  ['POST', /^\/clientes$/, z.object({
    nombre: shortText, apellido: shortText, telefono: shortText,
    cedula: z.string().trim().max(20).nullable().optional(),
    email: email.nullable().optional(), direccion: optionalText,
    consentimiento_datos: z.union([z.boolean(), z.record(z.string(), z.unknown())]),
    consentimiento_comunicaciones: z.union([z.boolean(), z.record(z.string(), z.unknown())]).optional(),
  }).passthrough()],
  ['PUT', /^\/clientes\/[\w-]+$/, z.object({
    nombre: shortText.optional(), apellido: shortText.optional(), telefono: shortText.optional(),
    cedula: z.string().trim().max(20).nullable().optional(), email: email.nullable().optional(), direccion: optionalText,
  }).passthrough().refine(value => Object.keys(value).length > 0, 'No hay campos para actualizar')],
  ['POST', /^\/mascotas$/, z.object({ cliente_id: id, nombre: shortText, especie: shortText, sexo: shortText }).passthrough()],
  ['PUT', /^\/mascotas\/[\w-]+$/, z.object({}).passthrough().refine(value => Object.keys(value).length > 0, 'No hay campos para actualizar')],
  ['POST', /^\/citas$/, z.object({ mascota_id: id, veterinario_id: id, fecha_hora: date }).passthrough()],
  ['PUT', /^\/citas\/[\w-]+$/, z.object({}).passthrough().refine(value => Object.keys(value).length > 0, 'No hay campos para actualizar')],
  ['POST', /^\/citas\/token\/[\w-]+\/cancelar$/, z.object({ motivo: shortText })],
  ['POST', /^\/citas\/token\/[\w-]+\/reprogramar$/, z.object({ nueva_fecha_hora: date }).or(z.object({ nuevaFechaHora: date }))],
  ['POST', /^\/casos$/, z.object({ mascota_id: id, motivo: shortText }).passthrough()],
  ['PUT', /^\/casos\/[\w-]+$/, z.object({}).passthrough().refine(value => Object.keys(value).length > 0, 'No hay campos para actualizar')],
  ['POST', /^\/(vacunas|tratamientos|desparasitaciones|cirugias|examenes)$/, z.object({ mascota_id: id }).passthrough()],
  ['PUT', /^\/(vacunas|tratamientos|desparasitaciones)\/[\w-]+$/, z.object({}).passthrough().refine(value => Object.keys(value).length > 0, 'No hay campos para actualizar')],
  ['POST', /^\/mascotas\/[\w-]+\/pesos$/, z.object({ peso: z.number().positive().max(500), fecha: date })],
  ['POST', /^\/hospitalizaciones$/, z.object({ mascota_id: id, veterinario_id: id, motivo: shortText }).passthrough()],
  ['PUT', /^\/hospitalizaciones\/[\w-]+(?:\/alta)?$/, z.object({}).passthrough().refine(value => Object.keys(value).length > 0, 'No hay campos para actualizar')],
  ['POST', /^\/hospitalizaciones\/[\w-]+\/(medicaciones|evoluciones)$/, z.object({}).passthrough().refine(value => Object.keys(value).length > 0, 'Faltan datos requeridos')],
  ['POST', /^\/campanas\/enviar$/, z.object({ segmento: shortText }).passthrough()],
  ['POST', /^\/plantillas$/, z.object({ nombre: shortText, contenido: shortText }).passthrough()],
  ['PUT', /^\/plantillas\/[\w-]+$/, z.object({}).passthrough().refine(value => Object.keys(value).length > 0, 'No hay campos para actualizar')],
  ['POST', /^\/ia\/resumir-historia$/, z.object({ mascotaId: id }).or(z.object({ mascota_id: id }))],
  ['POST', /^\/ia\/notas-a-soap$/, z.object({ mascotaId: id, notasLibres: shortText }).or(z.object({ mascota_id: id, notas_libres: shortText }))],
  ['POST', /^\/ia\/(redactar-mensaje|diferenciales)$/, z.object({}).passthrough().refine(value => Object.keys(value).length > 0, 'Faltan datos requeridos')],
  ['POST', /^\/puntuaciones\/token\/[\w-]+\/responder$/, z.object({ calificacion: z.number().int().min(1).max(5), recomienda: z.boolean() }).passthrough()],
  ['POST', /^\/catalogo\/(vacunas|desparasitacion)$/, z.object({ nombre: shortText }).passthrough()],
  ['PUT', /^\/catalogo\/(vacunas|desparasitacion)\/[\w-]+$/, z.object({}).passthrough().refine(value => Object.keys(value).length > 0, 'No hay campos para actualizar')],
  ['POST', /^\/staff$/, z.object({ nombre: shortText, email, password: z.string().min(8).max(200), rol: z.enum(['admin', 'veterinario', 'recepcionista']), telefono: shortText }).passthrough()],
  ['PUT', /^\/staff\/[\w-]+$/, z.object({}).passthrough().refine(value => Object.keys(value).length > 0, 'No hay campos para actualizar')],
  ['POST', /^\/veterinarios\/[\w-]+\/bloqueos$/, z.object({ fecha: date, motivo: shortText })],
];

function validationError(res, error, requestId) {
  return res.status(400).json({
    error: {
      code: 'VALIDATION_ERROR',
      message: 'La solicitud contiene datos inválidos',
      details: error.issues.map(issue => ({
        field: issue.path.join('.') || 'body',
        message: issue.message,
      })),
      requestId,
    },
  });
}

function validateApiRequest(req, res, next) {
  const path = req.originalUrl.split('?')[0].replace(/^\/api/, '') || '/';
  const pathResult = pathBoundary.safeParse(path.split('/').filter(Boolean));
  if (!pathResult.success) return validationError(res, pathResult.error, req.requestId);

  const queryResult = queryBoundary.safeParse(req.query || {});
  if (!queryResult.success) return validationError(res, queryResult.error, req.requestId);

  const boundary = objectBody.safeParse(req.body || {});
  if (!boundary.success) return validationError(res, boundary.error, req.requestId);

  const match = schemas.find(([method, pattern]) => method === req.method && pattern.test(path));
  if (match) {
    const result = match[2].safeParse(req.body || {});
    if (!result.success) return validationError(res, result.error, req.requestId);
    req.body = result.data;
  }

  next();
}

module.exports = { validateApiRequest };
