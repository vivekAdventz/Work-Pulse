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

export async function generateSummary(timeEntries, fullDb, reportType = 'employee') {
  if (!ai) {
    throw Object.assign(new Error('Gemini API is not configured on the server.'), { statusCode: 500 });
  }

  if (!timeEntries || timeEntries.length === 0) {
    return 'No time entries were provided to summarize.';
  }

  const userMap = Object.fromEntries((fullDb.users || []).map((u) => [u.id, u.name]));
  const projectMap = Object.fromEntries((fullDb.projects || []).map((p) => [p.id, p.name]));
  const subProjectMap = Object.fromEntries((fullDb.subProjects || []).map((sp) => [sp.id, sp.name]));
  const activityMap = Object.fromEntries((fullDb.activityTypes || []).map((a) => [a.id, a.name]));

  const simplified = timeEntries.map((entry) => ({
    employee: userMap[entry.userId] || 'Unknown',
    project: projectMap[entry.projectId] || 'Unknown',
    subProject: subProjectMap[entry.subProjectId] || 'N/A',
    activity: activityMap[entry.activityTypeId] || 'N/A',
    date: entry.date,
    hours: entry.hours,
    description: entry.description || 'N/A',
  }));

  // Compute date range
  const dates = timeEntries.map(e => e.date).filter(Boolean).sort();
  const startDate = dates[0] || 'N/A';
  const endDate = dates[dates.length - 1] || 'N/A';
  const totalHours = timeEntries.reduce((sum, e) => sum + (e.hours || 0), 0).toFixed(2);

  let prompt;

  if (reportType === 'manager') {
    prompt = `You are an expert project manager generating a TEAM PERFORMANCE REPORT from timesheet data.
You MUST follow this EXACT structure — use the same headings and table formats every time. Do NOT deviate.

---

## Team Performance Report
**Period:** ${startDate} to ${endDate}
**Total Hours Logged:** ${totalHours} hrs

---

### Summary
Write 3-5 bullet points summarizing overall team performance, key accomplishments, and any concerns.

---

### Employee-wise Breakdown

For EACH employee in the data, create a section like this:

#### [Employee Name]
- **Total Hours:** X hrs

| Project | Sub-Project | Activity | Hours | Key Work |
|---------|------------|----------|-------|----------|
| ... | ... | ... | ... | brief summary |

---

### Project Overview

| Project | Total Hours | Contributors | % of Total |
|---------|-------------|-------------|------------|
| ... | ... | ... | ... |

---

### Insights & Recommendations
Write 3-5 actionable bullet points about workload balance, project focus, and productivity patterns.

---

RULES:
- Use ONLY the data provided. Do NOT invent data.
- Every table must have the exact column headers shown above.
- Keep "Key Work" to under 10 words per row.
- DO NOT add extra sections or change the headings.
- Use markdown tables with proper alignment.
- Round hours to 2 decimal places.

Data:
${JSON.stringify(simplified, null, 2)}`;
  } else {
    prompt = `You are a professional assistant generating a PERSONAL TIMESHEET REPORT from an employee's time entries.
You MUST follow this EXACT structure — use the same headings and table formats every time. Do NOT deviate.

---

## My Timesheet Report
**Period:** ${startDate} to ${endDate}
**Total Hours Logged:** ${totalHours} hrs

---

### Summary
Write 3-5 bullet points summarizing productivity, focus areas, and accomplishments during this period.

---

### Project-wise Breakdown

For EACH project in the data, create a section like this:

#### [Project Name]
- **Total Hours:** X hrs

| Date | Sub-Project | Activity | Hours | Description |
|------|------------|----------|-------|-------------|
| ... | ... | ... | ... | brief summary |

---

### Time Distribution

| Project | Hours | % of Total |
|---------|-------|------------|
| ... | ... | ... |

---

### Highlights & Notes
Write 3-5 bullet points about key accomplishments, challenges faced, or things to follow up on.

---

RULES:
- Use ONLY the data provided. Do NOT invent data.
- Every table must have the exact column headers shown above.
- Keep descriptions to under 10 words per row.
- DO NOT add extra sections or change the headings.
- Use markdown tables with proper alignment.
- Round hours to 2 decimal places.

Data:
${JSON.stringify(simplified, null, 2)}`;
  }

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

  const existingNames = 'none'; // Unused, keeping signature backward-compatible

  const systemPrompt = `You are a project configuration assistant. Based on the user's description, extract and return ONLY a valid JSON object (no markdown fences, no explanation) with exactly this structure:

{
  "projectName": "<short project name inferred from the description, 1-3 words, title-case>",
  "purpose": "<brief purpose or objective of the project, 1-2 sentences>",
  "subProjects": ["<sub-project 1>", "<sub-project 2>", "<sub-project 3>"]
}

Rules:
- projectName must be a short, meaningful title for the project (1–3 words, title-case) inferred from the user's description.
- purpose must define the core goal logically.
- subProjects must be an array of AT LEAST 10 logical work-streams, modules, or functional areas.
- CRITICAL: Every subProject name must be AT MOST 3 WORDS. Use concise module-style names like "AI Chatbot Engine", "HR Admin Dashboard", "Auth & Permissions", "Analytics Module", "Deployment & Infrastructure".
- IMPORTANT: Ensure the subProjects are NOT generic. They MUST be highly specific and tailored based on the user's role and the project described.
- For software engineering, web development, or backend development roles, generate subprojects that reflect real technical components: e.g. frontend UI, backend API, database layer, auth system, admin portal, integrations, testing, deployment, etc. — named in 3 words or fewer.
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

export async function generateTaskPlan(projectName, subProjectName, description, teamMembers, subProjects) {
  if (!ai) {
    throw Object.assign(new Error('Gemini API is not configured on the server.'), { statusCode: 500 });
  }

  const today = new Date().toISOString().split('T')[0];
  const teamList = (teamMembers || []).map(t => `- id: "${t.id}", name: "${t.name}"`).join('\n') || 'none';
  const subProjList = (subProjects || []).map(sp => `- id: "${sp.id}", name: "${sp.name}"`).join('\n') || 'none';

  const systemPrompt = `You are a project planner. Given a project, phase, and description, generate a task plan across multiple days.

Return ONLY a valid JSON array (no markdown, no extra text) with this structure:
[
  {
    "taskNumber": 1,
    "title": "short task title (max 10 words)",
    "description": "1-2 sentence description of the task",
    "date": "YYYY-MM-DD",
    "assigneeId": "best matching team member id or null",
    "subProjectId": "best matching sub-project id or null",
    "dependsOn": null or taskNumber of the prerequisite task
  },
  ...
]

RULES:
- Generate 5-15 tasks spread across 3-7 days starting from ${today}
- Each task must have a date in YYYY-MM-DD format
- Tasks on a given day can ONLY depend on tasks from the SAME day or EARLIER days, NEVER later days
- dependsOn references the taskNumber (integer) of the prerequisite task, or null if none
- Assign tasks to team members from the list. Distribute work evenly.
- Map each task to the most relevant sub-project from the list.
- Tasks should follow a logical execution order (planning → implementation → review → testing)
- Skip weekends (Saturday=6, Sunday=0)
- Return ONLY the raw JSON array. No markdown fences.

Project: ${projectName}
Phase: ${subProjectName}
Description: ${description}

Available team members:
${teamList}

Available sub-projects (phases):
${subProjList}`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: systemPrompt,
  });

  const raw = response.text.trim()
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '');

  try {
    const tasks = JSON.parse(raw);
    if (!Array.isArray(tasks)) throw new Error('Not an array');
    return tasks;
  } catch {
    throw Object.assign(new Error('AI returned invalid plan. Please try again with a clearer description.'), { statusCode: 500 });
  }
}
