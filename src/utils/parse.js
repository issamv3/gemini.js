export const get = (d, p, def = null) => {
  let c = d;
  for (const k of p) {
    try { c = c[k]; }
    catch { return def; }
    if (c === undefined || c === null) return def;
  }
  return c ?? def;
};

export const json = (t) => {
  if (typeof t !== 'string') throw new TypeError('Expected string');
  for (const l of t.split('\n')) {
    try { return JSON.parse(l.trim()); }
    catch { continue; }
  }
  throw new Error('No valid JSON found');
};
