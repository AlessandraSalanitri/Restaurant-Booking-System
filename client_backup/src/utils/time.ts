export const humanTime = (t: string) => {
  const [H, M] = t.split(':').map(Number);
  const d = new Date(); d.setHours(H, M || 0, 0, 0);
  return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
};

const to24h = (h: number, m: number, ap: string) =>
  `${(ap === 'PM' && h !== 12 ? h + 12 : ap === 'AM' && h === 12 ? 0 : h)
    .toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}:00`;

// 12h - 24h time extraction
export const extractTimes = (reply: string): string[] => {
  const out: string[] = [];

  reply.replace(/\b(\d{1,2}):(\d{2})\s*(AM|PM)\b/gi, (_, hh, mm, ap) => {
    out.push(to24h(Number(hh), Number(mm), ap.toUpperCase()));
    return '';
  });

  reply.replace(/\b(\d{1,2}:\d{2})(?::\d{2})?\b/g, (m) => {
    out.push(/\d{2}:\d{2}:\d{2}$/.test(m) ? m : `${m}:00`);
    return '';
  });

  return Array.from(new Set(out)).sort();
};

// Pull the first date the bot mentions (ISO if possible)
export const extractFirstDateISO = (text: string): string | null => {
  // direct ISO in text
  const iso = text.match(/\b(\d{4}-\d{2}-\d{2})\b/);
  if (iso) return iso[1];

  // "Saturday Aug 16, 2025" or "Saturday, Aug 16, 2025"
  const m = text.match(
    /\b(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday),?\s+([A-Z][a-z]+)\s+(\d{1,2}),\s+(\d{4})\b/
  );
  if (!m) return null;

  const [, , mon, d, y] = m;
  const months = [
    'January','February','March','April','May','June',
    'July','August','September','October','November','December'
  ];
  const idx = months.findIndex(n => n.startsWith(mon));
  if (idx < 0) return null;

  const dt = new Date(Number(y), idx, Number(d));
  if (isNaN(dt.getTime())) return null;

  const mm = String(dt.getMonth() + 1).padStart(2, '0');
  const dd = String(dt.getDate()).padStart(2, '0');
  return `${dt.getFullYear()}-${mm}-${dd}`;
};

// Try to infer party size from nearby text
export const extractPartySize = (text: string): number | null => {
  const m =
    text.match(/\b(?:for|party of)\s*(\d{1,2})\b/i) ||
    text.match(/\b(\d{1,2})\s*(?:people|persons?|guests?)\b/i);
  return m ? parseInt(m[1], 10) : null;
};
