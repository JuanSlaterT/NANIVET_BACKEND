const { z } = require('zod');
const pool = require('../config/pool');
const { genUuid } = require('../utils/genUuid');
const { uploadImage, resolveStoredMediaUrl, deleteStoredMedia } = require('../services/storage.service');
const { errorEvent } = require('../services/security-events.service');
const { sanitizePetForRole } = require('../middleware/clinical-access.middleware');

const radiographSchema = z.object({
  fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha inválida'),
  descripcion: z.string().trim().min(1, 'La descripción es obligatoria').max(2000),
  titulo: z.string().trim().max(200).optional(),
  casoId: z.string().trim().max(128).optional(),
});

function validationError(res, issues, requestId) {
  return res.status(400).json({
    error: {
      code: 'VALIDATION_ERROR',
      message: 'La solicitud contiene datos inválidos',
      details: issues.map(issue => ({ field: issue.path.join('.') || 'imagen', message: issue.message })),
      requestId,
    },
  });
}

function requireImage(req, res) {
  if (req.file) return true;
  validationError(res, [{ path: ['imagen'], message: 'Selecciona una imagen' }], req.requestId);
  return false;
}

async function subirPerfilMascota(req, res) {
  let uploaded;
  try {
    if (!requireImage(req, res)) return;
    const current = await pool.query('SELECT id, foto_url FROM mascotas WHERE id = $1', [req.params.id]);
    if (current.rows.length === 0) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Mascota no encontrada' } });
    }

    uploaded = await uploadImage(req.file, 'mascotas/perfiles');
    const result = await pool.query(
      `UPDATE mascotas SET foto_url = $1, fecha_actualizacion = NOW()
       WHERE id = $2 RETURNING *`,
      [uploaded.storedValue, req.params.id],
    );
    req.entityId = req.params.id;

    // La foto anterior se elimina después de confirmar la actualización.
    await deleteStoredMedia(current.rows[0].foto_url).catch(error => {
      errorEvent(req, 'previous_pet_profile_delete_failed', error, { mascotaId: req.params.id });
    });

    const data = result.rows[0];
    data.foto_url = await resolveStoredMediaUrl(data.foto_url);
    return res.json({ data: sanitizePetForRole(data, req.user?.rol) });
  } catch (error) {
    if (uploaded) await deleteStoredMedia(uploaded.storedValue).catch(() => {});
    errorEvent(req, 'pet_profile_upload_failed', error, { mascotaId: req.params.id });
    return res.status(error.statusCode || 500).json({
      error: {
        code: error.code || 'STORAGE_ERROR',
        message: error.statusCode === 503 ? error.message : 'No fue posible guardar la foto de perfil',
      },
    });
  }
}

async function subirRadiografia(req, res) {
  let uploaded;
  try {
    if (!requireImage(req, res)) return;
    const parsed = radiographSchema.safeParse(req.body || {});
    if (!parsed.success) return validationError(res, parsed.error.issues, req.requestId);

    const pet = await pool.query('SELECT id FROM mascotas WHERE id = $1', [req.params.id]);
    if (pet.rows.length === 0) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Mascota no encontrada' } });
    }

    uploaded = await uploadImage(req.file, 'mascotas/radiografias');
    const id = genUuid();
    req.entityId = id;
    const { fecha, descripcion, titulo, casoId } = parsed.data;
    const result = await pool.query(
      `INSERT INTO examenes_adjuntos
       (id, mascota_id, caso_id, tipo, titulo, descripcion, fecha, archivo_url, veterinario_id, fecha_creacion)
       VALUES ($1, $2, $3, 'Radiografía', $4, $5, $6, $7, $8, NOW())
       RETURNING *`,
      [
        id,
        req.params.id,
        casoId || null,
        titulo || 'Radiografía',
        descripcion,
        fecha,
        uploaded.storedValue,
        req.user?.veterinario_id || null,
      ],
    );
    const data = result.rows[0];
    data.archivo_url = await resolveStoredMediaUrl(data.archivo_url);
    return res.status(201).json({ data });
  } catch (error) {
    if (uploaded) await deleteStoredMedia(uploaded.storedValue).catch(() => {});
    errorEvent(req, 'radiograph_upload_failed', error, { mascotaId: req.params.id });
    return res.status(error.statusCode || 500).json({
      error: {
        code: error.code || 'STORAGE_ERROR',
        message: error.statusCode === 503 ? error.message : 'No fue posible guardar la radiografía',
      },
    });
  }
}

module.exports = { subirPerfilMascota, subirRadiografia };
