
import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function validateDatabase() {
  console.log('🔍 Validating Metapharsic CRM Database Tables...');

  try {
    // 1. Check Table Counts
    const tables = [
      'mrs', 'doctors', 'pharmacies', 'hospitals', 'products', 
      'visit_schedules', 'doctor_visits', 'visit_records', 
      'sales', 'expenses', 'attendance', 'users'
    ];

    console.log('\n📊 Table Row Counts:');
    for (const table of tables) {
      const res = await pool.query(`SELECT COUNT(*) FROM ${table}`);
      console.log(`- ${table.padEnd(15)}: ${res.rows[0].count} rows`);
    }

    // 2. Sample Data Verification (doctor_visits)
    console.log('\n📑 Sample Data (doctor_visits):');
    const visitRes = await pool.query('SELECT * FROM doctor_visits LIMIT 5');
    console.log(JSON.stringify(visitRes.rows, null, 2));

    // 2b. Sample Data Verification (visit_records)
    console.log('\n📑 Sample Data (visit_records):');
    const recordRes = await pool.query('SELECT * FROM visit_records LIMIT 5');
    console.log(JSON.stringify(recordRes.rows, null, 2));

    // 3. Check for specific problematic record
    console.log('\n🔍 Searching for Sri Vasavi Medical Hall:');
    const svasaviRes = await pool.query("SELECT * FROM doctor_visits WHERE doctor_name = 'Sri Vasavi Medical Hall'");
    console.log(JSON.stringify(svasaviRes.rows, null, 2));

  } catch (err) {
    console.error('❌ Validation failed:', err);
  } finally {
    await pool.end();
  }
}

validateDatabase();
