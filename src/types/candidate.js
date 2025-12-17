const unescape = (s) => s ? s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'") : s;

export class Candidate {
  constructor({ rcid, text, think = null, web = [], gen = [] }) {
    this.rcid = rcid;
    this.text = unescape(text);
    this.think = unescape(think);
    this.web = web;
    this.gen = gen;
  }

  get images() { return [...this.web, ...this.gen]; }
  toString() { return this.text; }
}
