import dotenv from 'dotenv';
dotenv.config();

import { pool, query, initializeDatabase } from './db';
import * as fs from 'fs';
import * as path from 'path';

async function migrateData() {
  console.log('🚀 Starting data migration to PostgreSQL...\n');
  
  try {
    // Step 1: Initialize database schema
    console.log('📋 Step 1: Initializing database schema...');
    const schemaInitialized = await initializeDatabase();
    if (!schemaInitialized) {
      console.error('❌ Failed to initialize schema. Aborting migration.');
      return;
    }
    console.log('✅ Schema initialized successfully\n');

    // Step 2: Read current server data (if available)
    console.log('📋 Step 2: Reading current data...');
    
    // We'll migrate from the seed data in server.ts
    // For now, we'll create sample data based on the structure
    
    // Migrate MRs
    console.log('\n📋 Migrating MRs...');
    const mrs = [
      { name: 'Rajesh Kumar', territory: 'Mumbai North', base_salary: 25000, daily_allowance: 500, joining_date: '2023-01-15', phone: '9876543210', email: 'rajesh.kumar@metapharsic.com', status: 'active', performance_score: 85, total_sales: 450000, targets_achieved: 12, targets_missed: 3, avatar_url: null },
      { name: 'Priya Sharma', territory: 'Mumbai South', base_salary: 25000, daily_allowance: 500, joining_date: '2023-03-20', phone: '9876543211', email: 'priya.sharma@metapharsic.com', status: 'active', performance_score: 78, total_sales: 380000, targets_achieved: 10, targets_missed: 5, avatar_url: null },
      { name: 'Amit Patel', territory: 'Delhi Central', base_salary: 25000, daily_allowance: 500, joining_date: '2023-02-10', phone: '9876543212', email: 'amit.patel@metapharsic.com', status: 'active', performance_score: 92, total_sales: 520000, targets_achieved: 15, targets_missed: 2, avatar_url: null },
      { name: 'Sneha Reddy', territory: 'Bangalore East', base_salary: 25000, daily_allowance: 500, joining_date: '2023-04-05', phone: '9876543213', email: 'sneha.reddy@metapharsic.com', status: 'active', performance_score: 88, total_sales: 490000, targets_achieved: 14, targets_missed: 3, avatar_url: null },
      { name: 'Vikram Singh', territory: 'Hyderabad Central', base_salary: 25000, daily_allowance: 500, joining_date: '2023-05-12', phone: '9876543214', email: 'vikram.singh@metapharsic.com', status: 'active', performance_score: 80, total_sales: 410000, targets_achieved: 11, targets_missed: 4, avatar_url: null },
      { name: 'Ananya Iyer', territory: 'Chennai North', base_salary: 25000, daily_allowance: 500, joining_date: '2023-06-18', phone: '9876543215', email: 'ananya.iyer@metapharsic.com', status: 'active', performance_score: 75, total_sales: 350000, targets_achieved: 9, targets_missed: 6, avatar_url: null }
    ];

    for (const mr of mrs) {
      try {
        await query(
          `INSERT INTO mrs (name, territory, base_salary, daily_allowance, joining_date, 
           phone, email, status, performance_score, total_sales, targets_achieved, targets_missed, avatar_url)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
           ON CONFLICT DO NOTHING`,
          [mr.name, mr.territory, mr.base_salary, mr.daily_allowance, mr.joining_date,
           mr.phone, mr.email, mr.status, mr.performance_score, mr.total_sales,
           mr.targets_achieved, mr.targets_missed, mr.avatar_url]
        );
      } catch (error: any) {
        if (!error.message.includes('duplicate')) {
          console.error(`Error inserting MR ${mr.name}:`, error);
        }
      }
    }
    console.log(`✅ Migrated ${mrs.length} MRs`);

    // Migrate Users
    console.log('\n📋 Migrating Users...');
    const users = [
      { email: 'admin@metapharsic.com', name: 'Admin User', role: 'admin', mr_id: null, territory: null, password_hash: 'demo' },
      { email: 'rajesh.kumar@metapharsic.com', name: 'Rajesh Kumar', role: 'mr', mr_id: 1, territory: 'Mumbai North', password_hash: 'demo' },
      { email: 'priya.sharma@metapharsic.com', name: 'Priya Sharma', role: 'mr', mr_id: 2, territory: 'Mumbai South', password_hash: 'demo' },
      { email: 'amit.patel@metapharsic.com', name: 'Amit Patel', role: 'mr', mr_id: 3, territory: 'Delhi Central', password_hash: 'demo' },
      { email: 'sneha.reddy@metapharsic.com', name: 'Sneha Reddy', role: 'mr', mr_id: 4, territory: 'Bangalore East', password_hash: 'demo' },
      { email: 'vikram.singh@metapharsic.com', name: 'Vikram Singh', role: 'mr', mr_id: 5, territory: 'Hyderabad Central', password_hash: 'demo' },
      { email: 'ananya.iyer@metapharsic.com', name: 'Ananya Iyer', role: 'mr', mr_id: 6, territory: 'Chennai North', password_hash: 'demo' }
    ];

    for (const user of users) {
      try {
        await query(
          `INSERT INTO users (email, name, role, mr_id, territory, password_hash)
           VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT (email) DO NOTHING`,
          [user.email, user.name, user.role, user.mr_id, user.territory, user.password_hash]
        );
      } catch (error: any) {
        if (!error.message.includes('duplicate')) {
          console.error(`Error inserting user ${user.email}:`, error);
        }
      }
    }
    console.log(`✅ Migrated ${users.length} users`);

    console.log('\n✅ Data migration completed successfully!');
    console.log('\n📊 Next Steps:');
    console.log('1. Upload your Excel data via Data Management page');
    console.log('2. Data will be automatically saved to PostgreSQL');
    console.log('3. Use AI Assignment to assign entities to MRs');
    console.log('4. All data will persist across server restarts!');

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
    console.log('\n👋 Database connection closed');
  }
}

// Run migration
migrateData();
