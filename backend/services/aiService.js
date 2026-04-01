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
  "companyNames": ["<company 1>", "<company 2>"],
  "purpose": "<brief purpose or objective of the project, 1-2 sentences>",
  "yourRole": "<the user's role in this project>",
  "stakeholderNames": ["<stakeholder 1>", "<stakeholder 2>"],
  "subProjects": ["<sub-project 1>", "<sub-project 2>", "<sub-project 3>"]
}

Rules:
- projectName must be short, clear and unique compared to existing names.
- companyNames and stakeholderNames must be arrays. Extract all relevant entities.
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

export async function fillEntryByAI(userPrompt, projects, subProjects, activityTypes, teamMembers) {
  if (!ai) {
    throw Object.assign(new Error('Gemini API is not configured on the server.'), { statusCode: 500 });
  }

  if (!userPrompt || userPrompt.trim().length === 0) {
    throw Object.assign(new Error('No prompt provided.'), { statusCode: 400 });
  }

  const projectList = (projects || []).map((p) => `- id: "${p.id}", name: "${p.name}"`).join('\n') || 'none';
  const subProjectList = (subProjects || []).map((sp) => `- id: "${sp.id}", name: "${sp.name}", projectId: "${sp.projectId}"`).join('\n') || 'none';
  const activityTypeList = (activityTypes || []).map((a) => `- id: "${a.id}", name: "${a.name}"`).join('\n') || 'none';
  const teamMemberList = (teamMembers || []).map((tm) => `- id: "${tm.id}", name: "${tm.name}"`).join('\n') || 'none';

  const systemPrompt = `You are a timesheet assistant. Based on the user's task description, return ONLY a valid JSON object (no markdown, no extra text) with exactly this structure:

{
  "projectId": "<best matching project id from the list, or null if none match>",
  "subProjectId": "<best matching sub-project id from the list that belongs to the chosen project, or null>",
  "activityTypeId": "<best matching activity type id from the list, or null>",
  "teamMemberIds": ["<id of team member 1>", "<id of team member 2>"],
  "description": "<professional bullet-point description of the work done, using markdown bullet points (- item)>"
}

Available projects:
${projectList}

Available sub-projects:
${subProjectList}

Available activity types:
${activityTypeList}

Available team members:
${teamMemberList}

Rules:
- Match projectId, subProjectId, activityTypeId, and teamMemberIds by comparing the user's description to the names semantically. Choose the closest matches.
- teamMemberIds should be an array of project member IDs who were mentioned or likely involved. If none, return empty array [].
- If no reasonable match exists for IDs, set the field to null (or [] for teamMemberIds).
- description must use markdown bullet points (lines starting with "- "). Write 3-6 concise professional bullets describing what was done.
- Return ONLY the raw JSON object. No markdown fences. No explanation.

User task description:
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
    throw Object.assign(new Error('AI returned invalid JSON. Please try again.'), { statusCode: 500 });
  }
}
