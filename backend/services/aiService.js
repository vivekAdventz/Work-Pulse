import { GoogleGenAI } from '@google/genai';
import { GEMINI_API_KEY } from '../config/env.js';

let ai = null;

const apiKey = GEMINI_API_KEY;
if (apiKey) {
  try {
    ai = new GoogleGenAI({ apiKey });
    console.log('Gemini API configured successfully.');
  } catch (e) {
    console.log(`Gemini API configuration error: ${e.message}`);
  }
} else {
  console.log('WARNING: GEMINI_API_KEY not found. AI features will be disabled.');
}

export async function generateSummary(timeEntries, fullDb) {
  if (!ai) {
    throw Object.assign(new Error('Gemini API is not configured on the server.'), { statusCode: 500 });
  }

  if (!timeEntries || timeEntries.length === 0) {
    return 'No time entries were provided to summarize.';
  }

  const userMap = Object.fromEntries((fullDb.users || []).map((u) => [u.id, u.name]));
  const projectMap = Object.fromEntries((fullDb.projects || []).map((p) => [p.id, p.name]));

  const simplified = timeEntries.map((entry) => ({
    employee: userMap[entry.userId] || 'Unknown',
    project: projectMap[entry.projectId] || 'Unknown',
    date: entry.date,
    hours: entry.hours,
    description: entry.description || 'N/A',
  }));

  const prompt = `
You are an expert project manager analyzing a team's timesheet data.
Based on the following JSON data of time entries, provide a concise, professional summary.
Your summary should highlight:
1.  The total hours logged.
2.  Which projects received the most attention.
3.  Any potential patterns or insights a manager should be aware of.
4.  Use bullet points for clarity.

Do not just list the data; provide actionable insights.

Data:
${JSON.stringify(simplified, null, 2)}
`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
  });
  
  return response.text;
}

export async function generateDescription(promptMessage) {
  if (!ai) {
    throw Object.assign(new Error('Gemini API is not configured on the server.'), { statusCode: 500 });
  }

  if (!promptMessage || promptMessage.trim().length === 0) {
    throw Object.assign(new Error('No prompt provided.'), { statusCode: 400 });
  }

  const systemPrompt = `
You are a professional assistant helping an employee write a clear, concise, and professional timesheet task description.
The user has provided some rough notes or a brief sequence of activities.
Rewrite these notes into a professional description using bullet points.
Ensure the tone is objective and highlights the value of the work done.
Do not include any introductory or concluding remarks, only the bullet points.

User Notes:
${promptMessage}
`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: systemPrompt,
  });
  
  return response.text;
}

export async function generateProjectConfig(userPrompt, existingProjectNames) {
  if (!ai) {
    throw Object.assign(new Error('Gemini API is not configured on the server.'), { statusCode: 500 });
  }

  if (!userPrompt || userPrompt.trim().length === 0) {
    throw Object.assign(new Error('No prompt provided.'), { statusCode: 400 });
  }

  const existingNames = (existingProjectNames || []).join(', ') || 'none';

  const systemPrompt = `You are a project configuration assistant. Based on the user's description, extract and return ONLY a valid JSON object (no markdown fences, no explanation) with exactly this structure:

{
  "projectName": "<unique project name - must NOT match any of these existing names: ${existingNames}>",
  "companyName": "<company or client name>",
  "purpose": "<brief purpose or objective of the project, 1-2 sentences>",
  "yourRole": "<the user's role in this project>",
  "stakeholderName": "<key stakeholder or sponsor name>",
  "subProjects": ["<sub-project 1>", "<sub-project 2>", "<sub-project 3>"]
}

Rules:
- projectName must be short, clear and unique compared to existing names.
- subProjects must be an array of 2 to 5 logical work-streams or phases.
- If any field cannot be inferred, make a reasonable professional guess.
- Return ONLY the raw JSON object. No markdown. No extra text.

User description:
${userPrompt}`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: systemPrompt,
  });

  const raw = response.text.trim()
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '');

  try {
    return JSON.parse(raw);
  } catch {
    throw Object.assign(new Error('AI returned invalid JSON. Please try again with a clearer description.'), { statusCode: 500 });
  }
}
