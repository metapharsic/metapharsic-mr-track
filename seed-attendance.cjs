const { Client } = require('pg');
const fs = require('fs');

async function run() {
  const client = new Client({ connectionString: 'postgresql://metaphysic_user:Metapharsic2026!Secure@localhost:5432/metaphysic_crm' });
  await client.connect();
  try {
    const sql = fs.readFileSync('src/database/schema.sql', 'utf8');
    await client.query(sql);
    console.log('Schema executed.');
    
    const res = await fetch('http://localhost:3000/api/attendance');
    const att = await res.json();
    console.log(`Fetched ${att.length} attendance records from API.`);
    
    for (const a of att) {
      await client.query(`
        INSERT INTO attendance (mr_id, date, check_in, check_out, lat, lng, status, visit_counts, total_order_value) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `, [
        a.mr_id, a.date, a.check_in, a.check_out, 
        a.lat || null, a.lng || null, a.status, 
        a.visit_counts || {}, a.total_order_value || 0
      ]);
    }
    console.log('Attendance seeded.');
  } catch(e) {
    console.error(e);
  } finally {
    await client.end();
  }
}
run();
