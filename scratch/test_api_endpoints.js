const http = require('http');
require('dotenv').config();

const { app } = require('../server');
const connectDB = require('../config/db');
const User = require('../models/User');

function makeRequest(server, options, bodyData = null) {
  return new Promise((resolve, reject) => {
    const port = server.address().port;
    const req = http.request({
      hostname: '127.0.0.1',
      port: port,
      path: options.path,
      method: options.method,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        let json;
        try {
          json = JSON.parse(data);
        } catch (e) {
          json = data;
        }
        resolve({ status: res.statusCode, body: json });
      });
    });

    req.on('error', reject);

    if (bodyData) {
      req.write(JSON.stringify(bodyData));
    }
    req.end();
  });
}

async function runApiTests() {
  await connectDB();
  const testServer = http.createServer(app);
  await new Promise((res) => testServer.listen(0, res));

  const uniqueId = Date.now();
  const userEmail = `api_user_${uniqueId}@test.com`;
  const adminEmail = `api_admin_${uniqueId}@test.com`;
  const password = 'SecurePassword123!';

  try {
    console.log('--- 1. Testing Signup with missing fields ---');
    const resMissing = await makeRequest(testServer, { path: '/api/auth/signup', method: 'POST' }, { email: userEmail });
    if (resMissing.status !== 400) throw new Error(`Expected 400 for missing fields, got ${resMissing.status}`);
    console.log('✅ Missing fields returns 400:', resMissing.body.message);

    console.log('\n--- 2. Testing Signup for Normal User ---');
    const resSignupUser = await makeRequest(testServer, { path: '/api/auth/signup', method: 'POST' }, {
      name: 'Test Regular User',
      email: userEmail,
      password: password,
      role: 'user'
    });
    if (resSignupUser.status !== 201 || !resSignupUser.body.token) throw new Error('User signup failed');
    if (resSignupUser.body.user.password) throw new Error('Password returned in signup response!');
    const userToken = resSignupUser.body.token;
    console.log('✅ User registered successfully. Token generated, password excluded.');

    console.log('\n--- 3. Testing Duplicate Email Signup ---');
    const resDup = await makeRequest(testServer, { path: '/api/auth/signup', method: 'POST' }, {
      name: 'Duplicate',
      email: userEmail,
      password: password
    });
    if (resDup.status !== 400) throw new Error(`Expected 400 for duplicate email, got ${resDup.status}`);
    console.log('✅ Duplicate email returns 400:', resDup.body.message);

    console.log('\n--- 4. Testing Login with Invalid Credentials ---');
    const resBadLogin = await makeRequest(testServer, { path: '/api/auth/login', method: 'POST' }, {
      email: userEmail,
      password: 'WrongPassword'
    });
    if (resBadLogin.status !== 401) throw new Error(`Expected 401 for wrong password, got ${resBadLogin.status}`);
    console.log('✅ Invalid password returns 401:', resBadLogin.body.message);

    console.log('\n--- 5. Testing Login with Valid Credentials ---');
    const resLogin = await makeRequest(testServer, { path: '/api/auth/login', method: 'POST' }, {
      email: userEmail,
      password: password
    });
    if (resLogin.status !== 200 || !resLogin.body.token) throw new Error('Login failed');
    if (resLogin.body.user.password) throw new Error('Password returned in login response!');
    console.log('✅ Login successful. JWT token received.');

    console.log('\n--- 6. Testing Protected /api/auth/profile without token ---');
    const resNoToken = await makeRequest(testServer, { path: '/api/auth/profile', method: 'GET' });
    if (resNoToken.status !== 401) throw new Error(`Expected 401 for missing token, got ${resNoToken.status}`);
    console.log('✅ Missing token on protected route returns 401:', resNoToken.body.message);

    console.log('\n--- 7. Testing Protected /api/auth/profile with valid token ---');
    const resProfile = await makeRequest(testServer, {
      path: '/api/auth/profile',
      method: 'GET',
      headers: { Authorization: `Bearer ${userToken}` }
    });
    if (resProfile.status !== 200 || !resProfile.body.user) throw new Error('Profile fetch failed');
    console.log('✅ Profile route returns authenticated user:', resProfile.body.user.email);

    console.log('\n--- 8. Testing Admin Access restriction for Normal User ---');
    const resUserCheckAdmin = await makeRequest(testServer, {
      path: '/api/auth/check-admin',
      method: 'GET',
      headers: { Authorization: `Bearer ${userToken}` }
    });
    if (resUserCheckAdmin.status !== 403) throw new Error(`Expected 403 for non-admin on /check-admin, got ${resUserCheckAdmin.status}`);
    console.log('✅ Normal user blocked from check-admin with 403 Forbidden');

    const resUserUsersList = await makeRequest(testServer, {
      path: '/api/users',
      method: 'GET',
      headers: { Authorization: `Bearer ${userToken}` }
    });
    if (resUserUsersList.status !== 403) throw new Error(`Expected 403 for non-admin on /api/users, got ${resUserUsersList.status}`);
    console.log('✅ Normal user blocked from /api/users with 403 Forbidden');

    console.log('\n--- 9. Testing Signup & Admin Access for Admin User ---');
    const resSignupAdmin = await makeRequest(testServer, { path: '/api/auth/signup', method: 'POST' }, {
      name: 'Test Admin User',
      email: adminEmail,
      password: password,
      role: 'admin'
    });
    const adminToken = resSignupAdmin.body.token;

    const resAdminCheck = await makeRequest(testServer, {
      path: '/api/auth/check-admin',
      method: 'GET',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    if (resAdminCheck.status !== 200 || !resAdminCheck.body.isAdmin) throw new Error('Admin check failed');
    console.log('✅ Admin user authorized on check-admin:', resAdminCheck.body.isAdmin);

    const resAdminUsersList = await makeRequest(testServer, {
      path: '/api/users',
      method: 'GET',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    if (resAdminUsersList.status !== 200 || !Array.isArray(resAdminUsersList.body.data)) throw new Error('Admin fetching users failed');
    console.log('✅ Admin successfully accessed /api/users, user count:', resAdminUsersList.body.count);

    console.log('\n--- 10. Testing Logout Endpoint ---');
    const resLogout = await makeRequest(testServer, { path: '/api/auth/logout', method: 'POST' });
    if (resLogout.status !== 200) throw new Error('Logout failed');
    console.log('✅ Logout endpoint succeeded:', resLogout.body.message);

  } finally {
    await User.deleteMany({ email: { $in: [userEmail, adminEmail] } });
    testServer.close();
  }

  console.log('\n🎉 ALL 10 END-TO-END HTTP API TEST CASES PASSED WITH 0 ERRORS!');
  process.exit(0);
}

runApiTests().catch(err => {
  console.error('❌ API Test Failed:', err);
  process.exit(1);
});
