const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

class ProductoController {
  constructor(service) {
    this.service = service;
  }

  list = asyncHandler(async (req, res) => {
    const { page, limit } = req.pagination;
    const baseUrl = `${req.protocol}://${req.get('host')}${req.baseUrl || req.path}`;
    const result = await this.service.list({ page, limit, baseUrl });
    res.status(200).json({
      success: true,
      data: result.data,
      pagination: result.pagination,
    });
  });

  getById = asyncHandler(async (req, res) => {
    const producto = await this.service.getById(req.params.id);
    res.status(200).json({ success: true, data: producto });
  });

  create = asyncHandler(async (req, res) => {
    const producto = await this.service.create(req.body);
    res.status(201).json({ success: true, data: producto });
  });

  replace = asyncHandler(async (req, res) => {
    const producto = await this.service.replace(req.params.id, req.body);
    res.status(200).json({ success: true, data: producto });
  });

  patch = asyncHandler(async (req, res) => {
    const producto = await this.service.updatePartial(req.params.id, req.body);
    res.status(200).json({ success: true, data: producto });
  });

  remove = asyncHandler(async (req, res) => {
    await this.service.remove(req.params.id);
    res.status(204).send();
  });
}

module.exports = ProductoController;
