export class Identifier {
  static readonly HEAD = new Identifier(0, "HEAD");

  readonly counter: number;
  readonly siteId: string;

  constructor(counter: number, siteId: string) {
    this.counter = counter;
    this.siteId = siteId;
  }

  compare(other: Identifier): number {
    if (this.counter !== other.counter) {
      return this.counter - other.counter;
    }
    return this.siteId.localeCompare(other.siteId);
  }

  equals(other: Identifier): boolean {
    return (
      this.counter === other.counter &&
      this.siteId === other.siteId
    );
  }

  toString(): string {
    return `(${this.counter},${this.siteId})`;
  }
}


