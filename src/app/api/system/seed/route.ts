import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { generateHeuristicVector } from '@/lib/ai-fallback';

export async function POST(req: NextRequest) {
  try {
    const user = await authenticateRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user already has items
    const existingCount = await prisma.archiveItem.count({ where: { userId: user.id } });
    if (existingCount > 0) {
      // Clear current items to re-seed cleanly
      await prisma.archiveItem.deleteMany({ where: { userId: user.id } });
      await prisma.tag.deleteMany({ where: { userId: user.id } });
      await prisma.category.deleteMany({ where: { userId: user.id } });
    }

    // 1. Create default categories
    const catData = [
      { name: 'Education & Certifications', slug: 'education-certifications', color: '#10b981', icon: 'Award', description: 'Professional certs, diplomas, online courses, and academic records' },
      { name: 'Projects & Portfolios', slug: 'projects-portfolios', color: '#6366f1', icon: 'FolderGit2', description: 'Software repositories, system architectures, design projects, and case studies' },
      { name: 'Honors & Awards', slug: 'honors-awards', color: '#f59e0b', icon: 'Trophy', description: 'Hackathon victories, scholarships, competitions, and workplace awards' },
      { name: 'Personal Notes & Logs', slug: 'personal-notes', color: '#a855f7', icon: 'StickyNote', description: 'Meeting takeaways, study notes, checklists, and architectural thoughts' },
      { name: 'Career & Work', slug: 'career-work', color: '#3b82f6', icon: 'Briefcase', description: 'Resumes, letters of recommendation, performance reviews, and job contracts' },
      { name: 'Financial & Legal', slug: 'financial-legal', color: '#ec4899', icon: 'FileText', description: 'Tax forms, invoices, identity proofs, and lease agreements' },
    ];

    const categories: Record<string, any> = {};
    for (const c of catData) {
      const created = await prisma.category.create({
        data: {
          userId: user.id,
          name: c.name,
          slug: c.slug,
          color: c.color,
          icon: c.icon,
          description: c.description,
          isSystemDefault: true,
        },
      });
      categories[c.slug] = created;
    }

    // 2. Create Tags
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

    const tags: Record<string, any> = {};
    for (const t of tagNames) {
      const created = await prisma.tag.create({
        data: {
          userId: user.id,
          name: t.name,
          color: t.color,
        },
      });
      tags[t.name] = created;
    }

    // 3. Seed Items
    const cert1Text = 'AWS Certified Solutions Architect - Associate. Issued by Amazon Web Services to ' + user.fullName + ' on May 15, 2024. Validation: AWS-ASA-9948201. Skills: AWS IAM, EC2, S3, RDS, Lambda, VPC, CloudFront, High Availability, Disaster Recovery.';
    await prisma.archiveItem.create({
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
          skills: ['AWS', 'Cloud Computing', 'VPC', 'EC2', 'S3', 'RDS'],
        }),
        importanceLevel: 5,
        isFavorite: true,
        dateOccurred: new Date('2024-05-15'),
        tags: {
          create: [{ tagId: tags['AWS'].id }, { tagId: tags['Cloud Computing'].id }, { tagId: tags['Architecture'].id }],
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

    const cert2Text = 'Meta Front-End & Full-Stack Developer Professional Certificate. Issued by Meta. Covers React, Next.js, TypeScript, RESTful APIs, UI/UX Design, Git, and Unit Testing with Jest.';
    await prisma.archiveItem.create({
      data: {
        userId: user.id,
        categoryId: categories['education-certifications'].id,
        title: 'Meta Front-End & Full-Stack Developer Specialization',
        description: 'Comprehensive specialization covering modern web application engineering, React ecosystems, and API integration.',
        itemType: 'CERTIFICATE',
        fileName: 'Meta_FullStack_Specialization.pdf',
        fileType: 'application/pdf',
        fileSize: 328000,
        rawTextContent: cert2Text,
        aiSummary: 'Validated expertise in building modern, accessible React single-page applications with TypeScript, automated tests, and backend integration.',
        aiExtractedKeyValues: JSON.stringify({
          issuer: 'Meta / Coursera',
          credentialId: 'META-FE-77291',
          skills: ['React', 'TypeScript', 'JavaScript', 'REST API'],
        }),
        importanceLevel: 4,
        isFavorite: true,
        dateOccurred: new Date('2024-02-10'),
        tags: {
          create: [{ tagId: tags['React'].id }, { tagId: tags['TypeScript'].id }],
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

    const proj1Text = 'Distributed Realtime Analytics Dashboard project. Built using Next.js 15, TypeScript, Node.js, WebSockets, Redis, and Tailwind CSS. Processes 10,000+ telemetry events per second.';
    await prisma.archiveItem.create({
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
          techStack: ['Next.js', 'TypeScript', 'Node.js', 'Redis', 'AWS'],
        }),
        importanceLevel: 5,
        isFavorite: true,
        dateOccurred: new Date('2024-08-01'),
        tags: {
          create: [{ tagId: tags['TypeScript'].id }, { tagId: tags['React'].id }, { tagId: tags['Node.js'].id }, { tagId: tags['AWS'].id }],
        },
        projectMeta: {
          create: {
            role: 'Lead Full-Stack Architect',
            repositoryUrl: 'https://github.com/alexmorgan/realtime-analytics',
            liveDemoUrl: 'https://analytics-demo.alexmorgan.dev',
            techStack: JSON.stringify(['Next.js', 'TypeScript', 'Node.js', 'Redis', 'AWS', 'Docker']),
            deliverables: JSON.stringify(['REST & WebSocket API', 'Interactive UI Charts', 'Dockerized Deployment']),
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

    const ach1Text = 'First Place Grand Winner at National AI & Cloud Hackathon 2024. Organized by TechCorp & AWS. Built an automated emergency disaster response triage bot.';
    await prisma.archiveItem.create({
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
        }),
        importanceLevel: 5,
        isFavorite: true,
        dateOccurred: new Date('2024-04-20'),
        tags: {
          create: [{ tagId: tags['Hackathon'].id }, { tagId: tags['Machine Learning'].id }, { tagId: tags['AWS'].id }],
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

    const note1Text = `# Microservices & Distributed System Architecture Notes
  
### Key Design Patterns:
1. **CQRS & Event Sourcing**: Separate read and write pipelines for high scalability.
2. **Circuit Breaker Pattern**: Prevent cascading failures across downstream services.
3. **Database Sharding**: Consistent hashing for distributed partition keys.
4. **Caching Tiers**: Redis write-through vs cache-aside caching strategies.`;

    await prisma.archiveItem.create({
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
        }),
        importanceLevel: 4,
        dateOccurred: new Date('2024-08-15'),
        tags: {
          create: [{ tagId: tags['Architecture'].id }, { tagId: tags['DevOps'].id }],
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

    return NextResponse.json({ success: true, message: 'Archive reset and populated with rich sample data!' });
  } catch (error) {
    console.error('Error seeding archive data:', error);
    return NextResponse.json({ error: 'Failed to seed sample archive data' }, { status: 500 });
  }
}
