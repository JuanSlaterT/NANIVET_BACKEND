const express = require('express');
const router = express.Router();
const mediaController = require('../controllers/media.controller');
const { authMiddleware } = require('../middleware/auth.middleware');
const { rolesMiddleware } = require('../middleware/roles.middleware');
const { auditMiddleware } = require('../middleware/audit.middleware');
const { singleImage } = require('../middleware/image-upload.middleware');

router.post(
  '/mascotas/:id/perfil',
  authMiddleware,
  rolesMiddleware(['admin', 'veterinario', 'recepcionista']),
  singleImage,
  auditMiddleware('Mascota', 'foto_perfil'),
  mediaController.subirPerfilMascota,
);

router.post(
  '/mascotas/:id/radiografias',
  authMiddleware,
  rolesMiddleware(['admin', 'veterinario']),
  singleImage,
  auditMiddleware('Examen', 'crear_radiografia'),
  mediaController.subirRadiografia,
);

module.exports = router;
