const db = require('../config/database');
const cache = require('../utils/cache');
const logger = require('../utils/logger');

async function getCategories(req, res) {
  try {
    const cacheKey = 'categories:all';
    const cached = cache.get(cacheKey);
    if (cached) return res.json(cached);

    const categories = await db.query(
      `SELECT c.*, (SELECT COUNT(*) FROM channels ch WHERE ch.category_id = c.id AND ch.is_active = 1) as channel_count
       FROM categories c
       WHERE c.is_visible = 1
       ORDER BY c.sort_order ASC, c.name ASC`
    );

    cache.set(cacheKey, categories, 120);
    res.json(categories);
  } catch (err) {
    logger.error('Get categories error:', err.message);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
}

async function getAllCategories(req, res) {
  try {
    const categories = await db.query(
      'SELECT * FROM categories ORDER BY sort_order ASC, name ASC'
    );
    res.json(categories);
  } catch (err) {
    logger.error('Get all categories error:', err.message);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
}

async function createCategory(req, res) {
  try {
    const { name, icon, sort_order, is_visible } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required' });

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const existing = await db.queryOne('SELECT id FROM categories WHERE slug = ?', [slug]);
    if (existing) return res.status(409).json({ error: 'Category already exists' });

    const result = await db.execute(
      'INSERT INTO categories (name, slug, icon, sort_order, is_visible) VALUES (?, ?, ?, ?, ?)',
      [name, slug, icon || '📺', sort_order || 0, is_visible !== false ? 1 : 0]
    );

    cache.delByPattern('categories');

    res.status(201).json({
      id: Number(result.insertId),
      name, slug, icon: icon || '📺',
    });
  } catch (err) {
    logger.error('Create category error:', err.message);
    res.status(500).json({ error: 'Failed to create category' });
  }
}

async function updateCategory(req, res) {
  try {
    const { name, icon, sort_order, is_visible } = req.body;
    const updates = [];
    const params = [];

    if (name) {
      updates.push('name = ?', 'slug = ?');
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      params.push(name, slug);
    }
    if (icon !== undefined) { updates.push('icon = ?'); params.push(icon); }
    if (sort_order !== undefined) { updates.push('sort_order = ?'); params.push(sort_order); }
    if (typeof is_visible !== 'undefined') { updates.push('is_visible = ?'); params.push(is_visible ? 1 : 0); }

    if (updates.length === 0) return res.status(400).json({ error: 'No updates provided' });

    params.push(req.params.id);
    await db.execute(`UPDATE categories SET ${updates.join(', ')} WHERE id = ?`, params);
    cache.delByPattern('categories');

    res.json({ message: 'Category updated' });
  } catch (err) {
    logger.error('Update category error:', err.message);
    res.status(500).json({ error: 'Failed to update category' });
  }
}

async function deleteCategory(req, res) {
  try {
    await db.execute('UPDATE channels SET category_id = NULL WHERE category_id = ?', [req.params.id]);
    await db.execute('DELETE FROM categories WHERE id = ?', [req.params.id]);
    cache.delByPattern('categories');
    cache.delByPattern('channels');

    res.json({ message: 'Category deleted' });
  } catch (err) {
    logger.error('Delete category error:', err.message);
    res.status(500).json({ error: 'Failed to delete category' });
  }
}

module.exports = { getCategories, getAllCategories, createCategory, updateCategory, deleteCategory };
