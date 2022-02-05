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
  xtest("Generates the right types for primitives", () => {
    gotoFixture("by-hand");
    const out = compileDeclarations();
    expect(out).toMatch(
      'export const str: string = require("./__ORIGINAL_UNTYPED_MODULE__").str;'
    );
    expect(out).toMatch(
      'export const num: number = require("./__ORIGINAL_UNTYPED_MODULE__").num;'
    );
  });
  test.only("Generates the right types for functions", () => {
    gotoFixture("by-hand");
    const out = compileDeclarations();
    console.log(out);
    
  });
  test("Generates the right types for export=", () => {
    gotoFixture("with-export");
    const out = compileDeclarations();
  })
  test("Generates the right types for export=", () => {
    gotoFixture("with-export-ref");
    const out = compileDeclarations();
  })
});
