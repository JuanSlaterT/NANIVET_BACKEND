const express = require('express');
const router = express.Router();
const catalogoDesparasitacionController = require('../controllers/catalogo-desparasitacion.controller');
const { authMiddleware } = require('../middleware/auth.middleware');
const { rolesMiddleware } = require('../middleware/roles.middleware');
const { auditMiddleware } = require('../middleware/audit.middleware');

// GET /api/catalogo/desparasitacion - Listar productos de desparasitación (cualquier rol autenticado)
router.get('/', authMiddleware, catalogoDesparasitacionController.listar);

// GET /api/catalogo/desparasitacion/activos - Obtener solo activos (alias)
router.get('/activos', authMiddleware, (req, res) => {
  req.query.activas = 'true';
  catalogoDesparasitacionController.listar(req, res);
});

// GET /api/catalogo/desparasitacion/:id - Obtener un producto del catálogo
router.get('/:id', authMiddleware, catalogoDesparasitacionController.obtenerPorId);

// POST /api/catalogo/desparasitacion - Crear nuevo producto (admin, veterinario)
router.post('/', authMiddleware, rolesMiddleware(['admin', 'veterinario']), auditMiddleware('CatalogoDesparasitacion', 'crear'), catalogoDesparasitacionController.crear);

// PUT /api/catalogo/desparasitacion/:id - Actualizar producto (admin, veterinario)
router.put('/:id', authMiddleware, rolesMiddleware(['admin', 'veterinario']), auditMiddleware('CatalogoDesparasitacion', 'editar'), catalogoDesparasitacionController.actualizar);

// DELETE /api/catalogo/desparasitacion/:id - Eliminar producto (admin, veterinario)
router.delete('/:id', authMiddleware, rolesMiddleware(['admin', 'veterinario']), auditMiddleware('CatalogoDesparasitacion', 'eliminar'), catalogoDesparasitacionController.eliminar);

module.exports = router;
