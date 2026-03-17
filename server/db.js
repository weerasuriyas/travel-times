import mysql from 'mysql2/promise'

let pool = null

export function getDb() {
  if (!pool) {
    pool = mysql.createPool({
      host: process.env.API_DB_HOST || process.env.DB_HOST || 'localhost',
      database: process.env.API_DB_NAME || process.env.DB_NAME,
      user: process.env.API_DB_USER || process.env.DB_USER,
      password: process.env.API_DB_PASS || process.env.DB_PASS,
      charset: 'utf8mb4',
      waitForConnections: true,
      connectionLimit: 10,
    })
  }
  return pool
}
