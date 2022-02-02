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
export default defaultExp;`);
    });
});
describe("Our compiler", () => {
    test("Can work on an example by hand", () => {
        gotoFixture("by-hand");
        const out = (0, compiler_1.compileDeclarations)();
        expect(out.includes(`export const fn: (x: string) => number = require("./__ORIGINAL_UNTYPED_MODULE__").fn;`)).toBe(true);
    });
});
