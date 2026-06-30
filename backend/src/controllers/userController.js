const bcrypt = require('bcryptjs');
const db = require('../config/database');
const logger = require('../utils/logger');

async function getUsers(req, res) {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
    const offset = (page - 1) * limit;
    const search = req.query.search || '';

    let where = '1=1';
    const params = [];

    if (search) {
      where += ' AND (username LIKE ? OR email LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    const countResult = await db.queryOne(`SELECT COUNT(*) as total FROM users WHERE ${where}`, params);
    const total = Number(countResult.total);

    const users = await db.query(
      `SELECT id, username, email, role, is_active, avatar, last_login, created_at
       FROM users WHERE ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    res.json({
      users,
      pagination: {
        page, limit, total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    logger.error('Get users error:', err.message);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
}

async function getUser(req, res) {
  try {
    const user = await db.queryOne(
      'SELECT id, username, email, role, is_active, avatar, last_login, created_at FROM users WHERE id = ?',
      [req.params.id]
    );
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    logger.error('Get user error:', err.message);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
}

async function createUser(req, res) {
  try {
    const { username, email, password, role } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email, and password are required' });
    }

    const existing = await db.queryOne(
      'SELECT id FROM users WHERE username = ? OR email = ?',
      [username, email]
    );
    if (existing) return res.status(409).json({ error: 'Username or email already exists' });

    const hashedPassword = await bcrypt.hash(password, 12);
    const result = await db.execute(
      'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)',
      [username, email, hashedPassword, role || 'user']
    );

    await db.execute(
      'INSERT INTO activity_logs (user_id, action, entity_type, entity_id, ip_address) VALUES (?, ?, ?, ?, ?)',
      [req.user.id, 'create_user', 'user', Number(result.insertId), req.ip]
    );

    res.status(201).json({
      id: Number(result.insertId),
      username, email, role: role || 'user',
    });
  } catch (err) {
    logger.error('Create user error:', err.message);
    res.status(500).json({ error: 'Failed to create user' });
  }
}

async function updateUser(req, res) {
  try {
    const { username, email, password, role, is_active } = req.body;
    const updates = [];
    const params = [];

    if (username) { updates.push('username = ?'); params.push(username); }
    if (email) { updates.push('email = ?'); params.push(email); }
    if (role) { updates.push('role = ?'); params.push(role); }
    if (typeof is_active !== 'undefined') { updates.push('is_active = ?'); params.push(is_active ? 1 : 0); }
    if (password) {
      updates.push('password = ?');
      params.push(await bcrypt.hash(password, 12));
    }

    if (updates.length === 0) return res.status(400).json({ error: 'No updates provided' });

    params.push(req.params.id);
    await db.execute(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, params);

    res.json({ message: 'User updated successfully' });
  } catch (err) {
    logger.error('Update user error:', err.message);
    res.status(500).json({ error: 'Failed to update user' });
  }
}

async function deleteUser(req, res) {
  try {
    if (parseInt(req.params.id, 10) === req.user.id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    await db.execute('DELETE FROM users WHERE id = ?', [req.params.id]);

    await db.execute(
      'INSERT INTO activity_logs (user_id, action, entity_type, entity_id, ip_address) VALUES (?, ?, ?, ?, ?)',
      [req.user.id, 'delete_user', 'user', req.params.id, req.ip]
    );

    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    logger.error('Delete user error:', err.message);
    res.status(500).json({ error: 'Failed to delete user' });
  }
}

module.exports = { getUsers, getUser, createUser, updateUser, deleteUser };
