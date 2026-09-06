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

async function runTask4TestSuite() {
  console.log('Connecting to MongoDB Atlas...');
  await connectDB();
  const testServer = http.createServer(app);
  await new Promise((res) => testServer.listen(0, res));

  const unique = Date.now();
  const testEmail = `task4_user_${unique}@example.com`;
  const adminEmail = `task4_admin_${unique}@example.com`;
  const password = 'Test@123';

  try {
    console.log('\n--- 1. Testing Missing Name Validation ---');
    const resNoName = await makeRequest(testServer, { path: '/api/auth/signup', method: 'POST' }, {
      email: testEmail,
      password: password
    });
    if (resNoName.status !== 400 || !resNoName.body.message.includes('name')) {
      throw new Error(`Expected 400 missing name, got ${resNoName.status}: ${JSON.stringify(resNoName.body)}`);
    }
    console.log('✅ Missing name rejected with 400:', resNoName.body.message);

    console.log('\n--- 2. Testing Missing Email Validation ---');
    const resNoEmail = await makeRequest(testServer, { path: '/api/auth/signup', method: 'POST' }, {
      name: 'Test User',
      password: password
    });
    if (resNoEmail.status !== 400 || !resNoEmail.body.message.includes('email')) {
      throw new Error(`Expected 400 missing email, got ${resNoEmail.status}: ${JSON.stringify(resNoEmail.body)}`);
    }
    console.log('✅ Missing email rejected with 400:', resNoEmail.body.message);

    console.log('\n--- 3. Testing Missing Password Validation ---');
    const resNoPass = await makeRequest(testServer, { path: '/api/auth/signup', method: 'POST' }, {
      name: 'Test User',
      email: testEmail
    });
    if (resNoPass.status !== 400 || !resNoPass.body.message.includes('password')) {
      throw new Error(`Expected 400 missing password, got ${resNoPass.status}: ${JSON.stringify(resNoPass.body)}`);
    }
    console.log('✅ Missing password rejected with 400:', resNoPass.body.message);

    console.log('\n--- 4. Testing Invalid Email Format ---');
    const resBadEmail = await makeRequest(testServer, { path: '/api/auth/signup', method: 'POST' }, {
      name: 'Test User',
      email: 'invalid-email-format',
      password: password
    });
    if (resBadEmail.status !== 400 || !resBadEmail.body.message.includes('valid email')) {
      throw new Error(`Expected 400 invalid email, got ${resBadEmail.status}: ${JSON.stringify(resBadEmail.body)}`);
    }
    console.log('✅ Invalid email rejected with 400:', resBadEmail.body.message);

    console.log('\n--- 5. Testing Signup Security: Escalation prevention (role=admin in signup) ---');
    const resSignup = await makeRequest(testServer, { path: '/api/auth/signup', method: 'POST' }, {
      name: 'Test User',
      email: testEmail,
      password: password,
      role: 'admin' // Attempt privilege escalation during public signup
    });
    if (resSignup.status !== 201 || !resSignup.body.token) {
      throw new Error(`Expected 201 signup, got ${resSignup.status}: ${JSON.stringify(resSignup.body)}`);
    }
    if (resSignup.body.user.role !== 'user') {
      throw new Error(`SECURITY VULNERABILITY: Public signup created role "${resSignup.body.user.role}" instead of "user"!`);
    }
    if (resSignup.body.user.password) {
      throw new Error('SECURITY VULNERABILITY: Password returned in response!');
    }
    const userToken = resSignup.body.token;
    console.log('✅ Public signup successfully created user and enforced role="user" (privilege escalation prevented)');

    console.log('\n--- 6. Testing Duplicate Email Detection ---');
    const resDup = await makeRequest(testServer, { path: '/api/auth/signup', method: 'POST' }, {
      name: 'Test Duplicate',
      email: testEmail,
      password: password
    });
    if (resDup.status !== 400 || !resDup.body.message.includes('already exists')) {
      throw new Error(`Expected 400 duplicate email, got ${resDup.status}: ${JSON.stringify(resDup.body)}`);
    }
    console.log('✅ Duplicate email rejected with 400:', resDup.body.message);

    console.log('\n--- 7. Testing Login (POST /api/auth/login) ---');
    const resLogin = await makeRequest(testServer, { path: '/api/auth/login', method: 'POST' }, {
      email: testEmail,
      password: password
    });
    if (resLogin.status !== 200 || !resLogin.body.token || resLogin.body.user.role !== 'user') {
      throw new Error(`Expected 200 login, got ${resLogin.status}: ${JSON.stringify(resLogin.body)}`);
    }
    if (resLogin.body.user.password) {
      throw new Error('SECURITY VULNERABILITY: Password returned in login response!');
    }
    console.log('✅ User logged in successfully. Token & safe user profile returned.');

    console.log('\n--- 8. Testing Profile (GET /api/auth/profile) ---');
    const resProfile = await makeRequest(testServer, {
      path: '/api/auth/profile',
      method: 'GET',
      headers: { Authorization: `Bearer ${userToken}` }
    });
    if (resProfile.status !== 200 || !resProfile.body.user.id || !resProfile.body.user.email || !resProfile.body.user.role) {
      throw new Error(`Profile endpoint failed: ${JSON.stringify(resProfile.body)}`);
    }
    if (resProfile.body.user.password) {
      throw new Error('SECURITY VULNERABILITY: Password exposed in profile endpoint!');
    }
    console.log('✅ Profile endpoint returns safe information:', resProfile.body.user);

    console.log('\n--- 9. Testing Check-User (GET /api/auth/check-user) ---');
    const resCheckUser = await makeRequest(testServer, {
      path: '/api/auth/check-user',
      method: 'GET',
      headers: { Authorization: `Bearer ${userToken}` }
    });
    if (resCheckUser.status !== 200 || !resCheckUser.body.isAuthenticated) {
      throw new Error(`Check-user failed: ${JSON.stringify(resCheckUser.body)}`);
    }
    console.log('✅ Check-user returns authenticated status: true');

    console.log('\n--- 10. Testing Check-Admin with normal user (Expect 403) ---');
    const resUserAdminCheck = await makeRequest(testServer, {
      path: '/api/auth/check-admin',
      method: 'GET',
      headers: { Authorization: `Bearer ${userToken}` }
    });
    if (resUserAdminCheck.status !== 403) {
      throw new Error(`Expected 403 Forbidden for normal user on /check-admin, got ${resUserAdminCheck.status}`);
    }
    console.log('✅ Normal user blocked from check-admin with 403 Forbidden');

    console.log('\n--- 11. Testing Admin User & Check-Admin (GET /api/auth/check-admin) ---');
    // Create admin directly in database
    const bcrypt = require('bcryptjs');
    const adminHashedPassword = await bcrypt.hash(password, 10);
    const adminUser = await User.create({
      name: 'System Admin',
      email: adminEmail,
      password: adminHashedPassword,
      role: 'admin'
    });

    const resAdminLogin = await makeRequest(testServer, { path: '/api/auth/login', method: 'POST' }, {
      email: adminEmail,
      password: password
    });
    const adminToken = resAdminLogin.body.token;

    const resAdminCheck = await makeRequest(testServer, {
      path: '/api/auth/check-admin',
      method: 'GET',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    if (resAdminCheck.status !== 200 || !resAdminCheck.body.isAdmin) {
      throw new Error(`Check-admin failed for admin user: ${JSON.stringify(resAdminCheck.body)}`);
    }
    console.log('✅ Admin user authorized on check-admin with isAdmin: true');

  } finally {
    await User.deleteMany({ email: { $in: [testEmail, adminEmail] } });
    testServer.close();
  }

  console.log('\n🎉 ALL WEEK 2 TASK 4 REQUIREMENTS VERIFIED WITH 100% PASS RATE!');
  process.exit(0);
}

runTask4TestSuite().catch(err => {
  console.error('❌ Task 4 Test Suite Failed:', err);
  process.exit(1);
});
