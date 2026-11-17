const express = require('express');
const ProductoRepository = require('../repositories/producto.repository');
const ProductoService = require('../services/producto.service');
const ProductoController = require('../controllers/producto.controller');
const pagination = require('../middleware/pagination');
const {
  validateIdParam,
  validateCreateProducto,
  validateReplaceProducto,
  validatePatchProducto,
} = require('../middleware/validateProducto');

const router = express.Router();

const repository = new ProductoRepository();
const service = new ProductoService(repository);
const controller = new ProductoController(service);

router.get('/', pagination, controller.list);
router.get('/:id', validateIdParam, controller.getById);
router.post('/', validateCreateProducto, controller.create);
router.put('/:id', validateIdParam, validateReplaceProducto, controller.replace);
router.patch('/:id', validateIdParam, validatePatchProducto, controller.patch);
router.delete('/:id', validateIdParam, controller.remove);

module.exports = router;
