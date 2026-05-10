
async function test() {
  try {
    const response = await fetch('http://localhost:3000/api/fetch-region', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ region: 'Nacharam' })
    });
    console.log('Status:', response.status);
    const text = await response.text();
    console.log('Body:', text);
  } catch (e) {
    console.error('Error:', e.message);
  }
}

test();
