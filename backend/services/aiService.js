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

  const activityLabel = (entry) => {
    const ids = entry.activityTypeIds?.length
      ? entry.activityTypeIds
      : entry.activityTypeId
        ? [entry.activityTypeId]
        : [];
    const names = ids.map((id) => activityMap[id]).filter(Boolean);
    return names.length ? names.join(', ') : 'N/A';
  };

  const simplified = timeEntries.map((entry) => ({
    employee: userMap[entry.userId] || 'Unknown',
    project: projectMap[entry.projectId] || 'Unknown',
    subProject: subProjectMap[entry.subProjectId] || 'N/A',
    activity: activityLabel(entry),
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
    model: 'gemini-3.1-pro-preview',
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
    model: 'gemini-3.1-pro-preview',
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

  const systemPrompt = `You are a project configuration assistant. Based on the user's description, extract and return ONLY a valid JSON object (no markdown fences, no explanation) with exactly this structure:

{
  "projectName": "<short project name inferred from the description, 1-3 words, title-case>",
  "purpose": "<brief purpose or objective of the project, 1-2 sentences>",
  "suggestedCompanyNames": ["<company name if inferable from the text, optional>"],
  "subProjects": [
    {
      "name": "<sub-project name, at most 5 words>",
      "description": "<one short sentence>",
      "tasks": [
        { "name": "<task title, actionable>", "description": "<optional short clarifier>" },
        ...
      ]
    }
  ]
}

Rules:
- projectName must be a short, meaningful title (1–3 words, title-case).
- suggestedCompanyNames: include only companies clearly mentioned; else use [].
- purpose must define the core goal.
- subProjects: include AT LEAST 5 distinct workstreams or modules relevant to the project (not filler).
- Every sub-project MUST include a "tasks" array with AT LEAST 2 and AT MOST 10 tasks that belong specifically to THAT sub-project.
- Task names must be concise (preferably ≤ 10 words).
- sub-project names MUST be AT MOST 5 words.
- Tasks must be grouped under the correct sub-project (development tasks under backend/frontend/etc. as described).
- Return ONLY raw JSON.

User description:
${userPrompt}`;

  const response = await ai.models.generateContent({
    model: 'gemini-3.1-pro-preview',
    contents: systemPrompt,
  });

  const raw = response.text.trim()
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '');

  try {
    const parsed = JSON.parse(raw);
    // Backward-compat: old clients expected subProjects as string[]
    if (Array.isArray(parsed.subProjects)) {
      parsed.subProjects = parsed.subProjects.map((item) => {
        if (typeof item === 'string') {
          return {
            name: item,
            description: '',
            tasks: [],
          };
        }
        if (!item.tasks && item.name) return { ...item, tasks: [] };
        return item;
      });
    }
    return parsed;
  } catch {
    throw Object.assign(new Error('AI returned invalid JSON. Please try again with a clearer description.'), { statusCode: 500 });
  }
}

export async function fillEntryByAI(userPrompt, projects, subProjects, activityTypes, teamMembers, tasks = []) {
  if (!ai) {
    throw Object.assign(new Error('Gemini API is not configured on the server.'), { statusCode: 500 });
  }

  if (!userPrompt || userPrompt.trim().length === 0) {
    throw Object.assign(new Error('No prompt provided.'), { statusCode: 400 });
  }

  const projectList = (projects || []).map((p) => `- id: "${p.id}", name: "${p.name}"`).join('\n') || 'none';
  const subProjectList = (subProjects || []).map((sp) => `- id: "${sp.id}", name: "${sp.name}", projectId: "${sp.projectId}"`).join('\n') || 'none';
  const taskList = (tasks || [])
    .map((t) => `- id: "${t.id}", name: "${t.name}", subProjectId: "${t.subProjectId}"`)
    .join('\n') || 'none';
  const activityTypeList = (activityTypes || []).map((a) => `- id: "${a.id}", name: "${a.name}"`).join('\n') || 'none';
  const teamMemberList = (teamMembers || []).map((tm) => `- id: "${tm.id}", name: "${tm.name}"`).join('\n') || 'none';

  const systemPrompt = `You are a timesheet assistant. Based on the user's task description, return ONLY a valid JSON object (no markdown, no extra text) with exactly this structure:

{
  "projectId": "<best matching project id from the list, or null if none match>",
  "subProjectIds": ["<sub-project id>", "..."],
  "taskIds": ["<task id>", "..."],
  "activityTypeIds": ["<one or more activity type ids from the list that match the work>"],
  "teamMemberIds": ["<id of team member 1>", "<id of team member 2>"],
  "description": "<professional bullet-point description of the work done, using markdown bullet points (- item)>"
}

Fields subProjectIds and taskIds replace the old single subProjectId. Use legacy only if needed: you may also output subProjectId (single) for backward compat — the server merges into subProjectIds.

Available projects:
${projectList}

Available sub-projects:
${subProjectList}

Available tasks (each belongs to ONE sub-project; only choose tasks whose subProjectId is in your chosen subProjectIds):
${taskList}

Available activity types:
${activityTypeList}

Available team members:
${teamMemberList}

Rules:
- Pick projectId first; then subProjectIds — only sub-projects that belong to that project id.
- subProjectIds: non-empty when the work maps to phases; otherwise []. Prefer the minimal set that matches the description (often 1–3 ids).
- taskIds: include only task ids whose subProjectId is one of your chosen subProjectIds. Pick concrete tasks mentioned or clearly implied by the work (meetings, features, fixes). Prefer 1–8 tasks when relevant; else [].
- If tasks list is "none", set taskIds to [].
- activityTypeIds: non-empty when any activity fits; else [] only if genuinely no match.
- teamMemberIds: who was mentioned or involved; else [].
- If nothing matches for a field, use null or [] as appropriate.
- description: markdown bullets "- ", 3-6 bullets.
- Return ONLY the raw JSON object. No markdown fences. No explanation.

User task description:

${userPrompt}`;

  const response = await ai.models.generateContent({
    model: 'gemini-3.1-pro-preview',
    contents: systemPrompt,
  });

  const raw = response.text.trim()
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '');

  try {
    const parsed = JSON.parse(raw);
    if (parsed.activityTypeId && (!parsed.activityTypeIds || !parsed.activityTypeIds.length)) {
      parsed.activityTypeIds = [parsed.activityTypeId];
      delete parsed.activityTypeId;
    }
    let spIds = Array.isArray(parsed.subProjectIds) ? parsed.subProjectIds : [];
    if (!spIds.length && parsed.subProjectId) spIds = [parsed.subProjectId];
    parsed.subProjectIds = spIds;
    if (parsed.subProjectId) delete parsed.subProjectId;

    if (!Array.isArray(parsed.taskIds)) parsed.taskIds = [];
    return parsed;
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
    model: 'gemini-3.1-pro-preview',
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
