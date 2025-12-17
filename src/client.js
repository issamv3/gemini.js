import { EP, HD, Model, ERR, getModel, customModel, RPC } from './constants.js';
import { AuthError, ApiError, ImageError, GeminiError, TimeoutError, LimitError, ModelError, BlockedError } from './errors.js';
import { Candidate } from './types/candidate.js';
import { Gem, Gems } from './types/gem.js';
import { Rpc } from './types/grpc.js';
import { WebImage, GenImage } from './types/image.js';
import { Output } from './types/output.js';
import { get, json, upload, fname, getToken, rotate, intervals } from './utils/index.js';

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

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

export class Client {
  constructor(psid = null, psidts = null, proxy = null) {
    this.cookies = {};
    this.proxy = proxy;
    this.ready = false;
    this.token = null;
    this.timeout = 300000;
    this.autoClose = false;
    this.closeDelay = 300000;
    this.timer = null;
    this.autoRotate = true;
    this.rotateInt = 540000;
    this.gems = null;
    if (psid) {
      this.cookies['__Secure-1PSID'] = psid;
      if (psidts) this.cookies['__Secure-1PSIDTS'] = psidts;
    }
  }

  async init(timeout = 300000, autoClose = false, closeDelay = 300000, autoRotate = true, rotateInt = 540000) {
    try {
      const [tk, ck] = await getToken(this.cookies, this.proxy);
      this.token = tk;
      this.cookies = ck;
      this.ready = true;
      this.timeout = timeout;
      this.autoClose = autoClose;
      this.closeDelay = closeDelay;
      this.autoRotate = autoRotate;
      this.rotateInt = rotateInt;

      if (this.autoClose) this.resetTimer();
      if (this.autoRotate) {
        const k = this.cookies['__Secure-1PSID'];
        if (intervals.has(k)) clearInterval(intervals.get(k));
        intervals.set(k, setInterval(() => this.silentRotate(), this.rotateInt));
      }
    } catch (e) {
      await this.close();
      throw e;
    }
  }

  async close(delay = 0) {
    if (delay) await sleep(delay);
    this.ready = false;
    if (this.timer) { clearTimeout(this.timer); this.timer = null; }
  }

