const { createHttpError } = require('../utils/httpError');

const ALLOWED_FIELDS = ['nombre', 'categoria', 'precio_venta_publico'];

const isPlainObject = (v) => v && typeof v === 'object' && !Array.isArray(v);

const validateIdParam = (req, res, next) => {
  const { id } = req.params;
  if (!/^\d+$/.test(String(id)) || Number(id) < 1) {
    return next(createHttpError(400, 'VALIDATION_ERROR', 'El parámetro id debe ser un entero positivo'));
  }
  req.params.id = Number(id);
  next();
};

const validateNombre = (value, errors) => {
  if (typeof value !== 'string' || value.trim().length === 0) {
    errors.push('nombre es obligatorio y debe ser una cadena no vacía');
  } else if (value.length > 200) {
    errors.push('nombre no debe exceder 200 caracteres');
  }
};

const validateCategoria = (value, errors) => {
  if (typeof value !== 'string' || value.trim().length === 0) {
    errors.push('categoria es obligatoria y debe ser una cadena no vacía');
  } else if (value.length > 100) {
    errors.push('categoria no debe exceder 100 caracteres');
  }
};

const validatePrecio = (value, errors) => {
  if (value === undefined || value === null || value === '') {
    errors.push('precio_venta_publico es obligatorio');
    return;
  }
  const num = Number(value);
  if (!Number.isFinite(num)) {
    errors.push('precio_venta_publico debe ser un número válido');
    return;
  }
  if (num < 0) {
    errors.push('precio_venta_publico no puede ser negativo');
  }
  if (num > 99999999.99) {
    errors.push('precio_venta_publico excede el máximo permitido');
  }
  // validar máximo 2 decimales
  if (!/^\d+(\.\d{1,2})?$/.test(String(value))) {
    // permitir números ya parseados razonables; si vino como string con muchas decimales, rechazar
    const s = String(value);
    if (s.includes('.') && s.split('.')[1].length > 2) {
      errors.push('precio_venta_publico debe tener como máximo 2 decimales');
    }
  }
};

const checkUnexpectedFields = (body, errors) => {
  for (const key of Object.keys(body)) {
    if (!ALLOWED_FIELDS.includes(key)) {
      errors.push(`Campo no permitido: ${key}`);
    }
  }
};

const normalizePrecio = (body) => {
  if (Object.prototype.hasOwnProperty.call(body, 'precio_venta_publico')) {
    body.precio_venta_publico = Number(body.precio_venta_publico);
  }
};

const validateCreateProducto = (req, res, next) => {
  if (!isPlainObject(req.body)) {
    return next(createHttpError(400, 'VALIDATION_ERROR', 'El cuerpo debe ser un objeto JSON'));
  }
  const errors = [];
  checkUnexpectedFields(req.body, errors);
  validateNombre(req.body.nombre, errors);
  validateCategoria(req.body.categoria, errors);
  validatePrecio(req.body.precio_venta_publico, errors);
  if (errors.length) {
    return next(createHttpError(422, 'VALIDATION_ERROR', 'Los datos enviados no son válidos', errors));
  }
  normalizePrecio(req.body);
  next();
};

const validateReplaceProducto = (req, res, next) => {
  if (!isPlainObject(req.body)) {
    return next(createHttpError(400, 'VALIDATION_ERROR', 'El cuerpo debe ser un objeto JSON'));
  }
  const errors = [];
  checkUnexpectedFields(req.body, errors);
  // PUT: reemplazo completo, todos obligatorios
  if (req.body.nombre === undefined) errors.push('nombre es obligatorio');
  if (req.body.categoria === undefined) errors.push('categoria es obligatoria');
  if (req.body.precio_venta_publico === undefined) errors.push('precio_venta_publico es obligatorio');
  if (req.body.nombre !== undefined) validateNombre(req.body.nombre, errors);
  if (req.body.categoria !== undefined) validateCategoria(req.body.categoria, errors);
  if (req.body.precio_venta_publico !== undefined) validatePrecio(req.body.precio_venta_publico, errors);
  if (errors.length) {
    return next(createHttpError(422, 'VALIDATION_ERROR', 'Los datos enviados no son válidos', errors));
  }
  normalizePrecio(req.body);
  next();
};

const validatePatchProducto = (req, res, next) => {
  if (!isPlainObject(req.body)) {
    return next(createHttpError(400, 'VALIDATION_ERROR', 'El cuerpo debe ser un objeto JSON'));
  }
  const errors = [];
  checkUnexpectedFields(req.body, errors);
  const hasAny = ALLOWED_FIELDS.some((f) => Object.prototype.hasOwnProperty.call(req.body, f));
  if (!hasAny) {
    errors.push('Debe enviar al menos un campo válido para actualizar');
  }
  if (Object.prototype.hasOwnProperty.call(req.body, 'nombre')) validateNombre(req.body.nombre, errors);
  if (Object.prototype.hasOwnProperty.call(req.body, 'categoria')) validateCategoria(req.body.categoria, errors);
  if (Object.prototype.hasOwnProperty.call(req.body, 'precio_venta_publico')) validatePrecio(req.body.precio_venta_publico, errors);
  if (errors.length) {
    return next(createHttpError(422, 'VALIDATION_ERROR', 'Los datos enviados no son válidos', errors));
  }
  normalizePrecio(req.body);
  next();
};

module.exports = {
  validateIdParam,
  validateCreateProducto,
  validateReplaceProducto,
  validatePatchProducto,
};
