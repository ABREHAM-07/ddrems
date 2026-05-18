const { Pool } = require("pg");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const pool = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: String(process.env.DB_PASSWORD),
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Convert MySQL-style ? placeholders to PostgreSQL $1, $2, etc.
// Skips ? inside single-quoted strings
function convertPlaceholders(text) {
  let i = 0;
  let inString = false;
  let result = '';
  for (let c = 0; c < text.length; c++) {
    const ch = text[c];
    if (ch === "'" && text[c - 1] !== '\\') inString = !inString;
    if (ch === '?' && !inString) {
      result += `$${++i}`;
    } else {
      result += ch;
    }
  }
  return result;
}

// Handle MySQL-style batch inserts: VALUES ? with [[row1], [row2], ...]
function expandBatchInsert(text, params) {
  if (!text.match(/VALUES\s+\?\s*$/i)) return null;
  if (!params || params.length !== 1 || !Array.isArray(params[0])) return null;

  const rows = params[0];
  if (rows.length === 0 || !Array.isArray(rows[0])) return null;

  const allParams = [];
  const valueClauses = [];

  for (const row of rows) {
    const placeholders = [];
    for (const val of row) {
      allParams.push(val);
      placeholders.push(`$${allParams.length}`);
    }
    valueClauses.push(`(${placeholders.join(", ")})`);
  }

  const newText = text.replace(/VALUES\s+\?\s*$/i, `VALUES ${valueClauses.join(", ")}`);
  return { text: newText, params: allParams };
}

const db = {
  query: async (text, params = []) => {
    try {
      // Try batch insert expansion first
      const batch = expandBatchInsert(text, params);
      if (batch) {
        const result = await pool.query(batch.text, batch.params);
        return [result.rows, result.fields || []];
      }

      // Convert ? placeholders to $1, $2, ...
      const converted = convertPlaceholders(text);

      // Handle ON CONFLICT DO NOTHING for PostgreSQL
      const pgText = converted
        .replace(/ON CONFLICT DO NOTHING/gi, 'ON CONFLICT DO NOTHING')
        .replace(/ON DUPLICATE KEY UPDATE .+?(?=;|$)/gi, 'ON CONFLICT DO NOTHING');

      const result = await pool.query(pgText, params);

      // Return in MySQL-style [rows, fields] format
      const rows = result.rows || [];

      // Attach insertId for INSERT statements
      if (/^\s*INSERT/i.test(text) && rows.length > 0 && rows[0].id) {
        return [{ insertId: rows[0].id, affectedRows: result.rowCount, rows }, result.fields || []];
      }

      if (/^\s*INSERT/i.test(text)) {
        return [{ insertId: null, affectedRows: result.rowCount || 0 }, result.fields || []];
      }

      if (/^\s*(UPDATE|DELETE)/i.test(text)) {
        return [{ affectedRows: result.rowCount || 0, changedRows: result.rowCount || 0 }, result.fields || []];
      }

      return [rows, result.fields || []];
    } catch (err) {
      console.error("[DB] Query error:", err.message);
      console.error("[DB] SQL:", text.substring(0, 200));
      throw err;
    }
  },

  getConnection: async () => {
    const client = await pool.connect();
    return {
      query: async (text, params = []) => {
        const converted = convertPlaceholders(text);
        const result = await client.query(converted, params);
        return [result.rows, result.fields || []];
      },
      execute: async (text, params = []) => {
        const converted = convertPlaceholders(text);
        const result = await client.query(converted, params);
        return [result.rows, result.fields || []];
      },
      beginTransaction: async () => client.query('BEGIN'),
      commit: async () => client.query('COMMIT'),
      rollback: async () => client.query('ROLLBACK'),
      release: () => client.release(),
    };
  },

  pool,
};

module.exports = db;
