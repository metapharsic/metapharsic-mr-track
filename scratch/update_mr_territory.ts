
import { pool, closePool } from '../src/database/db';

async function update() {
  try {
    await pool.query("UPDATE mrs SET territory = 'Hyderabad East Extended (Habsiguda, Nacharam, Uppal, Mallapur, Zaheerabad, Munipally)' WHERE id = 7");
    console.log('✅ MR 7 territory updated in PostgreSQL');
    
    // Also update users table if it exists
    await pool.query("UPDATE users SET territory = 'Hyderabad East Extended (Habsiguda, Nacharam, Uppal, Mallapur, Zaheerabad, Munipally)' WHERE mr_id = 7");
    console.log('✅ User 7 territory updated in PostgreSQL');
  } catch (e) {
    console.error('❌ DB update failed:', e.message);
  } finally {
    await closePool();
  }
}

update();
