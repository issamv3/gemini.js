export class Rpc {
  constructor({ rid, data, id = 'generic' }) {
    this.rid = rid;
    this.data = data;
    this.id = id;
  }
  serialize() { return [this.rid, this.data, null, this.id]; }
}
