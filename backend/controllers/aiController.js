import { generateSummary as aiGenerateSummary, generateDescription as aiGenerateDescription } from '../services/aiService.js';

export const generateSummary = async (req, res) => {
  const { timeEntries, fullDb } = req.body;
  const summary = await aiGenerateSummary(timeEntries, fullDb);
  res.json({ summary });
};

export const generateDescription = async (req, res) => {
  const { prompt } = req.body;
  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is required' });
  }
  const description = await aiGenerateDescription(prompt);
  res.json({ description });
};

export const downloadCsv = (req, res) => {
  const { entries } = req.body;
  if (!entries || entries.length === 0) {
    return res.status(400).json({ error: 'No entries provided' });
  }

  const headers = Object.keys(entries[0]);
  const csvRows = [headers.join(',')];

  for (const entry of entries) {
    const values = headers.map((h) => {
      const val = String(entry[h] ?? '').replace(/"/g, '""');
      return `"${val}"`;
    });
    csvRows.push(values.join(','));
  }

  res.setHeader('Content-Disposition', 'attachment; filename=timesheet.csv');
  res.setHeader('Content-Type', 'text/csv');
  res.send(csvRows.join('\n'));
};
