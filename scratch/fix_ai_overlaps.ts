
import { pool, closePool } from '../src/database/db';
import fs from 'fs';

async function fixOverlaps() {
  try {
    console.log('🔄 Cleaning up existing overlapping schedules (10:30 collisions)...');
    
    // 1. Resolve ALL "10:30" collisions across the entire database for pending/scheduled visits
    const result = await pool.query(`
      WITH collisions AS (
        SELECT id, mr_id, scheduled_date, 
               ROW_NUMBER() OVER (PARTITION BY mr_id, scheduled_date ORDER BY id) - 1 as slot_index
        FROM visit_schedules
        WHERE scheduled_time = '10:30' AND status IN ('pending', 'planned', 'scheduled')
      )
      UPDATE visit_schedules
      SET scheduled_time = TO_CHAR(('09:00:00'::TIME + (collisions.slot_index * INTERVAL '1 hour')), 'HH24:MI')
      FROM collisions
      WHERE visit_schedules.id = collisions.id
      RETURNING visit_schedules.id
    `);

    console.log(`✅ Fixed ${result.rowCount} overlapping visits.`);
    console.log('✅ Existing overlaps resolved successfully.');
  } catch (e) {
    console.error('❌ Cleanup failed:', e.message);
  } finally {
    await closePool();
  }
}

fixOverlaps();
