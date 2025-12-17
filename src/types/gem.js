export class Gem {
  constructor({ id, name, desc = null, prompt = null, preset }) {
    this.id = id;
    this.name = name;
    this.desc = desc;
    this.prompt = prompt;
    this.preset = preset;
  }
  toString() { return `Gem(${this.id}, ${this.name})`; }
}

export class Gems extends Map {
  find(id = null, name = null, def = null) {
    if (!id && !name) throw new Error('id or name required');
    if (id) {
      const g = this.get(id);
      if (g) return (!name || g.name === name) ? g : def;
      return def;
    }
    for (const g of this.values()) if (g.name === name) return g;
    return def;
  }

  filter(preset = null, name = null) {
    const r = new Gems();
    for (const [k, g] of this.entries()) {
      if (preset !== null && g.preset !== preset) continue;
      if (name !== null && g.name !== name) continue;
      r.set(k, g);
    }
    return r;
  }

  [Symbol.iterator]() { return this.values(); }
}
