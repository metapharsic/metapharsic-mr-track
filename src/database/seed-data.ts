
import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function seedData() {
  console.log('🚀 Seeding Metapharsic CRM data to PostgreSQL...');

  try {
    // Clear existing data for re-seeding
    console.log('🧹 Clearing existing visit data...');
    await pool.query('TRUNCATE TABLE doctor_visits, visit_records RESTART IDENTITY CASCADE');
    // 1. Seed Products
    console.log('📦 Seeding Products...');
    const products = [
      { name: "CardiCare Plus", type: "tablet", cogs: 120, mrp: 450, pts: 320, category: "Cardiology", stock: 1500, department: "Medicine", reorder_level: 200, composition: "Atorvastatin 20mg + Clopidogrel 75mg", indication: "Hypercholesterolemia and prevention of cardiovascular events" },
      { name: "HyperTensio 10mg", type: "tablet", cogs: 85, mrp: 280, pts: 195, category: "Cardiology", stock: 2000, department: "Medicine", reorder_level: 300, composition: "Amlodipine 10mg", indication: "Hypertension" },
      { name: "Glynase-MF", type: "tablet", cogs: 45, mrp: 165, pts: 110, category: "Diabetology", stock: 3500, department: "Medicine", reorder_level: 500, composition: "Metformin 500mg + Glipizide 5mg", indication: "Type 2 Diabetes" }
    ];

    for (const p of products) {
      await pool.query(
        `INSERT INTO products (name, type, cogs, mrp, pts, category, stock, department, reorder_level, composition, indication)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         ON CONFLICT DO NOTHING`,
        [p.name, p.type, p.cogs, p.mrp, p.pts, p.category, p.stock, p.department, p.reorder_level, p.composition, p.indication]
      );
    }

    // 2. Seed Doctors
    console.log('👨‍⚕️ Seeding Doctors...');
    const doctors = [
      { 
        name: "Dr. Ramesh Sharma", clinic: "Sharma Multi-Specialty Clinic", specialty: "Cardiology", 
        territory: "Mumbai North", tier: "A", potential: "high", 
        phone: "9876543220", email: "dr.ramesh@example.com", address: "Andheri West, Mumbai",
        rating: 4.8, timings: "10 AM - 2 PM, 6 PM - 9 PM", qualification: "MD, DM (Cardiology)"
      }
    ];

    for (const d of doctors) {
      await pool.query(
        `INSERT INTO doctors (name, clinic, specialty, territory, tier, potential, phone, email, address, rating, timings, qualification)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
         ON CONFLICT DO NOTHING`,
        [d.name, d.clinic, d.specialty, d.territory, d.tier, d.potential, d.phone, d.email, d.address, d.rating, d.timings, d.qualification]
      );
    }

    // 3. Seed Doctor Visits (including the requested one)
    console.log('📅 Seeding Doctor Visits...');
    const visits = [
      { 
        mr_id: 1, 
        doctor_name: "Dr. Ramesh Sharma", 
        clinic: "Sharma Multi-Specialty Clinic", 
        entity_type: 'doctor',
        visit_date: "2026-03-28", 
        visit_time: "10:00 AM", 
        status: "completed", 
        purpose: "Product presentation - New CardiCare Plus formulation", 
        outcome: "Dr. Ramesh was impressed with the clinical data. He asked about the long-term side effects compared to the current market leader.", 
        next_steps: "Send clinical trial reports for CardiCare Plus",
        products_detailed: "CardiCare Plus, HyperTensio 10mg",
        samples_given: "CardiCare Plus (5 units), HyperTensio (10 units)",
        check_in_time: "10:00 AM",
        check_out_time: "10:35 AM"
      },
      { 
        mr_id: 1, 
        doctor_name: "City Pharmacy", 
        clinic: "Main Street, North Mumbai", 
        entity_type: 'pharmacy',
        visit_date: "2026-03-29", 
        visit_time: "11:30 AM", 
        status: "completed", 
        purpose: "Stock check and order collection", 
        outcome: "Stock for CardiCare is low. They need a fresh supply by Monday.", 
        next_steps: "Process urgent order for 50 units of CardiCare Plus",
        products_detailed: "CardiCare Plus, Glynase-MF",
        samples_given: "Visual aids and shelf talkers",
        check_in_time: "11:30 AM",
        check_out_time: "11:55 AM"
      },
      { 
        mr_id: 1, 
        doctor_name: "Metro General Hospital", 
        clinic: "Central Square", 
        entity_type: 'hospital',
        visit_date: "2026-03-29", 
        visit_time: "02:00 PM", 
        status: "completed", 
        purpose: "New formulary introduction", 
        outcome: "Discussed Glynase-MF inclusion in the hospital formulary. Head of Pharmacy (Mr. Gupta) is interested and requested samples for internal testing.", 
        next_steps: "Follow up with procurement team next week",
        products_detailed: "Glynase-MF, HyperTensio",
        samples_given: "Glynase-MF (20 clinical samples)",
        check_in_time: "02:00 PM",
        check_out_time: "02:45 PM"
      },
      { 
        mr_id: 1, 
        doctor_name: "Sri Vasavi Medical Hall", 
        clinic: "Station Road, West Mumbai", 
        entity_type: 'pharmacy',
        visit_date: "2026-03-30", 
        visit_time: "11:30 AM", 
        status: "completed", 
        purpose: "Stock check and order collection", 
        outcome: "Stock for CardiCare is low. They need a fresh supply by Monday.", 
        next_steps: "Process order for 50 units",
        products_detailed: "CardiCare Plus",
        samples_given: "Visual aids",
        check_in_time: "11:30 AM",
        check_out_time: "11:55 AM"
      }
    ];

    for (const v of visits) {
      await pool.query(
        `INSERT INTO doctor_visits (mr_id, doctor_name, clinic, visit_date, visit_time, status, purpose, outcome, next_steps, products_detailed, samples_given, check_in_time, check_out_time, entity_type)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
        [v.mr_id, v.doctor_name, v.clinic, v.visit_date, v.visit_time, v.status, v.purpose, v.outcome, v.next_steps, v.products_detailed, v.samples_given, v.check_in_time, v.check_out_time, v.entity_type]
      );
    }

    // 4. Seed Visit Records
    console.log('📝 Seeding Visit Records...');
    for (const v of visits) {
      await pool.query(
        `INSERT INTO visit_records (mr_id, entity_name, entity_type, arrival_time, check_in_time, check_out_time, conversation_summary, key_discussion, doctor_feedback, products_detailed, samples_given, status, purpose)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
        [v.mr_id, v.doctor_name, v.entity_type, v.visit_time, v.check_in_time, v.check_out_time, v.outcome, v.outcome, v.outcome, JSON.stringify([v.products_detailed]), JSON.stringify([v.samples_given]), v.status, v.purpose]
      );
    }

    console.log('\n✅ Seeding completed successfully!');

  } catch (err) {
    console.error('❌ Seeding failed:', err);
  } finally {
    await pool.end();
  }
}

seedData();
