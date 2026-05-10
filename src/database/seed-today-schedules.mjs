import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: false });

const today = new Date().toISOString().split('T')[0];
console.log('Seeding schedules for date:', today);

const schedules = [
  { mr_id: 1, doctor_id: 4, pharmacy_id: null, hospital_id: null, entity_type: 'doctor', doctor_name: 'Dr. S. Ramachandran', clinic: 'Apollo Hospital', specialty: 'Neurology', tier: 'A', address: 'Jubilee Hills, Hyderabad', phone: '+91 40 2360 7777', territory: 'Habsiguda', scheduled_time: '09:00', purpose: 'Neurology product briefing - new neuro range introduction', priority: 'high', status: 'pending', estimated_duration: 45, notes: 'New neuro range introductory visit - bring clinical data' },
  { mr_id: 1, doctor_id: 7, pharmacy_id: null, hospital_id: null, entity_type: 'doctor', doctor_name: 'Dr. Fathima', clinic: 'Medicover Hospitals', specialty: 'Oncology', tier: 'A', address: 'HITEC City, Hyderabad', phone: '+91 40 6600 2600', territory: 'Habsiguda', scheduled_time: '11:00', purpose: 'Oncology samples delivery and discussion', priority: 'high', status: 'pending', estimated_duration: 30, notes: 'Bring updated clinical data and product brochures' },
  { mr_id: 1, doctor_id: null, pharmacy_id: 12, hospital_id: null, entity_type: 'chemist', doctor_name: 'Ankur Medicals', clinic: 'Ankur Medicals', specialty: 'Pharmacy', tier: 'A', address: 'D.No.4-7-41/2, nr. Bapuji Nagar Main Rd, MBD Complex, HMT Nagar, Nacharam', phone: '+91 99597 42442', territory: 'Nacharam', scheduled_time: '14:00', purpose: 'Restock check & new product intro - antibiotic range', priority: 'medium', status: 'pending', estimated_duration: 25, notes: 'New antibiotic range samples - check existing stock levels' },
  { mr_id: 2, doctor_id: 20, pharmacy_id: null, hospital_id: null, entity_type: 'doctor', doctor_name: 'Dr. K. S. Rao', clinic: 'Care Hospitals', specialty: 'Endocrinology', tier: 'A', address: 'Road No. 1, Banjara Hills, Hyderabad', phone: '+91 40 3041 8888', territory: 'Banjara Hills', scheduled_time: '10:30', purpose: 'Diabetes product briefing - new Gluconorm samples', priority: 'high', status: 'pending', estimated_duration: 35, notes: 'New Gluconorm samples - discuss quarterly order' },
  { mr_id: 3, doctor_id: 35, pharmacy_id: null, hospital_id: null, entity_type: 'doctor', doctor_name: 'Dr. Anitha', clinic: 'Anitha Maternity Home', specialty: 'Gynaecology & Obstetrics', tier: 'B', address: 'Mallapur, Hyderabad', phone: '+91 98480 55555', territory: 'Mallapur', scheduled_time: '10:00', purpose: 'Maternity vitamin range presentation', priority: 'high', status: 'pending', estimated_duration: 40, notes: 'Bring brochures for the new maternity range' },
  { mr_id: 3, doctor_id: null, pharmacy_id: null, hospital_id: 1, entity_type: 'hospital', doctor_name: 'Prasad Hospitals', clinic: 'Prasad Hospitals', specialty: 'Multi-Speciality', tier: 'A', address: '44-617/12, IDA, Nacharam', phone: '+91 88012 33333', territory: 'Nacharam', scheduled_time: '14:00', purpose: 'Hospital procurement meeting - volume pricing discussion', priority: 'high', status: 'pending', estimated_duration: 60, notes: 'Discuss volume pricing and supply agreement renewal' },
];

async function run() {
  // Remove existing today schedules for these MRs
  await pool.query('DELETE FROM visit_schedules WHERE scheduled_date = $1 AND mr_id IN (1,2,3)', [today]);
  console.log('Cleared existing schedules for today');

  for (const s of schedules) {
    const res = await pool.query(
      `INSERT INTO visit_schedules 
        (mr_id, doctor_id, pharmacy_id, hospital_id, entity_type, doctor_name, clinic, specialty, tier, address, phone, territory, scheduled_date, scheduled_time, purpose, priority, status, estimated_duration, notes, ai_generated) 
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,false)
       RETURNING id`,
      [s.mr_id, s.doctor_id, s.pharmacy_id, s.hospital_id, s.entity_type, s.doctor_name, s.clinic, s.specialty, s.tier, s.address, s.phone, s.territory, today, s.scheduled_time, s.purpose, s.priority, s.status, s.estimated_duration, s.notes]
    );
    console.log('Inserted ID', res.rows[0].id, ':', s.doctor_name, 'at', s.scheduled_time, `(MR ${s.mr_id})`);
  }

  await pool.end();
  console.log('Done — seeded', schedules.length, 'schedules for', today);
}

run().catch(e => { console.error(e); process.exit(1); });
