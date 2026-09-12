process.env.NODE_ENV = 'test';
require('dotenv').config();

const http = require('http');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const { app } = require('../server');
const connectDB = require('../config/db');
const User = require('../models/User');
const Memory = require('../models/Memory');

const JWT_SECRET = process.env.JWT_SECRET || 'ai-personal-archive-super-secret-key-2026-development-secure-token';

function makeRequest(server, options, bodyData = null) {
  return new Promise((resolve, reject) => {
    const port = server.address().port;
    const postData = bodyData ? JSON.stringify(bodyData) : '';
    const req = http.request({
      hostname: '127.0.0.1',
      port: port,
      path: options.path,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(postData ? { 'Content-Length': Buffer.byteLength(postData) } : {}),
        ...(options.headers || {})
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        let json;
        try {
          json = JSON.parse(data);
        } catch {
          json = data;
        }
        resolve({ status: res.statusCode, body: json });
      });
    });

    req.on('error', reject);
    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

async function runFullDiagnostics() {
  console.log('================================================================');
  console.log('🔍 AI PERSONAL ARCHIVE - COMPREHENSIVE ERROR & SYSTEM TEST SUITE');
  console.log('================================================================\n');

  let passedTests = 0;
  let failedTests = 0;
  const errors = [];

  function test(name, passCondition, failureDetail = '') {
    if (passCondition) {
      console.log(`  ✅ [PASS] ${name}`);
      passedTests++;
    } else {
      console.error(`  ❌ [FAIL] ${name}`);
      if (failureDetail) console.error(`     ↳ Details: ${failureDetail}`);
      failedTests++;
      errors.push({ name, detail: failureDetail });
    }
  }

  // 1. Connect DB
  console.log('📡 Step 1: Testing Database Connection...');
  let dbConnected = false;
  try {
    const conn = await connectDB();
    if (mongoose.connection.readyState === 1) {
      dbConnected = true;
      test('MongoDB Atlas Database Connection established', true);
    } else {
      test('MongoDB Atlas Database Connection established', false, `Mongoose readyState: ${mongoose.connection.readyState}`);
    }
  } catch (err) {
    test('MongoDB Atlas Database Connection established', false, err.message);
  }

  // Start ephemeral HTTP server
  const testServer = http.createServer(app);
  await new Promise((res) => testServer.listen(0, '127.0.0.1', res));
  const serverPort = testServer.address().port;
  console.log(`🚀 Ephemeral Test Server active on port ${serverPort}\n`);

  const unique = Date.now();
  const testUserEmail = `diag_user_${unique}@example.com`;
  const testAdminEmail = `diag_admin_${unique}@example.com`;
  const testPassword = 'Password123!';
  let normalUserToken = '';
  let adminUserToken = '';
  let normalUserId = '';
  let createdMemoryId = '';

  try {
    // -------------------------------------------------------------
    // SECTION 1: Base & Health Routes
    // -------------------------------------------------------------
    console.log('📋 Step 2: Testing Base & System Health Endpoints...');
    const rootRes = await makeRequest(testServer, { path: '/', method: 'GET' });
    test('GET / returns 200 with API metadata', rootRes.status === 200 && rootRes.body.success === true, JSON.stringify(rootRes.body));

    const healthRes = await makeRequest(testServer, { path: '/api/health', method: 'GET' });
    test('GET /api/health returns 200 with healthy status', healthRes.status === 200 && healthRes.body.status === 'healthy', JSON.stringify(healthRes.body));

    const notFoundRes = await makeRequest(testServer, { path: '/api/non-existent-endpoint', method: 'GET' });
    test('GET /api/non-existent-endpoint returns 404 Route Not Found', notFoundRes.status === 404 && notFoundRes.body.success === false, JSON.stringify(notFoundRes.body));

    // -------------------------------------------------------------
    // SECTION 2: Auth Validation & Signup
    // -------------------------------------------------------------
    console.log('\n🔐 Step 3: Testing Authentication & Signup Validation...');

    // Missing fields
    const signupNoName = await makeRequest(testServer, { path: '/api/auth/signup', method: 'POST' }, { email: testUserEmail, password: testPassword });
    test('POST /api/auth/signup without name returns 400', signupNoName.status === 400 && signupNoName.body.message.includes('name'), JSON.stringify(signupNoName.body));

    const signupNoEmail = await makeRequest(testServer, { path: '/api/auth/signup', method: 'POST' }, { name: 'Diag User', password: testPassword });
    test('POST /api/auth/signup without email returns 400', signupNoEmail.status === 400 && signupNoEmail.body.message.includes('email'), JSON.stringify(signupNoEmail.body));

    const signupNoPass = await makeRequest(testServer, { path: '/api/auth/signup', method: 'POST' }, { name: 'Diag User', email: testUserEmail });
    test('POST /api/auth/signup without password returns 400', signupNoPass.status === 400 && signupNoPass.body.message.includes('password'), JSON.stringify(signupNoPass.body));

    const signupShortPass = await makeRequest(testServer, { path: '/api/auth/signup', method: 'POST' }, { name: 'Diag User', email: testUserEmail, password: '123' });
    test('POST /api/auth/signup with short password (<6 chars) returns 400', signupShortPass.status === 400 && signupShortPass.body.message.includes('6 characters'), JSON.stringify(signupShortPass.body));

    const signupInvalidEmail = await makeRequest(testServer, { path: '/api/auth/signup', method: 'POST' }, { name: 'Diag User', email: 'not-an-email', password: testPassword });
    test('POST /api/auth/signup with invalid email format returns 400', signupInvalidEmail.status === 400 && signupInvalidEmail.body.message.includes('valid email'), JSON.stringify(signupInvalidEmail.body));

    // Valid Signup (Testing privilege escalation prevention: role='admin' requested in body should be ignored and defaulted to 'user')
    const signupValid = await makeRequest(testServer, { path: '/api/auth/signup', method: 'POST' }, {
      name: 'Diagnostic User',
      email: testUserEmail,
      password: testPassword,
      role: 'admin'
    });
    normalUserToken = signupValid.body.token;
    normalUserId = signupValid.body.user?.id;
    test(
      'POST /api/auth/signup successfully registers user, generates JWT, and enforces role="user"',
      signupValid.status === 201 && signupValid.body.token && signupValid.body.user?.role === 'user' && !signupValid.body.user?.password,
      JSON.stringify(signupValid.body)
    );

    // Duplicate signup
    const signupDup = await makeRequest(testServer, { path: '/api/auth/signup', method: 'POST' }, {
      name: 'Diagnostic User Duplicate',
      email: testUserEmail,
      password: testPassword
    });
    test('POST /api/auth/signup with duplicate email returns 400', signupDup.status === 400 && signupDup.body.message.includes('already exists'), JSON.stringify(signupDup.body));

    // -------------------------------------------------------------
    // SECTION 3: Login & Profile Operations
    // -------------------------------------------------------------
    console.log('\n🔑 Step 4: Testing Login & Token Verification...');

    const loginWrongPass = await makeRequest(testServer, { path: '/api/auth/login', method: 'POST' }, {
      email: testUserEmail,
      password: 'WrongPassword999!'
    });
    test('POST /api/auth/login with incorrect password returns 401', loginWrongPass.status === 401 && loginWrongPass.body.message.includes('Invalid email or password'), JSON.stringify(loginWrongPass.body));

    const loginNonExistent = await makeRequest(testServer, { path: '/api/auth/login', method: 'POST' }, {
      email: `non_existent_${unique}@example.com`,
      password: testPassword
    });
    test('POST /api/auth/login with unknown email returns 401', loginNonExistent.status === 401 && loginNonExistent.body.message.includes('Invalid email or password'), JSON.stringify(loginNonExistent.body));

    const loginValid = await makeRequest(testServer, { path: '/api/auth/login', method: 'POST' }, {
      email: testUserEmail,
      password: testPassword
    });
    test(
      'POST /api/auth/login with correct credentials returns 200, JWT token, and sanitized user',
      loginValid.status === 200 && loginValid.body.token && loginValid.body.user?.email === testUserEmail && !loginValid.body.user?.password,
      JSON.stringify(loginValid.body)
    );

    // Profile without token
    const profileNoToken = await makeRequest(testServer, { path: '/api/auth/profile', method: 'GET' });
    test('GET /api/auth/profile without token returns 401', profileNoToken.status === 401 && profileNoToken.body.message.includes('token missing'), JSON.stringify(profileNoToken.body));

    // Profile with valid token
    const profileValid = await makeRequest(testServer, {
      path: '/api/auth/profile',
      method: 'GET',
      headers: { Authorization: `Bearer ${normalUserToken}` }
    });
    test(
      'GET /api/auth/profile with Bearer token returns 200 and user profile',
      profileValid.status === 200 && profileValid.body.user?.email === testUserEmail && !profileValid.body.user?.password,
      JSON.stringify(profileValid.body)
    );

    // Profile with lowercase 'bearer' token (case-insensitivity)
    const profileBearerCase = await makeRequest(testServer, {
      path: '/api/auth/profile',
      method: 'GET',
      headers: { Authorization: `bearer ${normalUserToken}` }
    });
    test('GET /api/auth/profile handles lowercase "bearer <token>" header format', profileBearerCase.status === 200, JSON.stringify(profileBearerCase.body));

    // Check user endpoint
    const checkUserRes = await makeRequest(testServer, {
      path: '/api/auth/check-user',
      method: 'GET',
      headers: { Authorization: `Bearer ${normalUserToken}` }
    });
    test('GET /api/auth/check-user returns isAuthenticated: true', checkUserRes.status === 200 && checkUserRes.body.isAuthenticated === true, JSON.stringify(checkUserRes.body));

    // -------------------------------------------------------------
    // SECTION 4: Role-Based Authorization
    // -------------------------------------------------------------
    console.log('\n🛡️ Step 5: Testing Role-Based Authorization & Admin Controls...');

    // Normal user attempting admin check
    const checkAdminNormal = await makeRequest(testServer, {
      path: '/api/auth/check-admin',
      method: 'GET',
      headers: { Authorization: `Bearer ${normalUserToken}` }
    });
    test('GET /api/auth/check-admin for normal user returns 403 Forbidden', checkAdminNormal.status === 403, JSON.stringify(checkAdminNormal.body));

    // Normal user attempting to list all users
    const usersListNormal = await makeRequest(testServer, {
      path: '/api/users',
      method: 'GET',
      headers: { Authorization: `Bearer ${normalUserToken}` }
    });
    test('GET /api/users for normal user returns 403 Forbidden', usersListNormal.status === 403, JSON.stringify(usersListNormal.body));

    // Seed admin user directly in DB
    const adminSalt = await bcrypt.genSalt(10);
    const adminHashedPassword = await bcrypt.hash(testPassword, adminSalt);
    const adminDoc = await User.create({
      name: 'System Admin Diag',
      email: testAdminEmail,
      password: adminHashedPassword,
      role: 'admin'
    });

    // Admin login
    const adminLogin = await makeRequest(testServer, { path: '/api/auth/login', method: 'POST' }, {
      email: testAdminEmail,
      password: testPassword
    });
    adminUserToken = adminLogin.body.token;

    // Admin check
    const checkAdminSuccess = await makeRequest(testServer, {
      path: '/api/auth/check-admin',
      method: 'GET',
      headers: { Authorization: `Bearer ${adminUserToken}` }
    });
    test('GET /api/auth/check-admin for admin user returns 200 and isAdmin: true', checkAdminSuccess.status === 200 && checkAdminSuccess.body.isAdmin === true, JSON.stringify(checkAdminSuccess.body));

    // Admin fetching user list
    const adminUsersList = await makeRequest(testServer, {
      path: '/api/users',
      method: 'GET',
      headers: { Authorization: `Bearer ${adminUserToken}` }
    });
    test(
      'GET /api/users for admin returns 200 and array of users',
      adminUsersList.status === 200 && Array.isArray(adminUsersList.body.data) && adminUsersList.body.count >= 2,
      JSON.stringify(adminUsersList.body)
    );

    // Admin fetching single user by ID
    const adminGetUser = await makeRequest(testServer, {
      path: `/api/users/${normalUserId}`,
      method: 'GET',
      headers: { Authorization: `Bearer ${adminUserToken}` }
    });
    test('GET /api/users/:id for admin returns 200 and user data', adminGetUser.status === 200 && adminGetUser.body.data?.email === testUserEmail, JSON.stringify(adminGetUser.body));

    // Admin updating user
    const adminUpdateUser = await makeRequest(testServer, {
      path: `/api/users/${normalUserId}`,
      method: 'PUT',
      headers: { Authorization: `Bearer ${adminUserToken}` }
    }, { name: 'Updated Diagnostic User' });
    test('PUT /api/users/:id updates user name successfully', adminUpdateUser.status === 200 && adminUpdateUser.body.data?.name === 'Updated Diagnostic User', JSON.stringify(adminUpdateUser.body));

    // -------------------------------------------------------------
    // SECTION 5: Memory CRUD & Search/Filter
    // -------------------------------------------------------------
    console.log('\n🧠 Step 6: Testing Memory CRUD & Search/Filter Endpoints...');

    // Memory creation without title
    const memNoTitle = await makeRequest(testServer, {
      path: '/api/memories',
      method: 'POST',
      headers: { Authorization: `Bearer ${normalUserToken}` }
    }, { content: 'Content without title' });
    test('POST /api/memories without title returns 400', memNoTitle.status === 400 && memNoTitle.body.message.includes('title'), JSON.stringify(memNoTitle.body));

    // Memory creation without content
    const memNoContent = await makeRequest(testServer, {
      path: '/api/memories',
      method: 'POST',
      headers: { Authorization: `Bearer ${normalUserToken}` }
    }, { title: 'Title without content' });
    test('POST /api/memories without content returns 400', memNoContent.status === 400 && memNoContent.body.message.includes('content'), JSON.stringify(memNoContent.body));

    // Valid memory creation
    const memCreate = await makeRequest(testServer, {
      path: '/api/memories',
      method: 'POST',
      headers: { Authorization: `Bearer ${normalUserToken}` }
    }, {
      title: 'Stanford Machine Learning Certificate',
      content: 'Completed advanced machine learning specialization covering deep neural networks and NLP algorithms.',
      type: 'certificate',
      category: 'Education',
      tags: ['machine-learning', 'stanford', 'ai'],
      importance: 5,
      isFavorite: true
    });
    createdMemoryId = memCreate.body.data?._id;
    test(
      'POST /api/memories creates new memory record associated with user',
      memCreate.status === 201 && memCreate.body.data?.title === 'Stanford Machine Learning Certificate' && memCreate.body.data?.tags?.length === 3,
      JSON.stringify(memCreate.body)
    );

    // Get all memories for user
    const memGetAll = await makeRequest(testServer, {
      path: '/api/memories',
      method: 'GET',
      headers: { Authorization: `Bearer ${normalUserToken}` }
    });
    test(
      'GET /api/memories lists all memories for authenticated user',
      memGetAll.status === 200 && Array.isArray(memGetAll.body.data) && memGetAll.body.count >= 1,
      JSON.stringify(memGetAll.body)
    );

    // Search query
    const memSearch = await makeRequest(testServer, {
      path: '/api/memories?search=Stanford',
      method: 'GET',
      headers: { Authorization: `Bearer ${normalUserToken}` }
    });
    test('GET /api/memories?search=Stanford returns matched record', memSearch.status === 200 && memSearch.body.count >= 1, JSON.stringify(memSearch.body));

    // Category filter
    const memCat = await makeRequest(testServer, {
      path: '/api/memories?category=Education',
      method: 'GET',
      headers: { Authorization: `Bearer ${normalUserToken}` }
    });
    test('GET /api/memories?category=Education returns category filtered records', memCat.status === 200 && memCat.body.count >= 1, JSON.stringify(memCat.body));

    // Type filter
    const memType = await makeRequest(testServer, {
      path: '/api/memories?type=certificate',
      method: 'GET',
      headers: { Authorization: `Bearer ${normalUserToken}` }
    });
    test('GET /api/memories?type=certificate returns type filtered records', memType.status === 200 && memType.body.count >= 1, JSON.stringify(memType.body));

    // Get single memory by ID
    const memGetSingle = await makeRequest(testServer, {
      path: `/api/memories/${createdMemoryId}`,
      method: 'GET',
      headers: { Authorization: `Bearer ${normalUserToken}` }
    });
    test('GET /api/memories/:id returns the single memory item', memGetSingle.status === 200 && memGetSingle.body.data?._id === createdMemoryId, JSON.stringify(memGetSingle.body));

    // Invalid ID format
    const memInvalidId = await makeRequest(testServer, {
      path: '/api/memories/invalid-object-id',
      method: 'GET',
      headers: { Authorization: `Bearer ${normalUserToken}` }
    });
    test('GET /api/memories/invalid-id returns 400 Invalid ID format', memInvalidId.status === 400 && memInvalidId.body.message.includes('Invalid memory ID format'), JSON.stringify(memInvalidId.body));

    // Update memory
    const memUpdate = await makeRequest(testServer, {
      path: `/api/memories/${createdMemoryId}`,
      method: 'PUT',
      headers: { Authorization: `Bearer ${normalUserToken}` }
    }, {
      title: 'Stanford Machine Learning Specialization (Honors)',
      importance: 5
    });
    test(
      'PUT /api/memories/:id updates memory fields successfully',
      memUpdate.status === 200 && memUpdate.body.data?.title === 'Stanford Machine Learning Specialization (Honors)',
      JSON.stringify(memUpdate.body)
    );

    // Delete memory
    const memDelete = await makeRequest(testServer, {
      path: `/api/memories/${createdMemoryId}`,
      method: 'DELETE',
      headers: { Authorization: `Bearer ${normalUserToken}` }
    });
    test('DELETE /api/memories/:id deletes memory successfully', memDelete.status === 200 && memDelete.body.success === true, JSON.stringify(memDelete.body));

    // Verify deleted memory returns 404
    const memVerifyDeleted = await makeRequest(testServer, {
      path: `/api/memories/${createdMemoryId}`,
      method: 'GET',
      headers: { Authorization: `Bearer ${normalUserToken}` }
    });
    test('GET /api/memories/:id on deleted memory returns 404', memVerifyDeleted.status === 404, JSON.stringify(memVerifyDeleted.body));

    // -------------------------------------------------------------
    // SECTION 6: Token Security & Expiry Edge Cases
    // -------------------------------------------------------------
    console.log('\n🔒 Step 7: Testing Security Edge Cases & Token Verification...');

    // Expired Token
    const expiredToken = jwt.sign({ id: normalUserId, role: 'user' }, JWT_SECRET, { expiresIn: '-1s' });
    const resExpired = await makeRequest(testServer, {
      path: '/api/auth/profile',
      method: 'GET',
      headers: { Authorization: `Bearer ${expiredToken}` }
    });
    test('Expired JWT token returns 401 with "token has expired" message', resExpired.status === 401 && resExpired.body.message.includes('expired'), JSON.stringify(resExpired.body));

    // Malformed Token
    const resMalformed = await makeRequest(testServer, {
      path: '/api/auth/profile',
      method: 'GET',
      headers: { Authorization: 'Bearer this.is.not.a.valid.jwt' }
    });
    test('Malformed JWT token returns 401 with "invalid token" message', resMalformed.status === 401 && resMalformed.body.message.includes('invalid token'), JSON.stringify(resMalformed.body));

    // Wrong Secret Token
    const wrongSecretToken = jwt.sign({ id: normalUserId, role: 'user' }, 'completely-wrong-secret-key-12345');
    const resWrongSecret = await makeRequest(testServer, {
      path: '/api/auth/profile',
      method: 'GET',
      headers: { Authorization: `Bearer ${wrongSecretToken}` }
    });
    test('JWT signed with untrusted secret returns 401', resWrongSecret.status === 401 && resWrongSecret.body.message.includes('invalid token'), JSON.stringify(resWrongSecret.body));

  } finally {
    // Clean up test data
    console.log('\n🧹 Cleaning up test artifacts from database...');
    try {
      await User.deleteMany({ email: { $in: [testUserEmail, testAdminEmail] } });
      if (createdMemoryId && mongoose.Types.ObjectId.isValid(createdMemoryId)) {
        await Memory.findByIdAndDelete(createdMemoryId);
      }
      console.log('✅ Test data cleaned up.');
    } catch (cleanErr) {
      console.warn('⚠️ Cleanup warning:', cleanErr.message);
    }

    testServer.close();
    await mongoose.disconnect();
  }

  // Final summary
  console.log('\n================================================================');
  console.log(`🏁 SYSTEM DIAGNOSTIC SUMMARY: ${passedTests} PASSED, ${failedTests} FAILED`);
  console.log('================================================================\n');

  if (failedTests > 0) {
    console.error('❌ Detected Errors:');
    errors.forEach((err, idx) => {
      console.error(`   ${idx + 1}. ${err.name} -> ${err.detail}`);
    });
    process.exit(1);
  } else {
    console.log('🎉 ALL BACKEND API ENDPOINTS, MIDDLEWARE & DATABASE OPERATIONS PASSED WITH ZERO ERRORS!');
    process.exit(0);
  }
}

runFullDiagnostics().catch(err => {
  console.error('💥 Fatal Diagnostic Runner Error:', err);
  process.exit(1);
});
