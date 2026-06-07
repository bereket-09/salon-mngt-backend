import { ServiceCategory, Service } from '../models/index.js';

// List categories. ?tree=1 returns super-categories with nested Children.
export async function listCategories(req, res) {
  try {
    const { tree, status } = req.query;
    const where = {};
    if (status) where.status = status;

    if (tree === '1' || tree === 'true') {
      const supers = await ServiceCategory.findAll({
        where: { ...where, parentId: null },
        include: [{ model: ServiceCategory, as: 'Children', required: false }],
        order: [['order', 'ASC'], ['name', 'ASC'], [{ model: ServiceCategory, as: 'Children' }, 'order', 'ASC']],
      });
      return res.json(supers);
    }

    const list = await ServiceCategory.findAll({
      where,
      include: [{ model: ServiceCategory, as: 'Parent', required: false }],
      order: [['parentId', 'ASC'], ['order', 'ASC'], ['name', 'ASC']],
    });
    res.json(list);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
}

export async function createCategory(req, res) {
  try {
    const { name, parentId = null, icon = null, color = null, order = 0, status = 'active' } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required' });

    // Enforce two-level depth: a parent must itself be a super-category.
    if (parentId) {
      const parent = await ServiceCategory.findByPk(parentId);
      if (!parent) return res.status(400).json({ error: 'Parent category not found' });
      if (parent.parentId) return res.status(400).json({ error: 'Categories support only two levels (super → sub)' });
    }

    const cat = await ServiceCategory.create({ name, parentId: parentId || null, icon, color, order, status });
    res.json(cat);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create category' });
  }
}

export async function updateCategory(req, res) {
  try {
    const { id } = req.params;
    const { name, parentId, icon, color, order, status } = req.body;
    const cat = await ServiceCategory.findByPk(id);
    if (!cat) return res.status(404).json({ error: 'Category not found' });

    if (parentId !== undefined) {
      if (parentId === Number(id)) return res.status(400).json({ error: 'A category cannot be its own parent' });
      if (parentId) {
        const parent = await ServiceCategory.findByPk(parentId);
        if (!parent) return res.status(400).json({ error: 'Parent category not found' });
        if (parent.parentId) return res.status(400).json({ error: 'Categories support only two levels (super → sub)' });
        // Prevent demoting a super-category that already has children.
        const childCount = await ServiceCategory.count({ where: { parentId: id } });
        if (childCount > 0) return res.status(400).json({ error: 'Cannot nest a category that already has sub-categories' });
      }
      cat.parentId = parentId || null;
    }
    if (name !== undefined) cat.name = name;
    if (icon !== undefined) cat.icon = icon;
    if (color !== undefined) cat.color = color;
    if (order !== undefined) cat.order = order;
    if (status !== undefined) cat.status = status;

    await cat.save();
    res.json(cat);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update category' });
  }
}

export async function deleteCategory(req, res) {
  try {
    const { id } = req.params;
    const cat = await ServiceCategory.findByPk(id);
    if (!cat) return res.status(404).json({ error: 'Category not found' });

    const childCount = await ServiceCategory.count({ where: { parentId: id } });
    if (childCount > 0) return res.status(400).json({ error: 'Remove or reassign sub-categories first' });

    // Services keep existing rows; their categoryId is set to null (onDelete SET NULL).
    await Service.update({ categoryId: null }, { where: { categoryId: id } });
    await cat.destroy();
    res.json({ message: 'Category deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete category' });
  }
}
