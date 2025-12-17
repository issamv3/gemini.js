export class Output {
  constructor({ data, list, index = 0 }) {
    this.data = data;
    this.list = list;
    this.index = index;
  }

  get text() { return this.list[this.index].text; }
  get think() { return this.list[this.index].think; }
  get images() { return this.list[this.index].images; }
  get rcid() { return this.list[this.index].rcid; }
  toString() { return this.text; }
}
