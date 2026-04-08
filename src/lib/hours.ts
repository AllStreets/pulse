const DAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const;

export function isOpenNow(hours: Record<string, string> | null): boolean | null {
  if (!hours) return null;
  const now = new Date();
  const dayKey = DAY_KEYS[now.getDay()];
  const range = hours[dayKey];
  if (!range || range === 'closed') return false;

  const [openStr, closeStr] = range.split('-');
  const [oh, om] = openStr.split(':').map(Number);
  const [ch, cm] = closeStr.split(':').map(Number);

  const nowMins = now.getHours() * 60 + now.getMinutes();
  const openMins = oh * 60 + om;
  let closeMins = ch * 60 + cm;
  if (closeMins < openMins) closeMins += 24 * 60; // crosses midnight

  const adjustedNow = nowMins < openMins ? nowMins + 24 * 60 : nowMins;
  return adjustedNow >= openMins && adjustedNow < closeMins;
}

export function openUntilString(hours: Record<string, string> | null): string | null {
  if (!hours) return null;
  const now = new Date();
  const dayKey = DAY_KEYS[now.getDay()];
  const range = hours[dayKey];
  if (!range || range === 'closed') return null;
  const closeStr = range.split('-')[1];
  const [ch, cm] = closeStr.split(':').map(Number);
  const h = ch % 12 || 12;
  const ampm = ch >= 12 ? 'PM' : 'AM';
  return `${h}${cm > 0 ? ':' + String(cm).padStart(2, '0') : ''} ${ampm}`;
}
