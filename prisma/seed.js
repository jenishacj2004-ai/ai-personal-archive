const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

function generateHeuristicVector(text, dimension = 64) {
  const vector = new Array(dimension).fill(0);
  const words = text.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/);
  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    let hash = 0;
    for (let c = 0; c < word.length; c++) {
      hash = (hash << 5) - hash + word.charCodeAt(c);
      hash |= 0;
    }
    const idx = Math.abs(hash) % dimension;
    vector[idx] += 1 / (1 + Math.log(1 + words.length));
  }
  const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0)) || 1;
  return vector.map(v => Number((v / magnitude).toFixed(5)));
}

async function main() {
  console.log('🌱 Starting database seeding for AI Personal Archive...');

  // 1. Create or retrieve Demo User
  const demoEmail = 'demo@archive.ai';
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('demo1234', salt);

  // Clean old records for clean demo state
  const existingUser = await prisma.user.findUnique({ where: { email: demoEmail } });
  if (existingUser) {
    await prisma.user.delete({ where: { email: demoEmail } });
  }

  const user = await prisma.user.create({
    data: {
      email: demoEmail,
      fullName: 'Alex Morgan',
      passwordHash,
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      aiProvider: 'gemini',
    },
  });

  console.log(`👤 Created Demo User: ${user.fullName} (${user.email})`);

  // 2. Create Categories
  const categoriesData = [
    { name: 'Education & Certifications', slug: 'education-certifications', color: '#10b981', icon: 'Award', description: 'Professional certs, diplomas, online courses, and academic records' },
    { name: 'Projects & Portfolios', slug: 'projects-portfolios', color: '#6366f1', icon: 'FolderGit2', description: 'Software repositories, system architectures, design projects, and case studies' },
    { name: 'Honors & Awards', slug: 'honors-awards', color: '#f59e0b', icon: 'Trophy', description: 'Hackathon victories, scholarships, competitions, and workplace awards' },
    { name: 'Personal Notes & Logs', slug: 'personal-notes', color: '#a855f7', icon: 'StickyNote', description: 'Meeting takeaways, study notes, checklists, and architectural thoughts' },
    { name: 'Career & Work', slug: 'career-work', color: '#3b82f6', icon: 'Briefcase', description: 'Resumes, letters of recommendation, performance reviews, and job contracts' },
    { name: 'Financial & Legal', slug: 'financial-legal', color: '#ec4899', icon: 'FileText', description: 'Tax forms, invoices, identity proofs, and lease agreements' },
  ];

  const categories = {};
  for (const cat of categoriesData) {
    const createdCat = await prisma.category.create({
      data: {
        userId: user.id,
        name: cat.name,
        slug: cat.slug,
        color: cat.color,
        icon: cat.icon,
        description: cat.description,
        isSystemDefault: true,
      },
    });
    categories[cat.slug] = createdCat;
  }

  // 3. Create Tags
  const tagNames = [
    { name: 'Cloud Computing', color: '#38bdf8' },
    { name: 'TypeScript', color: '#3178c6' },
    { name: 'React', color: '#61dafb' },
    { name: 'Machine Learning', color: '#a855f7' },
    { name: 'AWS', color: '#ff9900' },
    { name: 'DevOps', color: '#10b981' },
    { name: 'Hackathon', color: '#f59e0b' },
    { name: 'Architecture', color: '#6366f1' },
    { name: 'Python', color: '#4584b6' },
    { name: 'Node.js', color: '#22c55e' },
  ];

  const tags = {};
  for (const t of tagNames) {
    const createdTag = await prisma.tag.create({
      data: {
        userId: user.id,
        name: t.name,
        color: t.color,
      },
    });
    tags[t.name] = createdTag;
  }

  // 4. Create Sample Archive Items

  // Item 1: AWS Certified Solutions Architect
  const cert1Text = 'AWS Certified Solutions Architect - Associate. Issued by Amazon Web Services to Alex Morgan on May 15, 2024. Validation Number: AWS-ASA-9948201. Skills validated: AWS IAM, EC2, S3, RDS, Lambda, VPC, CloudFront, High Availability, Fault Tolerance, Disaster Recovery, Cost Optimization.';
  const cert1 = await prisma.archiveItem.create({
    data: {
      userId: user.id,
      categoryId: categories['education-certifications'].id,
      title: 'AWS Certified Solutions Architect - Associate',
      description: 'Industry-standard cloud architecture certification validating secure and resilient AWS infrastructure design.',
      itemType: 'CERTIFICATE',
      fileName: 'AWS_Solutions_Architect_Certificate.pdf',
      fileType: 'application/pdf',
      fileSize: 412000,
      rawTextContent: cert1Text,
      aiSummary: 'Certified in designing cost-effective, scalable, and highly available multi-tier architectures on AWS cloud infrastructure.',
      aiExtractedKeyValues: JSON.stringify({
        issuer: 'Amazon Web Services',
        credentialId: 'AWS-ASA-9948201',
        skills: ['AWS', 'Cloud Computing', 'VPC', 'EC2', 'S3', 'RDS', 'IAM'],
        issueDate: '2024-05-15',
        expiryDate: '2027-05-15',
      }),
      importanceLevel: 5,
      isFavorite: true,
      dateOccurred: new Date('2024-05-15'),
      tags: {
        create: [
          { tagId: tags['AWS'].id },
          { tagId: tags['Cloud Computing'].id },
          { tagId: tags['Architecture'].id },
        ],
      },
      certificateMeta: {
        create: {
          issuer: 'Amazon Web Services',
          credentialId: 'AWS-ASA-9948201',
          credentialUrl: 'https://aws.amazon.com/verification',
          issueDate: new Date('2024-05-15'),
          expiryDate: new Date('2027-05-15'),
          skills: JSON.stringify(['AWS', 'Cloud Computing', 'Architecture', 'DevOps']),
          doesExpire: true,
        },
      },
      embeddingCache: {
        create: {
          vectorData: JSON.stringify(generateHeuristicVector(cert1Text)),
          modelVersion: 'heuristic-v1',
        },
      },
    },
  });

  // Item 2: Meta Full-Stack Engineer Certificate
  const cert2Text = 'Meta Front-End & Full-Stack Developer Professional Certificate. Issued by Meta on Coursera. Covers React, Next.js, TypeScript, RESTful APIs, UI/UX Design Principles, Version Control Git, Unit Testing with Jest, and State Management with Redux/Zustand.';
  const cert2 = await prisma.archiveItem.create({
    data: {
      userId: user.id,
      categoryId: categories['education-certifications'].id,
      title: 'Meta Front-End & Full-Stack Developer Specialization',
      description: 'Comprehensive 9-course specialization covering modern web application engineering, React ecosystems, and API integration.',
      itemType: 'CERTIFICATE',
      fileName: 'Meta_FullStack_Specialization.pdf',
      fileType: 'application/pdf',
      fileSize: 328000,
      rawTextContent: cert2Text,
      aiSummary: 'Validated expertise in building modern, accessible React single-page applications with TypeScript, automated tests, and backend integration.',
      aiExtractedKeyValues: JSON.stringify({
        issuer: 'Meta / Coursera',
        credentialId: 'META-FE-77291',
        skills: ['React', 'TypeScript', 'JavaScript', 'UI/UX', 'REST API'],
        issueDate: '2024-02-10',
      }),
      importanceLevel: 4,
      isFavorite: true,
      dateOccurred: new Date('2024-02-10'),
      tags: {
        create: [
          { tagId: tags['React'].id },
          { tagId: tags['TypeScript'].id },
        ],
      },
      certificateMeta: {
        create: {
          issuer: 'Meta / Coursera',
          credentialId: 'META-FE-77291',
          credentialUrl: 'https://coursera.org/verify/META-FE-77291',
          issueDate: new Date('2024-02-10'),
          skills: JSON.stringify(['React', 'TypeScript', 'JavaScript', 'REST API']),
          doesExpire: false,
        },
      },
      embeddingCache: {
        create: {
          vectorData: JSON.stringify(generateHeuristicVector(cert2Text)),
          modelVersion: 'heuristic-v1',
        },
      },
    },
  });

  // Item 3: Project - Distributed Realtime Analytics Dashboard
  const proj1Text = 'Distributed Realtime Analytics Dashboard project. Built using Next.js 15, TypeScript, Node.js, WebSockets, Redis, and Tailwind CSS. Processes 10,000+ telemetry events per second with live chart updates, anomaly detection alerts, and role-based access control. Hosted on AWS ECS with Docker containerization.';
  const proj1 = await prisma.archiveItem.create({
    data: {
      userId: user.id,
      categoryId: categories['projects-portfolios'].id,
      title: 'Distributed Realtime Analytics Dashboard',
      description: 'High-throughput stream processing platform and interactive metrics dashboard for IoT sensor clusters.',
      itemType: 'PROJECT',
      fileName: 'Project_Architecture_Overview.md',
      fileType: 'text/markdown',
      fileSize: 14500,
      rawTextContent: proj1Text,
      aiSummary: 'Realtime dashboard utilizing WebSockets and Redis pub/sub to stream high-frequency event metrics with low latency and interactive charts.',
      aiExtractedKeyValues: JSON.stringify({
        role: 'Lead Full-Stack Architect',
        techStack: ['Next.js', 'TypeScript', 'Node.js', 'Redis', 'AWS', 'Docker'],
        repositoryUrl: 'https://github.com/alexmorgan/realtime-analytics',
        liveDemoUrl: 'https://analytics-demo.alexmorgan.dev',
      }),
      importanceLevel: 5,
      isFavorite: true,
      dateOccurred: new Date('2024-08-01'),
      tags: {
        create: [
          { tagId: tags['TypeScript'].id },
          { tagId: tags['React'].id },
          { tagId: tags['Node.js'].id },
          { tagId: tags['AWS'].id },
        ],
      },
      projectMeta: {
        create: {
          role: 'Lead Full-Stack Architect',
          repositoryUrl: 'https://github.com/alexmorgan/realtime-analytics',
          liveDemoUrl: 'https://analytics-demo.alexmorgan.dev',
          techStack: JSON.stringify(['Next.js', 'TypeScript', 'Node.js', 'Redis', 'AWS', 'Docker']),
          deliverables: JSON.stringify(['REST & WebSocket API', 'Interactive UI Charts', 'Dockerized Deployment', 'Benchmark Suite']),
          startDate: new Date('2024-06-01'),
          endDate: new Date('2024-08-01'),
        },
      },
      embeddingCache: {
        create: {
          vectorData: JSON.stringify(generateHeuristicVector(proj1Text)),
          modelVersion: 'heuristic-v1',
        },
      },
    },
  });

  // Item 4: Achievement - 1st Place National Hackathon Winner
  const ach1Text = 'First Place Grand Winner at National AI & Cloud Hackathon 2024. Organized by TechCorp & AWS. Competed against 140 teams across the country to build an automated emergency disaster response triage bot using computer vision and LLMs.';
  const ach1 = await prisma.archiveItem.create({
    data: {
      userId: user.id,
      categoryId: categories['honors-awards'].id,
      title: '1st Place Grand Winner - National AI & Cloud Hackathon',
      description: 'Awarded 1st place for designing and building an autonomous AI emergency triage system under 36 hours.',
      itemType: 'ACHIEVEMENT',
      fileName: 'Hackathon_Winner_Certificate.pdf',
      fileType: 'application/pdf',
      fileSize: 520000,
      rawTextContent: ach1Text,
      aiSummary: 'Top honor out of 140 teams nationwide for developing an AI computer-vision triage application on AWS infrastructure.',
      aiExtractedKeyValues: JSON.stringify({
        organization: 'National Tech Summit & AWS',
        awardRank: '1st Place Winner ($10,000 Prize)',
        awardDate: '2024-04-20',
      }),
      importanceLevel: 5,
      isFavorite: true,
      dateOccurred: new Date('2024-04-20'),
      tags: {
        create: [
          { tagId: tags['Hackathon'].id },
          { tagId: tags['Machine Learning'].id },
          { tagId: tags['AWS'].id },
        ],
      },
      achievementMeta: {
        create: {
          organization: 'National Tech Summit & AWS',
          awardRank: '1st Place Winner',
          awardDate: new Date('2024-04-20'),
          verificationProofUrl: 'https://techsummit2024.org/winners',
        },
      },
      embeddingCache: {
        create: {
          vectorData: JSON.stringify(generateHeuristicVector(ach1Text)),
          modelVersion: 'heuristic-v1',
        },
      },
    },
  });

  // Item 5: Note - System Design Cheat Sheet
  const note1Text = `# Microservices & Distributed System Architecture Notes
  
### Key Design Patterns:
1. **CQRS & Event Sourcing**: Separate read and write pipelines for high scalability.
2. **Circuit Breaker Pattern**: Prevent cascading failures across downstream services using Resilience4j / Polly.
3. **Database Sharding**: Consistent hashing for distributed partition keys.
4. **Caching Tiers**: Redis write-through vs cache-aside caching strategies.

### Todo Checklist:
- [x] Review Kafka partition rebalancing strategies
- [x] Benchmark PostgreSQL composite index queries
- [ ] Prepare mock interview questions for senior architect role`;

  const note1 = await prisma.archiveItem.create({
    data: {
      userId: user.id,
      categoryId: categories['personal-notes'].id,
      title: 'Microservices & System Design Architecture Notes',
      description: 'Comprehensive study notes on distributed caching, event-driven architectures, and database sharding.',
      itemType: 'NOTE',
      fileName: 'System_Design_Notes.md',
      fileType: 'text/markdown',
      fileSize: 4200,
      rawTextContent: note1Text,
      aiSummary: 'Key engineering notes covering CQRS, event sourcing, circuit breakers, distributed caching, and database partitioning.',
      aiExtractedKeyValues: JSON.stringify({
        topics: ['Microservices', 'Distributed Systems', 'Caching', 'CQRS'],
        lastReviewed: '2024-08-15',
      }),
      importanceLevel: 4,
      dateOccurred: new Date('2024-08-15'),
      tags: {
        create: [
          { tagId: tags['Architecture'].id },
          { tagId: tags['DevOps'].id },
        ],
      },
      noteMeta: {
        create: {
          markdownContent: note1Text,
          checklist: JSON.stringify([
            { text: 'Review Kafka partition rebalancing strategies', done: true },
            { text: 'Benchmark PostgreSQL composite index queries', done: true },
            { text: 'Prepare mock interview questions for senior architect role', done: false },
          ]),
        },
      },
      embeddingCache: {
        create: {
          vectorData: JSON.stringify(generateHeuristicVector(note1Text)),
          modelVersion: 'heuristic-v1',
        },
      },
    },
  });

  // 5. Create Activity Logs
  const activities = [
    { action: 'CREATED', entityType: 'CERTIFICATE', details: 'Added "AWS Certified Solutions Architect - Associate"' },
    { action: 'AI_ANALYSIS', entityType: 'CERTIFICATE', details: 'Auto-extracted skills (AWS, Cloud Computing, VPC) and generated summary' },
    { action: 'CREATED', entityType: 'PROJECT', details: 'Added project "Distributed Realtime Analytics Dashboard"' },
    { action: 'CREATED', entityType: 'ACHIEVEMENT', details: 'Logged "1st Place Winner - National Hackathon"' },
    { action: 'CREATED', entityType: 'NOTE', details: 'Wrote "System Design Architecture Notes"' },
  ];

  for (const act of activities) {
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: act.action,
        entityType: act.entityType,
        details: act.details,
      },
    });
  }

  console.log('✅ Seeding completed successfully with 5 rich archive items, 6 categories, and 10 tags!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
