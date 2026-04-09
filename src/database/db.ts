import dotenv from 'dotenv';
dotenv.config();

import { Pool, PoolConfig } from 'pg';
import * as repositories from './repositories';

console.log('DATABASE_URL:', process.env.DATABASE_URL ? '✅ Set' : '❌ Not set');

// Database configuration from environment variables
const poolConfig: PoolConfig = {
  connectionString: process.env.DATABASE_URL,
  user: process.env.PGUSER || undefined,
  password: process.env.PGPASSWORD || undefined,
  ssl: process.env.NODE_ENV === 'production' ? { 
    rejectUnauthorized: false  // Required for external connections
  } : false,
  max: 20,  // Maximum number of clients in the pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
};

// Create connection pool
export const pool = new Pool(poolConfig);

// Export repositories
export { repositories };

// Test connection
pool.on('connect', () => {
  console.log('✅ Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('❌ Unexpected database error:', err);
});

// Helper function for queries
export const query = async (text: string, params?: any[]) => {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Executed query', { text, duration, rows: result.rowCount });
    return result;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
};

// Helper to get client from pool
export const getClient = async () => {
  const client = await pool.connect();
  return client;
};

// Graceful shutdown
export const closePool = async () => {
  await pool.end();
  console.log('Database pool closed');
};

// Test database connection
export const testConnection = async () => {
  try {
    const result = await query('SELECT NOW()');
    console.log('✅ Database connection test successful:', result.rows[0].now);
    return true;
  } catch (error) {
    console.error('❌ Database connection test failed:', error);
    return false;
  }
};

// Initialize database schema
export const initializeDatabase = async () => {
  try {
    const fs = await import('fs');
    const path = await import('path');
    import.meta;
    
    const schemaPath = path.join(process.cwd(), 'src', 'database', 'schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf-8');
    
    await query(schemaSql);
    console.log('✅ Database schema initialized');
    return true;
  } catch (error) {
    console.error('❌ Database schema initialization failed:', error);
    return false;
  }
};
