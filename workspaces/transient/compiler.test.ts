import path from "path";
import { makeExport, compileDeclarations } from "./compiler";

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
});
