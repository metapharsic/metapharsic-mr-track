
import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function validateDatabase() {
  try {
    console.log('--- Detailed Database Validation (Check-In/Out) ---\n');
    
    // 1. Check Doctor Visits
    const dvResult = await pool.query(
      'SELECT id, doctor_name, visit_date, visit_time, status, check_in_time, check_out_time FROM doctor_visits'
    );
    
    console.log('doctor_visits Table:');
    console.table(dvResult.rows);

    // 2. Check Visit Records
    const vrResult = await pool.query(
      'SELECT id, entity_name, arrival_time, check_in_time, check_out_time, status FROM visit_records'
    );

    console.log('\nvisit_records Table:');
    console.table(vrResult.rows);

  } catch (err) {
    console.error('Error querying database:', err.message);
  } finally {
    await pool.end();
  }
}

validateDatabase();
