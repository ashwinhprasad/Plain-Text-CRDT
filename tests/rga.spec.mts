import { describe, it, expect } from "vitest";
import { RgaReplica } from "../src/rgaReplica.mjs";
import { Identifier } from "../src/identifier.mjs";

describe("RGA CRDT", () => {

  it("single replica sequential insert", () => {
    const r1 = new RgaReplica("A");

    r1.insert(Identifier.HEAD, "H");
    r1.insert(r1.document().lastId(), "e");
    r1.insert(r1.document().lastId(), "l");
    r1.insert(r1.document().lastId(), "l");
    r1.insert(r1.document().lastId(), "o");

    expect(r1.document().getText()).toBe("Hello");
  });

  it("forked replica has same state", () => {
    const r1 = new RgaReplica("A");

    r1.insert(Identifier.HEAD, "H");
    r1.insert(r1.document().lastId(), "i");

    const r2 = r1.fork();

    expect(r1.document().getText()).toBe("Hi");
    expect(r2.document().getText()).toBe("Hi");
  });

  it("manual operation delivery", () => {
    const r1 = new RgaReplica("A");
    const r2 = r1.fork();

    const op = r1.insert(Identifier.HEAD, "X");
    r2.apply(op);

    expect(r1.document().getText()).toBe("X");
    expect(r2.document().getText()).toBe("X");
  });

  it("concurrent inserts converge deterministically", () => {
    const r1 = new RgaReplica("A");
    const r2 = r1.fork();

    const op1 = r1.insert(Identifier.HEAD, "A");
    const op2 = r2.insert(Identifier.HEAD, "B");

    r1.apply(op2);
    r2.apply(op1);

    expect(r1.document().getText()).toBe(r2.document().getText());
  });

  it("delete converges correctly", () => {
    const r1 = new RgaReplica("A");
    const r2 = r1.fork();

    const op1 = r1.insert(Identifier.HEAD, "H");
    const op2 = r1.insert(op1.id, "i");

    r2.apply(op1);
    r2.apply(op2);

    const del = r2.delete(op1.id);

    r1.apply(del);

    expect(r1.document().getText()).toBe("i");
    expect(r2.document().getText()).toBe("i");
  });
});
