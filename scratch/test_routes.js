/**
 * Route Architecture Verification Test
 * Tests all 15 required routes + root & health check
 */

process.env.NODE_ENV = 'test';
const { app } = require('../server');
const http = require('http');

const server = http.createServer(app);

const routesToTest = [
  // Health & Root
  { method: 'GET', path: '/', expectedStatus: 200, name: 'Root Endpoint' },
  { method: 'GET', path: '/api/health', expectedStatus: 200, name: 'Health Check' },

  // Auth Routes (6)
  { method: 'POST', path: '/api/auth/signup', expectedStatus: 201, body: { name: 'Test', email: 'test@example.com', password: 'password123' }, name: 'POST /api/auth/signup' },
  { method: 'POST', path: '/api/auth/login', expectedStatus: 200, body: { email: 'test@example.com', password: 'password123' }, name: 'POST /api/auth/login' },
  { method: 'POST', path: '/api/auth/logout', expectedStatus: 200, name: 'POST /api/auth/logout' },
  { method: 'GET', path: '/api/auth/profile', expectedStatus: 200, name: 'GET /api/auth/profile' },
  { method: 'GET', path: '/api/auth/check-user', expectedStatus: 200, name: 'GET /api/auth/check-user' },
  { method: 'GET', path: '/api/auth/check-admin', expectedStatus: 200, name: 'GET /api/auth/check-admin' },

  // Memory Routes (5)
  { method: 'POST', path: '/api/memories', expectedStatus: 201, body: { title: 'First Memory', description: 'AI archive item' }, name: 'POST /api/memories' },
  { method: 'GET', path: '/api/memories', expectedStatus: 200, name: 'GET /api/memories' },
  { method: 'GET', path: '/api/memories/mem-123', expectedStatus: 200, name: 'GET /api/memories/:id' },
  { method: 'PUT', path: '/api/memories/mem-123', expectedStatus: 200, body: { title: 'Updated Title' }, name: 'PUT /api/memories/:id' },
  { method: 'DELETE', path: '/api/memories/mem-123', expectedStatus: 200, name: 'DELETE /api/memories/:id' },

  // User / Admin Routes (4)
  { method: 'GET', path: '/api/users', expectedStatus: 200, name: 'GET /api/users' },
  { method: 'GET', path: '/api/users/usr-456', expectedStatus: 200, name: 'GET /api/users/:id' },
  { method: 'PUT', path: '/api/users/usr-456', expectedStatus: 200, body: { name: 'Updated Name' }, name: 'PUT /api/users/:id' },
  { method: 'DELETE', path: '/api/users/usr-456', expectedStatus: 200, name: 'DELETE /api/users/:id' },
];

function makeRequest(port, testCase) {
  return new Promise((resolve, reject) => {
    const postData = testCase.body ? JSON.stringify(testCase.body) : '';
    const options = {
      hostname: '127.0.0.1',
      port: port,
      path: testCase.path,
      method: testCase.method,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        let json;
        try {
          json = JSON.parse(data);
        } catch (e) {
          json = data;
        }
        resolve({
          status: res.statusCode,
          data: json,
          passed: res.statusCode === testCase.expectedStatus
        });
      });
    });

    req.on('error', (e) => reject(e));

    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

async function runTests() {
  server.listen(0, '127.0.0.1', async () => {
    const port = server.address().port;
    console.log(`\n======================================================`);
    console.log(`🧪 Running Route Architecture Verification on Port ${port}`);
    console.log(`======================================================\n`);

    let passedCount = 0;
    let failedCount = 0;

    for (const test of routesToTest) {
      try {
        const result = await makeRequest(port, test);
        if (result.passed) {
          console.log(`✅ [${result.status}] ${test.method.padEnd(6)} ${test.path.padEnd(25)} -> ${test.name}`);
          passedCount++;
        } else {
          console.error(`❌ [${result.status} != ${test.expectedStatus}] ${test.method.padEnd(6)} ${test.path.padEnd(25)} -> ${test.name}`);
          console.error('   Response:', result.data);
          failedCount++;
        }
      } catch (err) {
        console.error(`❌ Error testing ${test.method} ${test.path}:`, err.message);
        failedCount++;
      }
    }

    console.log(`\n======================================================`);
    console.log(`📊 Summary: ${passedCount}/${routesToTest.length} Routes Verified Successfully!`);
    console.log(`======================================================\n`);

    server.close();
    process.exit(failedCount === 0 ? 0 : 1);
  });
}

runTests();
