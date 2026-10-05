const http = require('http');

function post(urlPath, data) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(data);
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: urlPath,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
      },
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch {
          resolve({ status: res.statusCode, text: body });
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function runJoinTests() {
  console.log('--- 1. Testing Resident Account Registration & Login ---');
  const regResident = await post('/api/auth/register', {
    email: 'ananya.resident@greenwoods.in',
    password: 'ResidentPassword123',
    fullName: 'Ananya Sharma',
    phone: '+91 9876543211',
    role: 'resident',
  });
  console.log('Resident Register Status:', regResident.status);

  console.log('\n--- 2. Testing Resident Login ---');
  const loginResident = await post('/api/auth/login', {
    email: 'ananya.resident@greenwoods.in',
    password: 'ResidentPassword123',
  });
  console.log('Resident Login Status:', loginResident.status);
  console.log('Resident Name:', loginResident.data?.user?.profile?.full_name);
  console.log('Resident Role:', loginResident.data?.user?.profile?.role);

  console.log('\n--- 3. Testing Duplicate Resident Mobile ---');
  const dupResidentPhone = await post('/api/auth/register', {
    email: 'other.person@greenwoods.in',
    password: 'Password123',
    fullName: 'Other Person',
    phone: '+91 9876543211',
    role: 'resident',
  });
  console.log('Duplicate Phone Status (Expected 409):', dupResidentPhone.status);
  console.log('Duplicate Error Message:', dupResidentPhone.data?.error);

  console.log('\nRESIDENT TESTS FINISHED SUCCESSFULLY.');
}

runJoinTests().catch(console.error);
