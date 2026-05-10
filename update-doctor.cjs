const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://metaphysic_user:Metapharsic2026!Secure@localhost:5432/metaphysic_crm' });

client.connect()
  .then(() => client.query(`
    INSERT INTO doctors (id, name, clinic, specialty, tier, potential, total_visits, total_orders, total_value, status, area, rating, timings, lat, lng) 
    VALUES (5, 'Dr. Vikram Singh', 'Singh Ortho & Spine Care', 'Orthopedics & Spine Surgery', 'A', 'high', 12, 8, 85000, 'active', 'Habsiguda', 4.8, '10 AM-2 PM & 5-8 PM', 17.4050, 78.4900) 
    ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, specialty = EXCLUDED.specialty, tier = EXCLUDED.tier;
  `))
  .then(() => console.log('Inserted Dr. Vikram Singh'))
  .catch(e => console.error(e.message))
  .finally(() => client.end());
