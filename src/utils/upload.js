import fs from 'fs/promises';
import path from 'path';
import axios from 'axios';
import { EP, HD } from '../constants.js';

const pf = async (px, url) => {
  const o = { redirect: 'follow' };
  if (px) {
    try {
      const { HttpsProxyAgent } = await import('https-proxy-agent');
      o.agent = new HttpsProxyAgent(px);
    } catch {}
  }
  return fetch(url, o);
};

export const upload = async (fp, px = null) => {
  let buf, fn;

  if (fp.startsWith('http://') || fp.startsWith('https://')) {
    const res = await pf(px, fp);
    if (!res.ok) throw new Error(`Failed to fetch URL: ${res.status}`);
    buf = Buffer.from(await res.arrayBuffer());
    fn = path.basename(new URL(fp).pathname) || 'file';
  } else {
    buf = await fs.readFile(fp);
    fn = path.basename(fp);
  }

  const cfg = {
    method: 'post',
    url: EP.UPLOAD,
    headers: { ...HD.UPLOAD},
    data: buf,
    maxBodyLength: Infinity
  };

  if (px) {
    const { HttpsProxyAgent } = await import('https-proxy-agent');
    cfg.httpsAgent = new HttpsProxyAgent(px);
  }

  const r = await axios(cfg);
  return r.data;
};

export const fname = (fp) => {
  if (fp.startsWith('http://') || fp.startsWith('https://')) {
    return path.basename(new URL(fp).pathname) || 'file';
  }
  return path.basename(fp);
};