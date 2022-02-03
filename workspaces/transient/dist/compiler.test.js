"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const compiler_1 = require("./compiler");
const gotoFixture = (fixture) => {
    process.chdir(path_1.default.join(__dirname, "fixtures", fixture));
};
describe("Type generation", () => {
    test("Works with non-default", () => {
        expect((0, compiler_1.makeExport)("test", "string")).toEqual('export const test: string = require("./__ORIGINAL_UNTYPED_MODULE__").test;');
    });
    test("Works with default", () => {
        expect((0, compiler_1.makeExport)("default", "number")).toEqual(`const defaultExp: number = require("./__ORIGINAL_UNTYPED_MODULE__");
module.exports = defaultExp;
export default defaultExp;`);
    });
    test("Works with export=", () => {
        expect((0, compiler_1.makeExport)("export=", "number")).toEqual(`const defaultExp: number = require("./__ORIGINAL_UNTYPED_MODULE__");
module.exports = defaultExp;
export default defaultExp;`);
    });
});
describe("Our compiler", () => {
    xtest("Can work on an example by hand", () => {
        gotoFixture("by-hand");
        const out = (0, compiler_1.compileDeclarations)();
        console.log(out);
        expect(out.includes(`export const fn: (x: string) => number {
  const fn = require('./__ORIGINAL_UNTYPED_MODULE__').fn;
  return fn(x);
}`)).toBe(true);
    });
    test("Contains the right import", () => {
        gotoFixture("by-hand");
        const out = (0, compiler_1.compileDeclarations)();
        console.log(out);
        expect(out.includes(`import t from "ts-runtime/lib";`)).toBe(true);
    });
    test("Works with export= syntax", () => {
        gotoFixture("with-export");
        const out = (0, compiler_1.compileDeclarations)();
        expect(out.includes(`const defaultExp: (x: string) => number = require("./__ORIGINAL_UNTYPED_MODULE__");`)).toBe(true);
    });
    test("Works with export= and a reference", () => {
        gotoFixture("with-export-ref");
        const out = (0, compiler_1.compileDeclarations)();
        expect(out.includes(`const defaultExp: any = require("./__ORIGINAL_UNTYPED_MODULE__");`)).toBe(true);
        expect(out.includes('module.exports')).toBe(true);
    });
});
describe("Our change extension function", () => {
    test("Works on a simple case", () => {
        expect((0, compiler_1.changeExtension)("lib/main.js", "ts")).toEqual("lib/main.ts");
    });
});
