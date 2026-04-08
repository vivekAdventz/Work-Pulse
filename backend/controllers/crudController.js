/**
 * Creates a standard CRUD router for any Mongoose model.
 * Keeps route logic minimal — just delegates to Mongoose.
 */
export const getAll = (Model, filterFn) => async (req, res) => {
  const query = filterFn ? await filterFn(req) : {};
  const items = await Model.find(query);
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
  
  Object.keys(req.body).forEach(key => {
    if (key !== 'id' && key !== '_id' && key !== '__v' && req.body[key] !== undefined) {
      item[key] = req.body[key];
    }
  });

  await item.save();
  res.json(item);
};

export const remove = (Model) => async (req, res) => {
  const item = await Model.findByIdAndDelete(req.params.id);
  if (!item) return res.status(404).json({ error: 'Item not found' });
  res.json({ message: 'Deleted successfully' });
};
