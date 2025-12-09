const mysql = require('mysql2/promise');

let pool;

async function connectDatabase() {
  if (pool) return pool;
  pool = mysql.createPool({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    connectionLimit: 10
  });
  await pool.query('SELECT 1');
  console.log('MySQL bağlantısı hazır');
  return pool;
}

function getPool() {
  if (!pool) throw new Error('Veritabanı havuzu hazır değil');
  return pool;
}

module.exports = { connectDatabase, getPool };
