const { Client } = require('pg');

const API_URL = 'http://localhost:3000/api';
const DB_URL = 'postgresql://metaphysic_user:Metapharsic2026!Secure@localhost:5432/metaphysic_crm';

async function seed() {
  const client = new Client({ connectionString: DB_URL });
  await client.connect();

  console.log('Fetching data from API...');
  
  const [products, sales, expenses, visitSchedules] = await Promise.all([
    fetch(`${API_URL}/products`).then(r => r.json()),
    fetch(`${API_URL}/sales`).then(r => r.json()),
    fetch(`${API_URL}/expenses`).then(r => r.json()),
    fetch(`${API_URL}/visit-schedules`).then(r => r.json())
  ]);

  console.log(`Fetched ${products.length} products, ${sales.length} sales, ${expenses.length} expenses, ${visitSchedules.length} visit schedules.`);

  try {
    for (const p of products) {
      await client.query(`
        INSERT INTO products (name, type, cogs, mrp, pts, category, stock, department, reorder_level, composition, indication)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        ON CONFLICT DO NOTHING
      `, [p.name, p.type || 'Pill', p.cogs || 0, p.mrp || 0, p.pts || 0, p.category || '', p.stock || 0, p.department || '', p.reorder_level || 0, p.composition || '', p.indication || '']);
    }
    console.log('Products inserted.');

    for (const v of visitSchedules) {
      await client.query(`
        INSERT INTO visit_schedules (mr_id, doctor_name, clinic, scheduled_date, scheduled_time, purpose, status, priority, estimated_duration, notes, ai_generated)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        ON CONFLICT DO NOTHING
      `, [v.mr_id, v.doctor_name, v.clinic, v.scheduled_date, v.scheduled_time, v.purpose || 'routine', v.status || 'planned', v.priority || 'medium', v.estimated_duration || 30, v.notes || '', v.ai_generated || false]);
    }
    console.log('Visit Schedules inserted.');

    for (const s of sales) {
      // doctor_id might be missing or different, but sale needs doctor_id
      // Let's insert blindly
      await client.query(`
        INSERT INTO sales (mr_id, product_id, doctor_id, quantity, amount, date)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT DO NOTHING
      `, [s.mr_id, s.product_id || 1, s.doctor_id || 1, s.quantity || 1, s.amount || 0, s.date || new Date().toISOString()]);
    }
    console.log('Sales inserted.');

    for (const e of expenses) {
      await client.query(`
        INSERT INTO expenses (mr_id, category, amount, description, date, status)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT DO NOTHING
      `, [e.mr_id, e.category || 'Travel', e.amount || 0, e.description || '', e.date || new Date().toISOString(), e.status || 'pending']);
    }
    console.log('Expenses inserted.');

  } catch (err) {
    console.error('Error during insert:', err);
  } finally {
    await client.end();
  }
}

seed().catch(console.error);
