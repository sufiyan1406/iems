import path from 'path';
import fs from 'fs';

// ============================================
// Dual-mode Database Layer
// Auto-detects: SQLite (local dev) or PostgreSQL (production)
//
// All routes use the same async API:
//   db.prepare(sql).get(...params)   → first row
//   db.prepare(sql).all(...params)   → all rows  
//   db.prepare(sql).run(...params)   → { changes, lastInsertRowid }
// ============================================

const DATABASE_URL = process.env.DATABASE_URL || '';
const USE_POSTGRES = DATABASE_URL.startsWith('postgresql://') || DATABASE_URL.startsWith('postgres://');

let instance = null;

// ---- SQLite Mode ----
function createSqliteDb() {
  const Database = require('better-sqlite3');

  const dbPath = path.join(process.cwd(), 'data', 'iems.db');
  const dataDir = path.dirname(dbPath);
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

  const sqlite = new Database(dbPath);
  sqlite.pragma('journal_mode = WAL');
  sqlite.pragma('foreign_keys = ON');

  // Initialize schema
  const schemaPath = path.join(process.cwd(), 'src', 'lib', 'schema-sqlite.sql');
  if (fs.existsSync(schemaPath)) {
    sqlite.exec(fs.readFileSync(schemaPath, 'utf8'));
  }

  // Wrap synchronous better-sqlite3 calls to return Promises
  // so `await db.prepare(sql).get()` works identically to PG mode
  return {
    prepare: (sql) => ({
      get: async (...params) => sqlite.prepare(sql).get(...params),
      all: async (...params) => sqlite.prepare(sql).all(...params),
      run: async (...params) => {
        const result = sqlite.prepare(sql).run(...params);
        return { changes: result.changes, lastInsertRowid: result.lastInsertRowid };
      },
    }),
    exec: async (sql) => sqlite.exec(sql),
    transaction: (fn) => {
      // For SQLite transactions, we use better-sqlite3's native transaction
      return async (...args) => {
        const txFn = sqlite.transaction((...a) => fn(...a));
        return txFn(...args);
      };
    },
    getPool: () => null, // SQLite doesn't have a pool
    _mode: 'sqlite',
  };
}

// ---- PostgreSQL Mode ----
function createPgDb() {
  const pg = require('pg');
  const { Pool } = pg;

  const pool = new Pool({
    connectionString: DATABASE_URL,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });

  pool.on('error', (err) => console.error('PostgreSQL pool error:', err));

  // Convert ? placeholders to $1, $2, $3...
  function convertPlaceholders(sql) {
    let i = 0;
    return sql.replace(/\?/g, () => `$${++i}`);
  }

  return {
    prepare: (sql) => {
      const pgSql = convertPlaceholders(sql);
      return {
        get: async (...params) => {
          const r = await pool.query(pgSql, params);
          return r.rows[0] || undefined;
        },
        all: async (...params) => {
          const r = await pool.query(pgSql, params);
          return r.rows;
        },
        run: async (...params) => {
          const fullSql = pgSql + (pgSql.trim().toUpperCase().startsWith('INSERT') && !pgSql.includes('RETURNING') ? ' RETURNING id' : '');
          const r = await pool.query(fullSql, params);
          return { changes: r.rowCount, lastInsertRowid: r.rows[0]?.id || null };
        },
      };
    },
    exec: async (sql) => await pool.query(sql),
    transaction: (fn) => {
      return async (...args) => {
        const client = await pool.connect();
        try {
          await client.query('BEGIN');
          const result = await fn(...args);
          await client.query('COMMIT');
          return result;
        } catch (e) {
          await client.query('ROLLBACK');
          throw e;
        } finally {
          client.release();
        }
      };
    },
    getPool: () => pool,
    _mode: 'postgres',
  };
}

// ---- Public API ----
export function getDb() {
  if (instance) return instance;
  instance = USE_POSTGRES ? createPgDb() : createSqliteDb();
  console.log(`📦 Database: ${instance._mode.toUpperCase()} mode`);
  return instance;
}

export default getDb;
