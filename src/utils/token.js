import fs from 'fs/promises';
import path from 'path';
import { EP, HD } from '../constants.js';
import { AuthError } from '../errors.js';

export const CACHE = process.env.GEMINI_COOKIE_PATH || path.join(process.cwd(), '.cache');

const pfetch = async (px, url, opts = {}) => {
  const o = { ...opts, redirect: 'follow' };
  if (px) {
    try {
      const { HttpsProxyAgent } = await import('https-proxy-agent');
      o.agent = new HttpsProxyAgent(px);
    } catch {}
  }
  return fetch(url, o);
};

const req = async (ck, px) => {
  const h = { ...(HD.GEMINI), Cookie: Object.entries(ck).map(([k, v]) => `${k}=${v}`).join('; ') };
  const r = await pfetch(px, EP.INIT, { headers: h });
  if (!r.ok) throw new AuthError(`Init failed: ${r.status}`);
  return [r, ck];
};

export const load = async (psid) => {
  try {
    await fs.mkdir(CACHE, { recursive: true });
    const fp = path.join(CACHE, `.cached_1psidts_${psid}.txt`);
    const d = await fs.readFile(fp, 'utf-8');
    return d.trim() || null;
  } catch { return null; }
};

export const save = async (psid, token) => {
  try {
    await fs.mkdir(CACHE, { recursive: true });
    const fp = path.join(CACHE, `.cached_1psidts_${psid}.txt`);
    await fs.writeFile(fp, token);
  } catch {}
};

export const getToken = async (bc, px = null) => {
  const xc = {};
  try {
    const r = await pfetch(px, EP.GOOGLE);
    if (r.ok) {
      const sc = r.headers.get('set-cookie');
      if (sc) {
        for (const c of sc.split(',')) {
          const [kv] = c.split(';');
          const [k, v] = kv.split('=');
          if (k && v) xc[k.trim()] = v.trim();
        }
      }
    }
  } catch {}

  const ts = [];

  if (bc['__Secure-1PSID'] && bc['__Secure-1PSIDTS']) {
    ts.push(req({ ...xc, ...bc }, px));
  }

  if (bc['__Secure-1PSID']) {
    const cc = await load(bc['__Secure-1PSID']);
    if (cc) ts.push(req({ ...xc, ...bc, '__Secure-1PSIDTS': cc }, px));
  }

  if (!ts.length) throw new AuthError('No valid cookies');

  for (const p of ts) {
    try {
      const [r, ck] = await p;
      const t = await r.text();
      const m = t.match(/"SNlM0e":"(.*?)"/);
      if (m) {
        if (ck['__Secure-1PSIDTS']) await save(ck['__Secure-1PSID'], ck['__Secure-1PSIDTS']);
        return [m[1], ck];
      }
    } catch {}
  }

  throw new AuthError('Failed to get access token');
};
