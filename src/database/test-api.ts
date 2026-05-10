
import fetch from 'node-fetch';

async function testApi() {
  console.log('🔗 Testing API /api/doctor-visits...');
  try {
    const res = await fetch('http://localhost:3000/api/doctor-visits');
    const data = await res.json();
    
    console.log(`\n✅ Received ${data.length} visits.`);
    
    const vasavi = data.find(v => v.entity_name?.includes('Vasavi'));
    if (vasavi) {
      console.log('\n🔎 Sri Vasavi Record in API:');
      console.log(JSON.stringify(vasavi, null, 2));
    } else {
      console.log('\n❌ Sri Vasavi not found in API response.');
      console.log('Sample record:', JSON.stringify(data[0], null, 2));
    }
  } catch (err) {
    console.error('❌ API Test failed:', err.message);
    console.log('Make sure the server is running on port 3000.');
  }
}

testApi();
