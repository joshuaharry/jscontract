import path from "path";
import { changeExtension, compileDeclarations } from "./compiler";

const gotoFixture = (fixture: string) => {
  process.chdir(path.join(__dirname, "fixtures", fixture));
  jest.resetModules();
};

describe("Our change extension function", () => {
  test("Works when there is a dot", () => {
    expect(changeExtension("lib/main.js", "ts")).toEqual("lib/main.ts");
  });
  test("Works when there is no dot", () => {
    expect(changeExtension("path/long/main", "ts")).toEqual(
      "path/long/main.ts"
    );
  });
});

describe("Our compiler", () => {
  test("Generates the right types for primitives", () => {
    gotoFixture("primitives");
    const out = compileDeclarations();
    expect(out).toMatch(
      'export const str: string = require("./__ORIGINAL_UNTYPED_MODULE__").str;'
    );
    expect(out).toMatch(
      'export const num: number = require("./__ORIGINAL_UNTYPED_MODULE__").num;'
    );
    expect(out).toMatch(
      'export const aNull: null = require("./__ORIGINAL_UNTYPED_MODULE__").aNull;'
    );
  });
  test("Generates the right types for function keywords", () => {
    gotoFixture("function-keywords");
    const out = compileDeclarations();
    expect(out).toMatch('export function myFunction(x: string): number');
    expect(out).toMatch('implementation(...arguments)');
  });
  // test("Generates the right types for export=", () => {
  //   gotoFixture("with-export");
  //   const out = compileDeclarations();
  // })
  // test("Generates the right types for export=", () => {
  //   gotoFixture("with-export-ref");
  //   const out = compileDeclarations();
  // })
});
