import { EP, HD } from '../constants.js';
import { AuthError } from '../errors.js';
import { save } from './token.js';

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

export const rotate = async (ck, px = null) => {
  const h = { ...(HD.ROTATE), Cookie: Object.entries(ck).map(([k, v]) => `${k}=${v}`).join('; ') };
  const r = await pfetch(px, EP.ROTATE, {
    method: 'POST',
    headers: h,
    body: '[000,"-0000000000000000000"]'
  });

  if (r.status === 401) throw new AuthError('Unauthorized');
  if (!r.ok) throw new Error(`Rotate failed: ${r.status}`);

  const sc = r.headers.get('set-cookie');
  if (sc) {
    const m = sc.match(/__Secure-1PSIDTS=([^;]+)/);
    if (m) {
      if (ck['__Secure-1PSID']) await save(ck['__Secure-1PSID'], m[1]);
      return m[1];
    }
  }
  return null;
};
