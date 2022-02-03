import path from "path";
import { changeExtension, makeExport, compileDeclarations } from "./compiler";

const gotoFixture = (fixture: string) => {
  process.chdir(path.join(__dirname, "fixtures", fixture));
};

describe("Type generation", () => {
  test("Works with non-default", () => {
    expect(makeExport("test", "string")).toEqual(
      'export const test: string = require("./__ORIGINAL_UNTYPED_MODULE__").test;'
    );
  });
  test("Works with default", () => {
    expect(makeExport("default", "number")).toEqual(
      `const defaultExp: number = require("./__ORIGINAL_UNTYPED_MODULE__");
export default defaultExp;`
    );
  });
});

describe("Our compiler", () => {
  test("Can work on an example by hand", () => {
    gotoFixture("by-hand");
    const out = compileDeclarations();
    expect(
      out.includes(
        `export const fn: (x: string) => number = require("./__ORIGINAL_UNTYPED_MODULE__").fn;`
      )
    ).toBe(true);
  });
  test("Contains the right import", () => {
    gotoFixture("by-hand");
    const out = compileDeclarations();
    expect(out.includes(`import t from "ts-runtime/lib";`)).toBe(true);
  });
  test("Works with export= syntax", () => {
    gotoFixture("with-export");
    const out = compileDeclarations();
    expect(
      out.includes(
        `const defaultExp: (x: string) => number = require("./__ORIGINAL_UNTYPED_MODULE__");`
      )
    ).toBe(true);
  });
  test("Works with export= and a reference", () => {
    gotoFixture("with-export-ref");
    const out = compileDeclarations();
    expect(
      out.includes(
        `const defaultExp: any = require("./__ORIGINAL_UNTYPED_MODULE__");`
      )
    ).toBe(true);
    expect(out.includes('module.exports')).toBe(true);
  });
});

describe("Our change extension function", () => {
  test("Works on a simple case", () => {
    expect(changeExtension("lib/main.js", "ts")).toEqual("lib/main.ts");
  });
});
