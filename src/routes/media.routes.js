const express = require('express');
const router = express.Router();
const mediaController = require('../controllers/media.controller');
const { authMiddleware } = require('../middleware/auth.middleware');
const { rolesMiddleware } = require('../middleware/roles.middleware');
const { auditMiddleware } = require('../middleware/audit.middleware');
const { singleImage } = require('../middleware/image-upload.middleware');

function attachPetAuditContext(req, res, next) {
  req.auditContext = { mascota_id: req.params.id };
  next();
}

router.post(
  '/mascotas/:id/perfil',
  authMiddleware,
  rolesMiddleware(['admin', 'veterinario', 'recepcionista']),
  singleImage,
  attachPetAuditContext,
  auditMiddleware('Mascota', 'editar'),
  mediaController.subirPerfilMascota,
);

router.post(
  '/mascotas/:id/radiografias',
  authMiddleware,
  rolesMiddleware(['admin', 'veterinario']),
  singleImage,
  attachPetAuditContext,
  auditMiddleware('Examen', 'crear'),
  mediaController.subirRadiografia,
);

module.exports = router;
