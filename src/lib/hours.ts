const DAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const;

type DayKey = typeof DAY_KEYS[number];

function parseRange(range: string): { openMins: number; closeMins: number } | null {
  if (!range || range === 'closed') return null;
  const parts = range.split('-');
  if (parts.length !== 2) return null;
  const [oh, om] = parts[0].split(':').map(Number);
  const [ch, cm] = parts[1].split(':').map(Number);
  const openMins = oh * 60 + om;
  let closeMins = ch * 60 + cm;
  if (closeMins <= openMins) closeMins += 24 * 60; // crosses midnight
  return { openMins, closeMins };
}

function isNowInRange(nowMins: number, range: string, fromPrevDay: boolean): boolean {
  const parsed = parseRange(range);
  if (!parsed) return false;
  const { openMins, closeMins } = parsed;
  // If checking previous day's range, shift nowMins forward by 24h so it's comparable
  const adjustedNow = fromPrevDay ? nowMins + 24 * 60 : nowMins;
  return adjustedNow >= openMins && adjustedNow < closeMins;
}

export function isOpenNow(hours: Record<string, string> | null): boolean | null {
  if (!hours) return null;
  const now = new Date();
  const nowMins = now.getHours() * 60 + now.getMinutes();
  const todayKey = DAY_KEYS[now.getDay()];
  const prevKey = DAY_KEYS[(now.getDay() + 6) % 7] as DayKey;

  const todayRange = hours[todayKey];
  const prevRange = hours[prevKey];

  // Check today's range
  if (todayRange && isNowInRange(nowMins, todayRange, false)) return true;
  // Check if we're in yesterday's overnight window (e.g. Fri 20:00-04:00 checked at Sat 01:30)
  if (prevRange && isNowInRange(nowMins, prevRange, true)) return true;

  return false;
}

export function openUntilString(hours: Record<string, string> | null): string | null {
  if (!hours) return null;
  const now = new Date();
  const nowMins = now.getHours() * 60 + now.getMinutes();
  const todayKey = DAY_KEYS[now.getDay()];
  const prevKey = DAY_KEYS[(now.getDay() + 6) % 7] as DayKey;

  let activeCloseStr: string | null = null;

  const todayRange = hours[todayKey];
  if (todayRange && isNowInRange(nowMins, todayRange, false)) {
    activeCloseStr = todayRange.split('-')[1];
  } else {
    const prevRange = hours[prevKey];
    if (prevRange && isNowInRange(nowMins, prevRange, true)) {
      activeCloseStr = prevRange.split('-')[1];
    }
  }

  if (!activeCloseStr) return null;
  const [ch, cm] = activeCloseStr.split(':').map(Number);
  const h = ch % 12 || 12;
  const ampm = ch >= 12 ? 'PM' : 'AM';
  return `${h}${cm > 0 ? ':' + String(cm).padStart(2, '0') : ''} ${ampm}`;
}
