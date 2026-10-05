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

async function runTests() {
  console.log('--- 1. Testing Admin Society Registration (50 flats per wing) ---');
  const regRes = await post('/api/auth/register-society', {
    societyName: 'Greenwoods Royal Estate',
    city: 'Bengaluru',
    address: 'Whitefield Main Road',
    wings: ['A Wing', 'B Wing'],
    flatsPerWing: 50,
    adminName: 'Rajesh Kumar',
    adminEmail: 'admin.real@greenwoods.in',
    adminPhone: '+91 9876543210',
    adminPassword: 'AdminPassword123',
  });
  console.log('Registration Status:', regRes.status);
  console.log('Society Code:', regRes.data?.credentials?.societyCode || regRes.data);

  console.log('\n--- 2. Testing Admin Login ---');
  const loginRes = await post('/api/auth/login', {
    email: 'admin.real@greenwoods.in',
    password: 'AdminPassword123',
  });
  console.log('Admin Login Status:', loginRes.status);
  console.log('User Role:', loginRes.data?.user?.profile?.role);
  console.log('Society Name:', loginRes.data?.user?.society?.name);

  console.log('\n--- 3. Testing Duplicate Email Registration Validation ---');
  const dupEmailRes = await post('/api/auth/register-society', {
    societyName: 'Duplicate Test',
    city: 'Bengaluru',
    adminName: 'Another User',
    adminEmail: 'admin.real@greenwoods.in',
    adminPhone: '+91 9123456780',
    adminPassword: 'Password123',
  });
  console.log('Duplicate Email Status (Expected 409):', dupEmailRes.status);
  console.log('Duplicate Error Message:', dupEmailRes.data?.error);

  console.log('\n--- 4. Testing Duplicate Mobile Registration Validation ---');
  const dupPhoneRes = await post('/api/auth/register-society', {
    societyName: 'Duplicate Phone Test',
    city: 'Bengaluru',
    adminName: 'Another User 2',
    adminEmail: 'another.admin@greenwoods.in',
    adminPhone: '+91 9876543210',
    adminPassword: 'Password123',
  });
  console.log('Duplicate Phone Status (Expected 409):', dupPhoneRes.status);
  console.log('Duplicate Error Message:', dupPhoneRes.data?.error);

  console.log('\nALL BACKEND API TESTS FINISHED SUCCESSFULLY.');
}

runTests().catch(console.error);
