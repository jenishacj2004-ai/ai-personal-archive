import { AIExtractionResult, ItemType } from '@/types';
import { heuristicAnalyzeContent, generateHeuristicVector } from './ai-fallback';

export async function analyzeDocumentContent(
  text: string,
  fileName: string,
  hintType?: string,
  customApiKey?: string | null
): Promise<AIExtractionResult> {
  const apiKey = customApiKey || process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey.trim() === '') {
    // Return high-quality heuristic extraction
    return heuristicAnalyzeContent(text, fileName, hintType);
  }

  try {
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `
You are an expert AI archivist. Analyze the following document text and metadata.
Filename: "${fileName}"
Hint Type: "${hintType || 'Auto-detect'}"

Document Content:
"""
${text.slice(0, 8000)}
"""

Extract structured information and return strictly valid JSON matching this schema:
{
  "title": "Clear, concise title for this archive item",
  "itemType": "DOCUMENT" | "CERTIFICATE" | "PROJECT" | "ACHIEVEMENT" | "NOTE",
  "suggestedCategory": "e.g. Education & Certifications, Projects & Portfolios, Honors & Awards, Career & Work, Financial Records, Identity & Legal, Personal Notes, General Documents",
  "suggestedTags": ["tag1", "tag2", "tag3"],
  "summary": "2-3 sentence executive summary explaining what this item is, key takeaways, and context",
  "keyPoints": ["bullet point 1", "bullet point 2", "bullet point 3"],
  "extractedEntities": {
    "issuerOrOrg": "Issuer name, university, or company if applicable",
    "dateOccurred": "YYYY-MM-DD string if identifiable",
    "expiryDate": "YYYY-MM-DD string if it expires",
    "credentialId": "License / Credential ID if found",
    "skills": ["Skill1", "Skill2"],
    "roleOrTitle": "Role / Position if applicable",
    "projectStack": ["Tech1", "Tech2"],
    "keyDeliverables": ["Deliverable1", "Deliverable2"],
    "awardName": "Award rank/title if applicable",
    "estimatedImportance": 3
  },
  "confidence": 0.95
}
Do not wrap in markdown or backticks. Return strictly raw JSON.
`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text()?.trim() || '';
    const cleanJson = responseText.replace(/^```json\s*/i, '').replace(/\s*```$/, '').trim();
    const parsed = JSON.parse(cleanJson) as AIExtractionResult;
    return parsed;
  } catch (error) {
    console.warn('Gemini API call failed or timed out, using fallback heuristic:', error);
    return heuristicAnalyzeContent(text, fileName, hintType);
  }
}

export async function generateDocumentEmbedding(
  text: string,
  customApiKey?: string | null
): Promise<number[]> {
  const apiKey = customApiKey || process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey.trim() === '') {
    return generateHeuristicVector(text);
  }

  try {
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'text-embedding-004' });

    const result = await model.embedContent(text.slice(0, 2048));
    if (result?.embedding?.values) {
      return result.embedding.values;
    }
  } catch (error) {
    console.warn('Gemini embedding failed, using heuristic vector:', error);
  }

  return generateHeuristicVector(text);
}

export async function askArchiveQuestion(
  question: string,
  contextSnippets: string[],
  customApiKey?: string | null
): Promise<{ answer: string; references: string[] }> {
  const apiKey = customApiKey || process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey.trim() === '') {
    // Generate intelligent contextual response using snippets
    if (contextSnippets.length === 0) {
      return {
        answer: `I searched your personal archive for "${question}", but found no matching records. Try uploading relevant certificates, projects, or documents to expand your knowledge base.`,
        references: [],
      };
    }

    const answer = `Based on your stored archive records, here is the relevant information regarding "${question}":\n\n` +
      contextSnippets.slice(0, 3).map((snip, idx) => `• ${snip}`).join('\n\n') +
      `\n\n*(Tip: Add your Gemini API Key in Settings for deeper LLM reasoning.)*`;

    return {
      answer,
      references: contextSnippets.slice(0, 3),
    };
  }

  try {
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `
You are the AI Assistant for the user's "AI Personal Archive".
Answer the user's question accurately using ONLY the provided archive snippets below.
If the answer cannot be found in the archive records, clearly state that.

User Question: "${question}"

Archive Records Context:
${contextSnippets.map((snip, i) => `[Record ${i + 1}]:\n${snip}`).join('\n\n')}

Provide a structured, helpful, professional answer citing the relevant records.
`;

    const result = await model.generateContent(prompt);
    return {
      answer: result.response.text() || 'Unable to generate response.',
      references: contextSnippets.slice(0, 3),
    };
  } catch (error) {
    console.warn('Gemini askArchiveQuestion failed, using fallback:', error);
    return {
      answer: `Found ${contextSnippets.length} relevant archive records matching your query "${question}":\n\n` +
        contextSnippets.slice(0, 3).map((s, i) => `${i + 1}. ${s}`).join('\n\n'),
      references: contextSnippets.slice(0, 3),
    };
  }
}
