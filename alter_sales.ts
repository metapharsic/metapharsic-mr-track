import dotenv from 'dotenv';
dotenv.config();
import pg from 'pg';

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function alterSalesTable() {
  try {
    console.log('Altering sales table...');
    await pool.query(`
      ALTER TABLE sales 
      ADD COLUMN IF NOT EXISTS customer_name VARCHAR(255),
      ADD COLUMN IF NOT EXISTS sale_type VARCHAR(50) DEFAULT 'primary',
      ADD COLUMN IF NOT EXISTS doctor_name VARCHAR(255),
      ADD COLUMN IF NOT EXISTS clinic VARCHAR(255);
    `);
    console.log('Successfully altered sales table.');
  } catch (error) {
    console.error('Error altering sales table:', error);
  } finally {
    await pool.end();
  }
}

alterSalesTable();
