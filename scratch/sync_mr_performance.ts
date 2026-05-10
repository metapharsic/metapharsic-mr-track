
import { pool, closePool } from '../src/database/db';

async function syncPerformance() {
  try {
    console.log('🔄 Starting Manual MR Performance Sync...');
    
    // 1. Recalculate Sales and Update mrs table
    await pool.query(`
      UPDATE mrs m
      SET total_sales = s.total
      FROM (
        SELECT mr_id, SUM(amount) as total 
        FROM sales 
        GROUP BY mr_id
      ) s
      WHERE m.id = s.mr_id
    `);
    
    // 2. Update Targets Achieved
    await pool.query(`
      UPDATE mrs m
      SET targets_achieved = t.count
      FROM (
        SELECT mr_id, COUNT(*) as count 
        FROM targets 
        WHERE status = 'achieved' 
        GROUP BY mr_id
      ) t
      WHERE m.id = t.mr_id
    `);

    // 3. Update Targets Missed
    await pool.query(`
      UPDATE mrs m
      SET targets_missed = t.count
      FROM (
        SELECT mr_id, COUNT(*) as count 
        FROM targets 
        WHERE status = 'missed' 
        GROUP BY mr_id
      ) t
      WHERE m.id = t.mr_id
    `);

    // 4. Update Performance Scores based on achieved vs total targets + sales weight
    await pool.query(`
      UPDATE mrs m
      SET performance_score = LEAST(100, ROUND(
        (COALESCE(targets_achieved, 0) * 15) + 
        (LEAST(40, (COALESCE(total_sales, 0) / 100000) * 5)) + 
        45 -- base score
      ))
    `);

    console.log('✅ MR Performance Sync Complete');
  } catch (e) {
    console.error('❌ Sync failed:', e.message);
  } finally {
    await closePool();
  }
}

syncPerformance();
