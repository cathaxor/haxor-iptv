const mariadb = require('mariadb');
const config = require('./index');
const logger = require('../utils/logger');

const pool = mariadb.createPool({
  host: config.db.host,
  port: config.db.port,
  database: config.db.database,
  user: config.db.user,
  password: config.db.password,
  connectionLimit: config.db.connectionLimit,
  minimumIdle: config.db.minimumIdle,
  connectTimeout: config.db.connectTimeout,
  idleTimeout: config.db.idleTimeout,
  allowPublicKeyRetrieval: true,
  bigIntAsNumber: true,
});

pool.on('error', (err) => {
  logger.error('Database pool error:', err);
});

async function query(sql, params = []) {
  let conn;
  try {
    conn = await pool.getConnection();
    const rows = await conn.query(sql, params);
    return rows;
  } catch (err) {
    logger.error('Database query error:', { sql: sql.substring(0, 200), error: err.message });
    throw err;
  } finally {
    if (conn) conn.release();
  }
}

async function queryOne(sql, params = []) {
  const rows = await query(sql, params);
  return rows && rows.length > 0 ? rows[0] : null;
}

async function execute(sql, params = []) {
  let conn;
  try {
    conn = await pool.getConnection();
    const result = await conn.query(sql, params);
    return result;
  } catch (err) {
    logger.error('Database execute error:', { sql: sql.substring(0, 200), error: err.message });
    throw err;
  } finally {
    if (conn) conn.release();
  }
}

async function transaction(callback) {
  let conn;
  try {
    conn = await pool.getConnection();
    await conn.beginTransaction();
    const result = await callback(conn);
    await conn.commit();
    return result;
  } catch (err) {
    if (conn) await conn.rollback();
    logger.error('Transaction error:', err.message);
    throw err;
  } finally {
    if (conn) conn.release();
  }
}

async function testConnection() {
  try {
    const conn = await pool.getConnection();
    await conn.ping();
    conn.release();
    logger.info('Database connection established successfully');
    return true;
  } catch (err) {
    logger.error('Database connection failed:', err.message);
    return false;
  }
}

module.exports = {
  pool,
  query,
  queryOne,
  execute,
  transaction,
  testConnection,
};
