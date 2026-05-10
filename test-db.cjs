const { Client } = require('pg');
async function run() {
  const client = new Client({ connectionString: 'postgresql://metaphysic_user:Metapharsic2026!Secure@localhost:5432/metaphysic_crm' });
  await client.connect();
  try {
    const res = await client.query('UPDATE attendance SET check_out = $1 WHERE mr_id = $2 AND date = $3 RETURNING *', ['11:50 PM', 1, '2026-05-07']);
    console.log(res.rows);
  } catch(e) {
    console.error(e);
  } finally {
    await client.end();
  }
}
run();
