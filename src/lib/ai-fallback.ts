import { AIExtractionResult, ItemType } from '@/types';

const COMMON_SKILLS = [
  'JavaScript', 'TypeScript', 'React', 'Next.js', 'Node.js', 'Express', 'Python', 'Django',
  'FastAPI', 'Java', 'Spring Boot', 'C++', 'C#', '.NET', 'SQL', 'PostgreSQL', 'MongoDB',
  'SQLite', 'Redis', 'Docker', 'Kubernetes', 'AWS', 'Azure', 'Google Cloud', 'Git', 'CI/CD',
  'Linux', 'GraphQL', 'REST API', 'Tailwind CSS', 'Figma', 'Machine Learning', 'Data Science',
  'Deep Learning', 'PyTorch', 'TensorFlow', 'Cybersecurity', 'Agile', 'Scrum', 'DevOps',
  'Microservices', 'Kubernetes', 'WebSockets', 'System Design'
];

const KNOWN_ISSUERS = [
  'Coursera', 'Udemy', 'edX', 'AWS', 'Google', 'Microsoft', 'Meta', 'Stanford Online',
  'Harvard Online', 'IBM', 'Oracle', 'Cisco', 'freeCodeCamp', 'DataCamp', 'DeepLearning.AI',
  'Linux Foundation', 'Scrum Alliance', 'University', 'College', 'Institute'
];

export function heuristicAnalyzeContent(
  text: string,
  fileName: string,
  hintType?: string
): AIExtractionResult {
  const content = (text + ' ' + fileName).toLowerCase();
  
  // 1. Determine Item Type
  let detectedType: ItemType = 'DOCUMENT';
  if (hintType && ['DOCUMENT', 'CERTIFICATE', 'PROJECT', 'ACHIEVEMENT', 'NOTE'].includes(hintType.toUpperCase())) {
    detectedType = hintType.toUpperCase() as ItemType;
  } else if (
    content.includes('certificate') ||
    content.includes('certification') ||
    content.includes('has successfully completed') ||
    content.includes('credential') ||
    content.includes('license')
  ) {
    detectedType = 'CERTIFICATE';
  } else if (
    content.includes('github.com') ||
    content.includes('repository') ||
    content.includes('tech stack') ||
    content.includes('project overview') ||
    content.includes('architecture') ||
    content.includes('features')
  ) {
    detectedType = 'PROJECT';
  } else if (
    content.includes('award') ||
    content.includes('winner') ||
    content.includes('hackathon') ||
    content.includes('1st place') ||
    content.includes('2nd place') ||
    content.includes('honorable mention') ||
    content.includes('fellowship') ||
    content.includes('scholarship')
  ) {
    detectedType = 'ACHIEVEMENT';
  } else if (
    content.includes('notes') ||
    content.includes('meeting') ||
    content.includes('todo') ||
    content.includes('checklist') ||
    fileName.endsWith('.md')
  ) {
    detectedType = 'NOTE';
  }

  // 2. Suggest Category
  let category = 'General Documents';
  if (detectedType === 'CERTIFICATE') category = 'Education & Certifications';
  else if (detectedType === 'PROJECT') category = 'Projects & Portfolios';
  else if (detectedType === 'ACHIEVEMENT') category = 'Honors & Awards';
  else if (detectedType === 'NOTE') category = 'Personal Notes';
  else if (content.includes('tax') || content.includes('invoice') || content.includes('bank') || content.includes('salary')) category = 'Financial Records';
  else if (content.includes('passport') || content.includes('license') || content.includes('id card') || content.includes('identity')) category = 'Identity & Legal';
  else if (content.includes('resume') || content.includes('cv') || content.includes('offer letter') || content.includes('job')) category = 'Career & Work';

  // 3. Extract Skills
  const matchedSkills: string[] = [];
  COMMON_SKILLS.forEach(skill => {
    const regex = new RegExp(`\\b${skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    if (regex.test(text)) {
      matchedSkills.push(skill);
    }
  });

  // 4. Extract Issuer/Org
  let extractedIssuer = '';
  for (const issuer of KNOWN_ISSUERS) {
    if (new RegExp(`\\b${issuer}\\b`, 'i').test(text)) {
      extractedIssuer = issuer;
      break;
    }
  }

  // 5. Extract Date strings (YYYY-MM-DD or Month YYYY)
  const dateRegex = /\b(20[12]\d[-/.](0[1-9]|1[0-2])[-/.](0[1-9]|[12]\d|3[01])|(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},?\s+20[12]\d|20[12]\d)\b/i;
  const dateMatch = text.match(dateRegex);
  const dateOccurred = dateMatch ? new Date(dateMatch[0]).toISOString() : undefined;

  // 6. Generate Title
  const cleanBaseName = fileName.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
  const formattedTitle = cleanBaseName.charAt(0).toUpperCase() + cleanBaseName.slice(1);

  // 7. Heuristic Summarizer
  const lines = text
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(l => l.length > 20);

  const keyPoints = lines.slice(0, 3).map(l => (l.length > 120 ? l.slice(0, 117) + '...' : l));
  const summary =
    keyPoints.length > 0
      ? `Archive record for "${formattedTitle}". ${keyPoints.join(' ')}`
      : `Archived ${detectedType.toLowerCase()} document titled "${formattedTitle}" containing ${matchedSkills.length > 0 ? 'skills: ' + matchedSkills.slice(0, 4).join(', ') : 'digital records'}.`;

  // 8. Suggested Tags
  const suggestedTags = Array.from(
    new Set([
      detectedType.toLowerCase(),
      category.split(' ')[0].toLowerCase(),
      ...matchedSkills.slice(0, 4).map(s => s.toLowerCase()),
    ])
  ).slice(0, 5);

  return {
    title: formattedTitle,
    itemType: detectedType,
    suggestedCategory: category,
    suggestedTags,
    summary,
    keyPoints: keyPoints.length > 0 ? keyPoints : [`Imported on ${new Date().toLocaleDateString()}`],
    extractedEntities: {
      issuerOrOrg: extractedIssuer || (detectedType === 'CERTIFICATE' ? 'Issuing Organization' : undefined),
      dateOccurred,
      skills: matchedSkills,
      projectStack: detectedType === 'PROJECT' ? matchedSkills : undefined,
      estimatedImportance: detectedType === 'CERTIFICATE' || detectedType === 'ACHIEVEMENT' ? 4 : 3,
    },
    confidence: 0.85,
  };
}

export function generateHeuristicVector(text: string, dimension = 64): number[] {
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

  // Normalize vector
  const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0)) || 1;
  return vector.map(v => Number((v / magnitude).toFixed(5)));
}
