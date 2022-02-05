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
describe("Our change extension function", () => {
    test("Works when there is a dot", () => {
        expect((0, compiler_1.changeExtension)("lib/main.js", "ts")).toEqual("lib/main.ts");
    });
    test("Works when there is no dot", () => {
        expect((0, compiler_1.changeExtension)("path/long/main", "ts")).toEqual("path/long/main.ts");
    });
});
describe("Our compiler", () => {
    test("Generates the right types for primitives", () => {
        gotoFixture('by-hand');
        const out = (0, compiler_1.compileDeclarations)();
        expect(out).toMatch('export const str: string = require("./__ORIGINAL_UNTYPED_MODULE__").str;');
        expect(out).toMatch('export const num: number = require("./__ORIGINAL_UNTYPED_MODULE__").num;');
    });
    test.only("Generates the right types for functions", () => {
        gotoFixture('by-hand');
        const out = (0, compiler_1.compileDeclarations)();
    });
});
