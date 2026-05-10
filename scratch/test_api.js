
async function test() {
  try {
    const response = await fetch('http://localhost:3000/api/mrs');
    console.log('Status:', response.status);
    const text = await response.text();
    console.log('Body:', text.substring(0, 100));
  } catch (e) {
    console.error('Error:', e.message);
  }
}

test();
