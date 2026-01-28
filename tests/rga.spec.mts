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

  it("empty replica starts with empty document", () => {
    const r = new RgaReplica("A");
    expect(r.document().getText()).toBe("");
  });


  it("deleting the same id twice is idempotent", () => {
    const r = new RgaReplica("A");

    const op = r.insert(Identifier.HEAD, "X");
    r.delete(op.id);

    expect(() => r.delete(op.id)).not.toThrow();
    expect(r.document().getText()).toBe("");
  });


  it("applying the same insert twice does not duplicate content", () => {
    const r1 = new RgaReplica("A");
    const r2 = r1.fork();

    const op = r1.insert(Identifier.HEAD, "X");

    r2.apply(op);
    r2.apply(op); // duplicate delivery

    expect(r2.document().getText()).toBe("X");
  });


  it("three replicas converge after mixed operations", () => {
    const r1 = new RgaReplica("A");
    const r2 = r1.fork();
    const r3 = r1.fork();

    const op1 = r1.insert(Identifier.HEAD, "A");
    const op2 = r2.insert(Identifier.HEAD, "B");
    const op3 = r3.insert(Identifier.HEAD, "C");

    // Shuffle delivery
    r1.apply(op2);
    r1.apply(op3);

    r2.apply(op1);
    r2.apply(op3);

    r3.apply(op1);
    r3.apply(op2);

    expect(r1.document().getText()).toBe(r2.document().getText());
    expect(r2.document().getText()).toBe(r3.document().getText());
  });


  it("insert after a deleted element still works", () => {
    const r = new RgaReplica("A");

    const h = r.insert(Identifier.HEAD, "H");
    const i = r.insert(h.id, "i");

    r.delete(h.id);

    const ex = r.insert(h.id, "!");

    expect(r.document().getText()).toBe("i!");
  });


  it("forked replica preserves tombstones", () => {
    const r1 = new RgaReplica("A");

    const op = r1.insert(Identifier.HEAD, "X");
    r1.delete(op.id);

    const r2 = r1.fork();

    expect(r1.document().getText()).toBe("");
    expect(r2.document().getText()).toBe("");
  });

});
