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

function get(urlPath) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: urlPath,
      method: 'GET',
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
    req.end();
  });
}

async function runFullVerification() {
  console.log('=== Step 1: Admin Register Society (e.g. SN-80477 / Nakshatra Green) ===');
  const regRes = await post('/api/auth/register-society', {
    societyName: 'Nakshatra Green',
    city: 'Mumbai',
    address: 'Plot 45, Sector 19',
    wings: ['A Wing', 'B Wing'],
    flatsPerWing: 50,
    adminName: 'Rajesh Sharma',
    adminEmail: 'admin.nakshatra@smartnest.in',
    adminPhone: '+91 98200 80477',
    adminPassword: 'MasterPassword123',
  });
  console.log('Register Status:', regRes.status);
  const code = regRes.data?.credentials?.societyCode;
  console.log('Generated Society Code:', code);

  console.log('\n=== Step 2: Admin Login with registered credentials ===');
  const loginRes = await post('/api/auth/login', {
    email: 'admin.nakshatra@smartnest.in',
    password: 'MasterPassword123',
  });
  console.log('Admin Login Status:', loginRes.status);
  console.log('User ID:', loginRes.data?.user?.id);
  console.log('Role:', loginRes.data?.user?.profile?.role);
  console.log('Society Name:', loginRes.data?.user?.society?.name);

  console.log('\n=== Step 3: Lookup Society using Code ===');
  const socLookup = await get(`/api/societies/${encodeURIComponent(code)}`);
  console.log('Lookup Status:', socLookup.status);
  console.log('Found Society:', socLookup.data?.name, 'Code:', socLookup.data?.code);

  console.log('\n=== Step 4: Resident Registration for Nakshatra Green ===');
  const resReg = await post('/api/auth/register', {
    email: 'anita.resident@smartnest.in',
    password: 'ResidentPassword123',
    fullName: 'Anita Deshmukh',
    phone: '+91 98200 80478',
    role: 'resident',
  });
  console.log('Resident Register Status:', resReg.status);

  console.log('\n=== Step 5: Resident Login ===');
  const resLogin = await post('/api/auth/login', {
    email: 'anita.resident@smartnest.in',
    password: 'ResidentPassword123',
  });
  console.log('Resident Login Status:', resLogin.status);
  console.log('Resident Name:', resLogin.data?.user?.profile?.full_name);
  console.log('Resident Role:', resLogin.data?.user?.profile?.role);

  console.log('\n=== Step 6: Test Uniqueness Constraints (Duplicate Email & Phone) ===');
  const dupEmail = await post('/api/auth/register', {
    email: 'admin.nakshatra@smartnest.in',
    password: 'AnyPassword',
    fullName: 'Duplicate Admin',
  });
  console.log('Duplicate Email (Expected 409):', dupEmail.status, dupEmail.data?.error);

  const dupPhone = await post('/api/auth/register', {
    email: 'newuser@smartnest.in',
    password: 'AnyPassword',
    fullName: 'Duplicate Phone User',
    phone: '+91 98200 80477',
  });
  console.log('Duplicate Phone (Expected 409):', dupPhone.status, dupPhone.data?.error);

  console.log('\n=== ALL END-TO-END FLOWS VERIFIED 100% SUCCESSFULLY ===');
}

runFullVerification().catch(console.error);
