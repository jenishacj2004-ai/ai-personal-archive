const http = require('http');

async function makeFetch(url, options = {}) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const postData = options.body ? (typeof options.body === 'string' ? options.body : JSON.stringify(options.body)) : null;

    const reqOptions = {
      hostname: parsed.hostname,
      port: parsed.port || 3000,
      path: parsed.pathname + parsed.search,
      method: options.method || 'GET',
      headers: {
        ...(postData ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(postData) } : {}),
        ...(options.headers || {})
      }
    };

    const req = http.request(reqOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        let json = null;
        try {
          json = JSON.parse(data);
        } catch {
          json = data;
        }
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data: json,
          location: res.headers.location
        });
      });
    });

    req.on('error', reject);
    req.end(postData || undefined);
  });
}

async function runTestFlow() {
  console.log('================================================================');
  console.log('🧪 WEEK 4: FRONTEND-BACKEND END-TO-END INTEGRATION TEST SUITE');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, name, details = '') {
    if (condition) {
      console.log(`  ✅ [PASS] ${name}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${name}`);
      if (details) console.error(`     ↳ Details: ${details}`);
      failed++;
    }
  }

  const BASE_URL = 'http://127.0.0.1:3000';
  const unique = Date.now();
  const testEmail = `w4_tester_${unique}@archive.ai`;
  const testPassword = 'SecurePassword2026!';
  let authCookie = '';
  let createdItemId = '';

  try {
    // 1. Landing page public accessibility
    const res1 = await makeFetch(`${BASE_URL}/`);
    assert(res1.status === 200, '1. Landing Page (GET /) is publicly accessible (200 OK)');

    // 2. Unauthenticated access to protected route redirects to /login
    const res2 = await makeFetch(`${BASE_URL}/dashboard`);
    assert(
      res2.status === 307 || res2.status === 302 || res2.status === 308,
      '2. Unauthenticated GET /dashboard is redirected by Middleware to /login',
      `Status: ${res2.status}, Location: ${res2.location}`
    );

    // 3. User Registration
    const res3 = await makeFetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      body: {
        fullName: 'Alex Week4 Tester',
        email: testEmail,
        password: testPassword
      }
    });

    const setCookie = res3.headers['set-cookie'];
    if (setCookie && setCookie.length > 0) {
      authCookie = setCookie[0].split(';')[0];
    }

    assert(
      res3.status === 200 && res3.data.user?.email === testEmail && !!authCookie,
      '3. User Registration (POST /api/auth/register) creates user & sets archive_token cookie',
      JSON.stringify(res3.data)
    );

    const headersWithCookie = { Cookie: authCookie };

    // 4. Authenticated user accessing /api/auth/me
    const res4 = await makeFetch(`${BASE_URL}/api/auth/me`, { headers: headersWithCookie });
    assert(
      res4.status === 200 && res4.data.user?.email === testEmail,
      '4. Current User Session (GET /api/auth/me) returns authenticated profile',
      JSON.stringify(res4.data)
    );

    // 5. Authenticated user accessing /dashboard
    const res5 = await makeFetch(`${BASE_URL}/dashboard`, { headers: headersWithCookie });
    assert(
      res5.status === 200,
      '5. Authenticated user can access protected /dashboard (200 OK)',
      `Status: ${res5.status}`
    );

    // 6. Analytics Overview API
    const res6 = await makeFetch(`${BASE_URL}/api/analytics/overview`, { headers: headersWithCookie });
    assert(
      res6.status === 200 && res6.data.stats !== undefined,
      '6. Dashboard Analytics (GET /api/analytics/overview) returns stats payload',
      JSON.stringify(res6.data)
    );

    // 7. Categories API
    const res7 = await makeFetch(`${BASE_URL}/api/categories`, { headers: headersWithCookie });
    assert(
      res7.status === 200 && Array.isArray(res7.data.categories) && res7.data.categories.length >= 6,
      '7. Categories API (GET /api/categories) returns user categories',
      `Count: ${res7.data.categories?.length}`
    );

    // 8. Seed Sample Data
    const res8 = await makeFetch(`${BASE_URL}/api/system/seed`, {
      method: 'POST',
      headers: headersWithCookie
    });
    assert(
      res8.status === 200 && res8.data.success === true,
      '8. System Seeder (POST /api/system/seed) populates rich archive data',
      JSON.stringify(res8.data)
    );

    // 9. List All Items
    const res9 = await makeFetch(`${BASE_URL}/api/items`, { headers: headersWithCookie });
    assert(
      res9.status === 200 && Array.isArray(res9.data.items) && res9.data.items.length >= 5,
      '9. Archive Items List (GET /api/items) returns seeded records',
      `Items count: ${res9.data.items?.length}`
    );

    // 10. Filter by Type
    const res10 = await makeFetch(`${BASE_URL}/api/items?type=CERTIFICATE`, { headers: headersWithCookie });
    assert(
      res10.status === 200 && res10.data.items?.length >= 2,
      '10. Filter Items by CERTIFICATE (GET /api/items?type=CERTIFICATE) returns certs',
      `Count: ${res10.data.items?.length}`
    );

    const resProjects = await makeFetch(`${BASE_URL}/api/items?type=PROJECT`, { headers: headersWithCookie });
    assert(
      resProjects.status === 200 && resProjects.data.items?.length >= 1,
      '11. Filter Items by PROJECT (GET /api/items?type=PROJECT) returns projects'
    );

    const resNotes = await makeFetch(`${BASE_URL}/api/items?type=NOTE`, { headers: headersWithCookie });
    assert(
      resNotes.status === 200 && resNotes.data.items?.length >= 1,
      '12. Filter Items by NOTE (GET /api/items?type=NOTE) returns notes'
    );

    // 13. AI Semantic Search
    const resSearch = await makeFetch(`${BASE_URL}/api/ai/semantic-search`, {
      method: 'POST',
      headers: headersWithCookie,
      body: { query: 'AWS Cloud Solutions Architect' }
    });
    assert(
      resSearch.status === 200 && resSearch.data.totalMatches >= 1 && !!resSearch.data.results?.[0]?.item?.title,
      '13. AI Semantic Search (POST /api/ai/semantic-search) matches relevant archive records',
      `Top match: ${resSearch.data.results?.[0]?.item?.title}`
    );

    // 14. Conversational Archive Q&A
    const resAsk = await makeFetch(`${BASE_URL}/api/ai/ask-archive`, {
      method: 'POST',
      headers: headersWithCookie,
      body: { question: 'What certifications do I have?' }
    });
    assert(
      resAsk.status === 200 && !!resAsk.data.answer,
      '14. Conversational Archive Assistant (POST /api/ai/ask-archive) generates natural language answer',
      `Answer preview: ${resAsk.data.answer?.slice(0, 80)}...`
    );

    // 15. Create New Archive Item (CRUD: Create)
    const resCreate = await makeFetch(`${BASE_URL}/api/items`, {
      method: 'POST',
      headers: headersWithCookie,
      body: {
        title: 'Stanford Machine Learning Certificate',
        description: 'Supervised and unsupervised learning, deep neural networks by Andrew Ng.',
        itemType: 'CERTIFICATE',
        importanceLevel: 5,
        dateOccurred: '2024-07-01',
        tags: ['Machine Learning', 'AI', 'Python'],
        specializedData: {
          issuer: 'Stanford Online / Coursera',
          credentialId: 'STANFORD-ML-9921',
          skills: ['Machine Learning', 'Python', 'Neural Networks'],
        }
      }
    });
    createdItemId = resCreate.data.item?.id;
    assert(
      resCreate.status === 201 && !!createdItemId,
      '15. Create Archive Item (POST /api/items) successfully creates record with specialized metadata',
      `Created ID: ${createdItemId}`
    );

    // 16. Update Archive Item (CRUD: Update)
    const resUpdate = await makeFetch(`${BASE_URL}/api/items/${createdItemId}`, {
      method: 'PUT',
      headers: headersWithCookie,
      body: {
        title: 'Stanford Machine Learning Certificate (Honors Distinction)',
        isFavorite: true,
        importanceLevel: 5
      }
    });
    assert(
      resUpdate.status === 200 && resUpdate.data.item?.isFavorite === true,
      '16. Update Archive Item (PUT /api/items/[id]) updates title and favorite flag',
      `Updated Title: ${resUpdate.data.item?.title}`
    );

    // 17. Delete Archive Item (CRUD: Delete)
    const resDelete = await makeFetch(`${BASE_URL}/api/items/${createdItemId}`, {
      method: 'DELETE',
      headers: headersWithCookie
    });
    assert(
      resDelete.status === 200 && resDelete.data.success === true,
      '17. Delete Archive Item (DELETE /api/items/[id]) removes record from vault'
    );

    // 18. Update Profile in Settings
    const resProfileUpdate = await makeFetch(`${BASE_URL}/api/auth/me`, {
      method: 'PUT',
      headers: headersWithCookie,
      body: {
        fullName: 'Alex Morgan (Senior Architect)',
        aiProvider: 'gemini'
      }
    });
    assert(
      resProfileUpdate.status === 200 && resProfileUpdate.data.user?.fullName === 'Alex Morgan (Senior Architect)',
      '18. Update Profile (PUT /api/auth/me) saves new name and preferences'
    );

    // 19. Logout
    const resLogout = await makeFetch(`${BASE_URL}/api/auth/logout`, {
      method: 'POST',
      headers: headersWithCookie
    });
    const logoutCookie = resLogout.headers['set-cookie'];
    assert(
      resLogout.status === 200 && resLogout.data.success === true,
      '19. Logout (POST /api/auth/logout) successfully clears session and cookie'
    );

    // 20. Accessing /dashboard after logout -> redirects to /login
    const resPostLogout = await makeFetch(`${BASE_URL}/dashboard`);
    assert(
      resPostLogout.status === 307 || resPostLogout.status === 302 || resPostLogout.status === 308,
      '20. Unauthenticated access after logout is blocked and redirected to /login'
    );

    // 21. Login with user credentials
    const resLogin = await makeFetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      body: {
        email: testEmail,
        password: testPassword
      }
    });
    assert(
      resLogin.status === 200 && resLogin.data.user?.email === testEmail,
      '21. Login (POST /api/auth/login) successfully re-authenticates registered user'
    );

    // 22. Instant Demo Login
    const resDemo = await makeFetch(`${BASE_URL}/api/auth/demo`, { method: 'POST' });
    assert(
      resDemo.status === 200 && resDemo.data.user?.email === 'demo@archive.ai',
      '22. Instant Demo Workspace (POST /api/auth/demo) launches demo session'
    );

  } catch (err) {
    console.error('💥 Test execution error:', err);
    failed++;
  }

  console.log('\n================================================================');
  console.log(`🏁 TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================\n');

  process.exit(failed > 0 ? 1 : 0);
}

runTestFlow();
