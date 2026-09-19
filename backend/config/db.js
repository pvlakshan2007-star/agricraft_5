/**
 * AGRI CRAFT-AI - PostgreSQL Database Configuration (db.js)
 * 
 * Manages database connection pool using 'pg'.
 * Uses parameterized queries exclusively to prevent SQL injection.
 * Sensitive credentials are read from environment variables (.env).
 */

const fs = require('fs');
const path = require('path');

// Safe .env loader (supports dotenv or native file parser)
const envPath = path.resolve(__dirname, '../../.env');
if (fs.existsSync(envPath)) {
  try {
    require('dotenv').config({ path: envPath });
  } catch (e) {
    // Vanilla .env parser if dotenv is not yet installed via npm
    try {
      const content = fs.readFileSync(envPath, 'utf8');
      content.split('\n').forEach(line => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
          const idx = trimmed.indexOf('=');
          const k = trimmed.slice(0, idx).trim();
          const v = trimmed.slice(idx + 1).trim();
          if (!process.env[k]) process.env[k] = v;
        }
      });
    } catch (parseErr) {}
  }
}

let Pool = null;
try {
  Pool = require('pg').Pool;
} catch (e) {
  // pg will be available once npm install is run
}

let pool = null;
let isConnected = false;
let connectionError = Pool ? null : 'PostgreSQL pg module not yet installed. Run: npm install';

// Determine connection parameters
const connectionConfig = process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    }
  : {
      host: process.env.PGHOST || 'localhost',
      port: parseInt(process.env.PGPORT, 10) || 5432,
      user: process.env.PGUSER || 'postgres',
      password: process.env.PGPASSWORD || 'postgres',
      database: process.env.PGDATABASE || 'agricraft'
    };

if (Pool) {
  try {
    pool = new Pool({
      ...connectionConfig,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 3000
    });

    pool.on('error', (err) => {
      console.error('Unexpected PostgreSQL pool error:', err.message);
      isConnected = false;
      connectionError = err.message;
    });
  } catch (err) {
    console.warn('PostgreSQL Pool initialization warning:', err.message);
    connectionError = err.message;
  }
}

/**
 * Execute a parameterized query with safe variable binding ($1, $2, ...)
 * @param {string} text - SQL query template with $1, $2 placeholders
 * @param {Array} params - Values to safely bind
 * @returns {Promise<Object>} pg result object { rows, rowCount }
 */
async function query(text, params = []) {
  if (!pool) {
    throw new Error('Database pool not initialized. Check PostgreSQL connection configuration.');
  }

  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    if (process.env.NODE_ENV === 'development') {
      console.log(`[SQL] (${duration}ms) ${text.replace(/\s+/g, ' ').slice(0, 100)}...`);
    }
    isConnected = true;
    connectionError = null;
    return res;
  } catch (err) {
    console.error('[SQL Error]', err.message, 'Query:', text);
    throw err;
  }
}

/**
 * Test connectivity to PostgreSQL database
 */
async function testConnection() {
  if (!pool) {
    return {
      connected: false,
      message: 'Pool not created. Verify .env settings.'
    };
  }

  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW() AS current_time, current_database() AS db_name');
    client.release();
    isConnected = true;
    connectionError = null;
    return {
      connected: true,
      database: result.rows[0].db_name,
      serverTime: result.rows[0].current_time
    };
  } catch (err) {
    isConnected = false;
    connectionError = err.message;
    return {
      connected: false,
      error: err.message,
      hint: 'Ensure PostgreSQL server is running and database specified in .env exists.'
    };
  }
}

function getStatus() {
  return {
    isConnected,
    connectionError,
    config: {
      host: connectionConfig.host || 'via DATABASE_URL',
      database: connectionConfig.database || 'configured'
    }
  };
}

module.exports = {
  query,
  testConnection,
  getStatus,
  getPool: () => pool
};
