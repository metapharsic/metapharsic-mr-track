const { Pool } = require('pg');
const dotenv = require('dotenv');
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function check() {
  console.log('Checking database...');
  try {
    const start = Date.now();
    const res = await pool.query('SELECT NOW()');
    console.log('Database responsive:', res.rows[0].now);
    console.log('Time taken:', Date.now() - start, 'ms');
    
    const mrs = await pool.query('SELECT COUNT(*) FROM mrs');
    console.log('MRs count:', mrs.rows[0].count);
    
    const sales = await pool.query('SELECT COUNT(*) FROM sales');
    console.log('Sales count:', sales.rows[0].count);
    
  } catch (err) {
    console.error('Database check failed:', err);
  } finally {
    await pool.end();
  }
}

check();
