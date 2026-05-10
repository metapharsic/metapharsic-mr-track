import dotenv from 'dotenv';
dotenv.config();
import pg from 'pg';

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function alterLeadsTable() {
  try {
    console.log('Creating leads table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS leads (
        id SERIAL PRIMARY KEY,
        doctor_name VARCHAR(255) NOT NULL,
        specialty VARCHAR(100),
        territory VARCHAR(255),
        priority VARCHAR(50) DEFAULT 'medium',
        status VARCHAR(50) DEFAULT 'new',
        comments TEXT,
        expected_revenue DECIMAL(12,2),
        actual_revenue DECIMAL(12,2),
        conversion_probability INTEGER,
        time_to_conversion_days INTEGER,
        assigned_mr_id INTEGER,
        assigned_mr_name VARCHAR(255),
        last_contact_date DATE,
        converted_date DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Successfully created leads table.');
  } catch (error) {
    console.error('Error creating leads table:', error);
  } finally {
    await pool.end();
  }
}

alterLeadsTable();
