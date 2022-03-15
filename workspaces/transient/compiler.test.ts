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
    expect(out).toMatch("export function myFunction(x: string): number");
    expect(out).toMatch("implementation(...arguments)");
  });
  test("We handle function overloads correctly", () => {
    gotoFixture("function-overloads");
    const out = compileDeclarations();
    expect(out).toMatch(`export function myFunction(n: string): number;
export function myFunction(n: number): string;
export function myFunction(...args: any) {
  const fn = require(\"./__ORIGINAL_UNTYPED_MODULE__\").myFunction;
  return fn(...args)
}`);
  });
  test("We can handle an arrow function correctly", () => {
    gotoFixture("arrow-functions");
    const out = compileDeclarations();
    expect(out).toMatch(`const fn = (x: number) : string`);
    expect(out).toMatch(`fn(...args)`);
  });
  test("We bail out on unions", () => {
    gotoFixture('unions');
    const out = compileDeclarations();
    expect(out).toMatch('any');
  });
  test("We can handle export default correctly", () => {
    gotoFixture('export-default');
    const out = compileDeclarations();
    expect(out).toMatch(`export default defaultExp;`)
    expect(out).toMatch(`module.exports = defaultExp`);
    expect(out).toMatch('require("./__ORIGINAL_UNTYPED_MODULE__");');
  });
  test("We can handle export= correctly", () => {
    gotoFixture('export=');
    const out = compileDeclarations();
    expect(out).toMatch(`x: string, y: number`);
  });
  test("We can handle export= ambiguity without an issue", () => {
    gotoFixture('ambiguity-export=');
    const out = compileDeclarations();
    console.log(out);
    expect(out).toMatch(`defaultExp: any`);
  });
});