  resetTimer() {
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => this.close(), this.closeDelay);
  }

  async silentRotate() {
    try {
      const n = await rotate(this.cookies, this.proxy);
      if (n) this.cookies['__Secure-1PSIDTS'] = n;
    } catch (e) {
      if (e instanceof AuthError) {
        const k = this.cookies['__Secure-1PSID'];
        if (intervals.has(k)) { clearInterval(intervals.get(k)); intervals.delete(k); }
      }
    }
  }

  async retry(fn, rt = 2, ...a) {
    for (let i = 0; i <= rt; i++) {
      try {
        if (!this.ready) await this.init(this.timeout, this.autoClose, this.closeDelay, this.autoRotate, this.rotateInt);
        return await fn.apply(this, a);
      } catch (e) {
        if (e instanceof ApiError && i < rt) { await sleep(1000); continue; }
        throw e;
      }
    }
  }

  async ask(prompt, files = null, model = Model.DEFAULT, gem = null, chat = null, rt = 2) {
    return this.retry(this.doAsk, rt, prompt, files, model, gem, chat);
  }

  async doAsk(prompt, files, model, gem, chat) {
    if (!prompt) throw new Error('Prompt required');

    if (typeof model === 'string') model = getModel(model);
    else if (typeof model === 'object' && !model.name) model = customModel(model);

    const gid = gem instanceof Gem ? gem.id : gem;
    if (this.autoClose) this.resetTimer();

    const h = { ...(HD.GEMINI), ...model.headers, Cookie: Object.entries(this.cookies).map(([k, v]) => `${k}=${v}`).join('; ') };
    const uf = files ? await Promise.all(files.map(async f => [[await upload(f, this.proxy)], fname(f)])) : null;
    const pl = [
      uf ? [prompt, 0, null, uf] : [prompt],
      null,
      chat ? chat.data : null
    ];
    if (gid) pl.push(...Array(16).fill(null), gid);

    const bd = new URLSearchParams();
    bd.append('at', this.token);
    bd.append('f.req', JSON.stringify([null, JSON.stringify(pl)]));

    const ctrl = new AbortController();
    const tid = setTimeout(() => ctrl.abort(), this.timeout);

    let rs;
    try {
      rs = await pfetch(this.proxy, EP.STREAM, { method: 'POST', headers: h, body: bd, signal: ctrl.signal });
    } catch (e) {
      clearTimeout(tid);
      if (e.name === 'AbortError') throw new TimeoutError('Request timed out');
      throw e;
    }
    clearTimeout(tid);

    if (!rs.ok) { await this.close(); throw new ApiError(`Request failed: ${rs.status}`); }

    const tx = await rs.text();
    let rj = [], bj = [], bi = 0;

    try {
      rj = json(tx);
   //   fs.writeFileSync('rj_debug.json', JSON.stringify(rj, null, 2));
      for (let pi = 0; pi < rj.length; pi++) {
        try {
          const pb = get(rj[pi], [2]);
          if (!pb) continue;
          const pj = JSON.parse(pb);
          if (get(pj, [4])) { bi = pi; bj = pj; break; }
        } catch { continue; }
      }
      if (!bj.length) throw new Error();
    } catch {
      await this.close();
      const ec = get(rj, [0, 5, 2, 0, 1, 0], -1);
      if (ec === ERR.LIMIT) throw new LimitError('Usage limit exceeded');
      if (ec === ERR.MODEL || ec === ERR.HEADER) throw new ModelError('Model invalid');
      if (ec === ERR.BLOCKED) throw new BlockedError('IP blocked');
      throw new ApiError('Invalid response');
    }

    const cl = get(bj, [4], []);
    const out = [];

    for (let ci = 0; ci < cl.length; ci++) {
      const cd = cl[ci];
      const rcid = get(cd, [0]);
      if (!rcid) continue;

      let txt = get(cd, [1, 0], '');
      if (/^http:\/\/googleusercontent\.com\/card_content\/\d+/.test(txt)) {
        txt = get(cd, [22, 0]) || txt;
      }
      const think = get(cd, [37, 0, 0]);

      const web = [];
      for (const wd of get(cd, [12, 1], [])) {
        const u = get(wd, [0, 0, 0]);
        if (u) web.push(new WebImage({ url: u, title: get(wd, [7, 0], ''), alt: get(wd, [0, 4], ''), proxy: this.proxy }));
      }

      const gen = [];
      if (get(cd, [12, 7, 0])) {
        let ij = null;
        for (let ipi = bi; ipi < rj.length; ipi++) {
          try {
            const ipb = get(rj[ipi], [2]);
            if (!ipb) continue;
            const ipj = JSON.parse(ipb);
            if (get(ipj, [4, ci, 12, 7, 0])) { ij = ipj; break; }
          } catch { continue; }
        }
        if (!ij) throw new ImageError('Failed to parse images');

        const ic = get(ij, [4, ci], []);
        const ft = get(ic, [1, 0]);
        if (ft) txt = ft.replace(/http:\/\/googleusercontent\.com\/image_generation_content\/\d+/g, '').trim();

        for (let ii = 0; ii < get(ic, [12, 7, 0], []).length; ii++) {
          const gd = get(ic, [12, 7, 0, ii]);
          const u = get(gd, [0, 3, 3]);
          if (!u) continue;
          const nm = get(gd, [3, 6]);
          const al = get(gd, [3, 5], []);
          gen.push(new GenImage({
            url: u,
            title: nm ? `[Generated ${nm}]` : '[Generated]',
            alt: get(al, [ii]) || get(al, [0]) || '',
            proxy: this.proxy,
            cookies: this.cookies
          }));
        }
      }

      out.push(new Candidate({ rcid, text: txt, think, web, gen }));
    }

    if (!out.length) throw new GeminiError('No output found');
    const responseData = get(bj, [1], []);
    const op = new Output({ data: responseData, list: out });
    if (chat) {
      chat.last = op;
      chat.data = responseData;
      if (out[0]?.rcid) chat.data[2] = out[0].rcid;
    }
    return op;
  }

  chat(model = Model.DEFAULT, gem = null) { return new Chat(this, model, gem); }

  async batch(payloads, rt = 2) {
    return this.retry(this.doBatch, rt, payloads);
  }

  async doBatch(payloads) {
    const h = { ...(HD.GEMINI), Cookie: Object.entries(this.cookies).map(([k, v]) => `${k}=${v}`).join('; ') };
    const bd = new URLSearchParams();
    bd.append('at', this.token);
    bd.append('f.req', JSON.stringify([payloads.map(p => p.serialize())]));

    const ctrl = new AbortController();
    const tid = setTimeout(() => ctrl.abort(), this.timeout);

    let rs;
    try {
      rs = await pfetch(this.proxy, EP.BATCH, { method: 'POST', headers: h, body: bd, signal: ctrl.signal });
    } catch (e) {
      clearTimeout(tid);
      if (e.name === 'AbortError') throw new TimeoutError('Request timed out');
      throw e;
    }
    clearTimeout(tid);

    if (!rs.ok) { await this.close(); throw new ApiError(`Batch failed: ${rs.status}`); }
    return rs;
  }

  async getGems(hidden = false) {
    const rs = await this.batch([
      new Rpc({ rid: RPC.LIST_GEMS, data: hidden ? '[4]' : '[3]', id: 'system' }),
      new Rpc({ rid: RPC.LIST_GEMS, data: '[2]', id: 'custom' })
    ]);

    const tx = await rs.text();
    const rj = JSON.parse(tx.split('\n')[2]);
    let pg = [], cg = [];

    for (const pt of rj) {
      if (pt[pt.length - 1] === 'system') pg = JSON.parse(pt[2])[2] || [];
      else if (pt[pt.length - 1] === 'custom') {
        const cc = JSON.parse(pt[2]);
        if (cc) cg = cc[2] || [];
      }
    }

    this.gems = new Gems();
    for (const g of pg) this.gems.set(g[0], new Gem({ id: g[0], name: g[1][0], desc: g[1][1], prompt: g[2]?.[0], preset: true }));
    for (const g of cg) this.gems.set(g[0], new Gem({ id: g[0], name: g[1][0], desc: g[1][1], prompt: g[2]?.[0], preset: false }));
    return this.gems;
  }

  async createGem(name, prompt, desc = '') {
    const rs = await this.batch([
      new Rpc({ rid: RPC.CREATE_GEM, data: JSON.stringify([[name, desc, prompt, null, null, null, null, null, 0, null, 1, null, null, null, []]]) })
    ]);
    const tx = await rs.text();
    const rj = JSON.parse(tx.split('\n')[2]);
    const id = JSON.parse(rj[0][2])[0];
    return new Gem({ id, name, desc, prompt, preset: false });
  }

  async updateGem(gem, name, prompt, desc = '') {
    const id = gem instanceof Gem ? gem.id : gem;
    await this.batch([
      new Rpc({ rid: RPC.UPDATE_GEM, data: JSON.stringify([id, [name, desc, prompt, null, null, null, null, null, 0, null, 1, null, null, null, [], 0]]) })
    ]);
    return new Gem({ id, name, desc, prompt, preset: false });
  }

  async deleteGem(gem) {
    const id = gem instanceof Gem ? gem.id : gem;
    await this.batch([new Rpc({ rid: RPC.DELETE_GEM, data: JSON.stringify([id]) })]);
  }
}

export class Chat {
  constructor(client, model = Model.DEFAULT, gem = null, data = null, cid = null, rid = null, rcid = null) {
    this.client = client;
    this.model = model;
    this.gem = gem;
    this.data = [null, null, null];
    this.last = null;
    if (data) this.data = [...data, ...Array(3 - data.length).fill(null)].slice(0, 3);
    if (cid) this.data[0] = cid;
    if (rid) this.data[1] = rid;
    if (rcid) this.data[2] = rcid;
  }

  async send(prompt, files = null) {
    return this.client.ask(prompt, files, this.model, this.gem, this);
  }

  choose(i) {
    if (!this.last) throw new Error('No previous output');
    if (i >= this.last.list.length) throw new Error('Index out of range');
    this.last.index = i;
    this.data[2] = this.last.rcid;
    return this.last;
  }

  get cid() { return this.data[0]; }
  set cid(v) { this.data[0] = v; }
  get rid() { return this.data[1]; }
  set rid(v) { this.data[1] = v; }
  get rcid() { return this.data[2]; }
  set rcid(v) { this.data[2] = v; }
}
