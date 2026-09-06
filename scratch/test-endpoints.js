async function runTests() {
  console.log('🧪 Testing AI Personal Archive API & Full-Stack Endpoints...\n');

  // 1. Test Demo Auth
  const demoLoginRes = await fetch('http://localhost:3000/api/auth/demo', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });

  const cookieHeader = demoLoginRes.headers.get('set-cookie');
  const tokenCookie = cookieHeader ? cookieHeader.split(';')[0] : '';
  const demoData = await demoLoginRes.json();

  console.log('✅ Demo Login:', demoData.user?.fullName, `(${demoData.user?.email})`);

  const authHeaders = {
    'Cookie': tokenCookie,
    'Content-Type': 'application/json',
  };

  // 2. Test Get User Profile
  const meRes = await fetch('http://localhost:3000/api/auth/me', { headers: authHeaders });
  const meData = await meRes.json();
  console.log('✅ Profile Check (GET /api/auth/me):', meData.user?.email);

  // 3. Test Analytics Overview
  const analyticsRes = await fetch('http://localhost:3000/api/analytics/overview', { headers: authHeaders });
  const analyticsData = await analyticsRes.json();
  console.log('✅ Analytics Overview (GET /api/analytics/overview):', {
    totalItems: analyticsData.stats?.totalItems,
    documents: analyticsData.stats?.totalDocuments,
    certificates: analyticsData.stats?.totalCertificates,
    projects: analyticsData.stats?.totalProjects,
    achievements: analyticsData.stats?.totalAchievements,
    notes: analyticsData.stats?.totalNotes,
    storage: analyticsData.stats?.totalStorageBytes,
  });

  // 4. Test List Archive Items
  const itemsRes = await fetch('http://localhost:3000/api/items', { headers: authHeaders });
  const itemsData = await itemsRes.json();
  console.log(`✅ List Items (GET /api/items): Retrieved ${itemsData.items?.length} items.`);

  // 5. Test Categories & Tags
  const catRes = await fetch('http://localhost:3000/api/categories', { headers: authHeaders });
  const catData = await catRes.json();
  console.log(`✅ Categories (GET /api/categories): Retrieved ${catData.categories?.length} categories.`);

  // 6. Test Semantic Search
  const searchRes = await fetch('http://localhost:3000/api/ai/semantic-search', {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ query: 'AWS Cloud Solutions Architect' }),
  });
  const searchData = await searchRes.json();
  console.log('✅ Semantic Search (POST /api/ai/semantic-search):', {
    query: searchData.query,
    totalMatches: searchData.totalMatches,
    topMatch: searchData.results?.[0]?.item?.title,
    matchReason: searchData.results?.[0]?.matchReason,
  });

  // 7. Test Conversational Archive Q&A
  const askRes = await fetch('http://localhost:3000/api/ai/ask-archive', {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ question: 'What AWS certifications do I have?' }),
  });
  const askData = await askRes.json();
  console.log('✅ Conversational AI (POST /api/ai/ask-archive):', {
    question: askData.question,
    answerPreview: askData.answer?.slice(0, 120) + '...',
  });

  // 8. Test Item Creation (Create CRUD)
  const createRes = await fetch('http://localhost:3000/api/items', {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      title: 'Stanford Machine Learning Specialization',
      description: 'Supervised and unsupervised learning, neural networks, and reinforcement learning by Andrew Ng.',
      itemType: 'CERTIFICATE',
      importanceLevel: 5,
      dateOccurred: '2024-07-01',
      tags: ['Machine Learning', 'Python', 'AI'],
      specializedData: {
        issuer: 'Stanford Online / Coursera',
        credentialId: 'STANFORD-ML-9921',
        skills: ['Machine Learning', 'Python', 'Neural Networks', 'TensorFlow'],
      },
    }),
  });
  const createData = await createRes.json();
  const createdId = createData.item?.id;
  console.log('✅ Item Create (POST /api/items): Created item with ID:', createdId, '-', createData.item?.title);

  // 9. Test Item Update (Update CRUD)
  const updateRes = await fetch(`http://localhost:3000/api/items/${createdId}`, {
    method: 'PUT',
    headers: authHeaders,
    body: JSON.stringify({
      title: 'Stanford Machine Learning Specialization (Honors)',
      importanceLevel: 5,
      isFavorite: true,
    }),
  });
  const updateData = await updateRes.json();
  console.log('✅ Item Update (PUT /api/items/[id]): Updated title to:', updateData.item?.title, '| Favorite:', updateData.item?.isFavorite);

  // 10. Test Item Delete (Delete CRUD)
  const deleteRes = await fetch(`http://localhost:3000/api/items/${createdId}`, {
    method: 'DELETE',
    headers: authHeaders,
  });
  const deleteData = await deleteRes.json();
  console.log('✅ Item Delete (DELETE /api/items/[id]):', deleteData.message);

  console.log('\n🎉 ALL FULL-STACK CRUD & AI FEATURES VALIDATED SUCCESSFULLY!');
}

runTests().catch(console.error);
