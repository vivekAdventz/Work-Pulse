/**
 * Creates a standard CRUD router for any Mongoose model.
 * Keeps route logic minimal — just delegates to Mongoose.
 */
export const getAll = (Model) => async (req, res) => {
  const items = await Model.find();
  res.json(items);
};

export const create = (Model) => async (req, res) => {
  const { id, ...data } = req.body;
  const item = await Model.create(data);
  res.status(201).json(item);
};

export const update = (Model) => async (req, res) => {
  const item = await Model.findById(req.params.id);
  if (!item) return res.status(404).json({ error: 'Item not found' });
  if (req.body.name) item.name = req.body.name;
  await item.save();
  res.json(item);
};

export const remove = (Model) => async (req, res) => {
  const item = await Model.findByIdAndDelete(req.params.id);
  if (!item) return res.status(404).json({ error: 'Item not found' });
  res.json({ message: 'Deleted successfully' });
};
