const express = require('express');
const router = express.Router();
const catalogoVacunasController = require('../controllers/catalogo-vacunas.controller');
const { authMiddleware } = require('../middleware/auth.middleware');
const { rolesMiddleware } = require('../middleware/roles.middleware');
const { auditMiddleware } = require('../middleware/audit.middleware');

// GET /api/catalogo/vacunas - Listar vacunas del catálogo (cualquier rol autenticado)
router.get('/', authMiddleware, catalogoVacunasController.listar);

// GET /api/catalogo/vacunas/activas - Obtener solo activas (alias)
router.get('/activas', authMiddleware, (req, res) => {
  req.query.activas = 'true';
  catalogoVacunasController.listar(req, res);
});

// GET /api/catalogo/vacunas/:id - Obtener una vacuna del catálogo
router.get('/:id', authMiddleware, catalogoVacunasController.obtenerPorId);

// POST /api/catalogo/vacunas - Crear nueva vacuna (admin, veterinario)
router.post('/', authMiddleware, rolesMiddleware(['admin', 'veterinario']), auditMiddleware('CatalogoVacuna', 'crear'), catalogoVacunasController.crear);

// PUT /api/catalogo/vacunas/:id - Actualizar vacuna (admin, veterinario)
router.put('/:id', authMiddleware, rolesMiddleware(['admin', 'veterinario']), auditMiddleware('CatalogoVacuna', 'editar'), catalogoVacunasController.actualizar);

// DELETE /api/catalogo/vacunas/:id - Eliminar vacuna (admin, veterinario)
router.delete('/:id', authMiddleware, rolesMiddleware(['admin', 'veterinario']), auditMiddleware('CatalogoVacuna', 'eliminar'), catalogoVacunasController.eliminar);

module.exports = router;
