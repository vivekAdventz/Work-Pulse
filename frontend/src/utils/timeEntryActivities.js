/** Normalize legacy single activityTypeId vs activityTypeIds array */
export function getActivityTypeIds(entry) {
  if (!entry) return [];
  const ids = entry.activityTypeIds;
  if (Array.isArray(ids) && ids.length) return ids;
  if (entry.activityTypeId) return [entry.activityTypeId];
  return [];
}

export function activityNamesForEntry(entry, activityTypes) {
  const map = new Map(activityTypes.map((a) => [a.id, a.name]));
  return getActivityTypeIds(entry).map((id) => map.get(id)).filter(Boolean);
}

/** Comma-separated labels for tables */
export function formatActivities(entry, activityTypes) {
  const names = activityNamesForEntry(entry, activityTypes);
  return names.length ? names.join(', ') : 'N/A';
}

export function entryMatchesActivityFilter(entry, activityFilterId) {
  return getActivityTypeIds(entry).includes(activityFilterId);
}
