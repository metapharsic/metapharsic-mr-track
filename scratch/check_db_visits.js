
import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function checkVisits() {
  try {
    console.log('--- DOCTOR_VISITS TABLE ---');
    const dvResult = await pool.query('SELECT id, doctor_name, visit_date, outcome FROM doctor_visits LIMIT 5');
    console.table(dvResult.rows);

    console.log('\n--- VISIT_RECORDS TABLE ---');
    const vrResult = await pool.query('SELECT id, entity_name, arrival_time, key_discussion FROM visit_records LIMIT 5');
    console.table(vrResult.rows);
  } catch (err) {
    console.error('Error querying database:', err.message);
  } finally {
    await pool.end();
  }
}

checkVisits();
