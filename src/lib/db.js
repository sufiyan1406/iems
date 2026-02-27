import pg from 'pg';

const { Pool } = pg;

let pool = null;

/**
 * Database abstraction layer for PostgreSQL
 * Provides the same API as better-sqlite3 so all route files work unchanged:
 *   db.prepare(sql).get(...params) → first row
 *   db.prepare(sql).all(...params) → all rows
 *   db.prepare(sql).run(...params) → { changes, lastInsertRowid }
 */

function getPool() {
  if (pool) return pool;

  const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/iems';

  pool = new Pool({
    connectionString,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });

  pool.on('error', (err) => {
    console.error('Unexpected PostgreSQL pool error:', err);
  });

  return pool;
}

// Convert SQLite-style ? placeholders to PostgreSQL $1, $2, $3...
function convertPlaceholders(sql) {
  let index = 0;
  return sql.replace(/\?/g, () => `$${++index}`);
}

// Wrapper that mimics better-sqlite3's prepare() API
function prepare(sql) {
  const pgSql = convertPlaceholders(sql);
  const p = getPool();

  return {
    get: async (...params) => {
      const result = await p.query(pgSql, params);
      return result.rows[0] || undefined;
    },
    all: async (...params) => {
      const result = await p.query(pgSql, params);
      return result.rows;
    },
    run: async (...params) => {
      const result = await p.query(pgSql + (pgSql.trim().toUpperCase().startsWith('INSERT') && !pgSql.includes('RETURNING') ? ' RETURNING id' : ''), params);
      return {
        changes: result.rowCount,
        lastInsertRowid: result.rows[0]?.id || null,
      };
    },
  };
}

// Execute raw SQL (for schema init, migrations)
async function exec(sql) {
  const p = getPool();
  await p.query(sql);
}

// Transaction wrapper
function transaction(fn) {
  return async (...args) => {
    const client = await getPool().connect();
    try {
      await client.query('BEGIN');
      // Create a transaction-scoped db that uses this client
      const txDb = {
        prepare: (sql) => {
          const pgSql = convertPlaceholders(sql);
          return {
            get: async (...params) => { const r = await client.query(pgSql, params); return r.rows[0] || undefined; },
            all: async (...params) => { const r = await client.query(pgSql, params); return r.rows; },
            run: async (...params) => {
              const fullSql = pgSql + (pgSql.trim().toUpperCase().startsWith('INSERT') && !pgSql.includes('RETURNING') ? ' RETURNING id' : '');
              const r = await client.query(fullSql, params);
              return { changes: r.rowCount, lastInsertRowid: r.rows[0]?.id || null };
            },
          };
        },
      };
      const result = await fn(txDb, ...args);
      await client.query('COMMIT');
      return result;
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  };
}

// The db object that all routes import
const db = {
  prepare,
  exec,
  transaction,
  getPool,
};

export function getDb() {
  return db;
}

export default getDb;
