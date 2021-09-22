import path from "path";
import compileContracts, { markGraphNodes } from "./compiler";

const gotoFixture = (fixture: string) =>
  process.chdir(path.join(__dirname, "fixtures", fixture));

const compile = () =>
  compileContracts().replace(/\n/gm, "").replace(/\s\s+/g, " ");

describe("Our mark recursive algorithm", () => {
  test("Works on a degenerate case", () => {
    expect(markGraphNodes({})).toEqual([]);
  });
  test("Works when the nodes have no dependencies", () => {
    expect(
      markGraphNodes({
        a: { name: "a", dependencies: [], isRecursive: false },
        b: { name: "b", dependencies: [], isRecursive: false },
        c: { name: "c", dependencies: [], isRecursive: false },
      })
    ).toEqual([
      { name: "a", dependencies: [], isRecursive: false },
      { name: "b", dependencies: [], isRecursive: false },
      { name: "c", dependencies: [], isRecursive: false },
    ]);
  });
  test("Works when the nodes have dependencies", () => {
    expect(
      markGraphNodes({
        a: { name: "a", dependencies: ["b", "c"], isRecursive: false },
        b: { name: "b", dependencies: [], isRecursive: false },
        c: { name: "c", dependencies: ["b"], isRecursive: false },
      })
    ).toEqual([
      { name: "a", dependencies: ["b", "c"], isRecursive: true },
      { name: "b", dependencies: [], isRecursive: false },
      { name: "c", dependencies: ["b"], isRecursive: false },
    ]);
  });
  test("Handles cycles correctly", () => {
    expect(
      markGraphNodes({
        a: { name: "a", dependencies: ["b"], isRecursive: false },
        b: { name: "b", dependencies: ["a"], isRecursive: false },
      })
    ).toEqual([
      { name: "a", dependencies: ["b"], isRecursive: true },
      { name: "b", dependencies: ["a"], isRecursive: false },
    ]);
  });
  test("Works with more realistic code", () => {
    expect(
      markGraphNodes({
        "checksum.ChecksumOptions": {
          name: "checksum.ChecksumOptions",
          dependencies: [],
          isRecursive: false,
        },
        "checksum.file": {
          name: "checksum.file",
          dependencies: ["checksum.ChecksumOptions"],
          isRecursive: false,
        },
        checksum: {
          name: "checksum",
          dependencies: ["checksum.ChecksumOptions"],
          isRecursive: false,
        },
      })
    ).toEqual([
      {
        name: "checksum.ChecksumOptions",
        dependencies: [],
        isRecursive: false,
      },
      {
        name: "checksum.file",
        dependencies: ["checksum.ChecksumOptions"],
        isRecursive: false,
      },
      {
        name: "checksum",
        dependencies: ["checksum.ChecksumOptions"],
        isRecursive: false,
      },
    ]);
  });
});

describe("Our compiler", () => {
  test("Blows up when it can't find any types to compile.", () => {
    gotoFixture("missing-types");
    expect(() => compileContracts()).toThrow("ENOENT");
  });
  test("Succeeds with abbrev", () => {
    gotoFixture("abbrev-js");
    const code = compile();
    expect(code).toMatch(`contract: CT.stringCT, dotdotdot: true`);
    expect(code).toMatch(
      `module.exports = abbrevContract.wrap(originalModule)`
    );
  });
  test("Works on the checksum package", () => {
    gotoFixture("checksum");
    const code = compile();
    expect(code).toMatch(
      `{ algorithm: { contract: CT.stringCT, optional: true, }`
    );
    expect(code).not.toMatch("ErrorContract");
    expect(code).toMatch("undefinedCT");
  });
  test("Works on the archy package", () => {
    gotoFixture("archy");
    const code = compile();
    expect(code).toMatch(`CT.CTRec(() => CT.CTObject`);
    expect(code).toMatch(`[ DataContract`);
  });
  test("Works on the argv package", () => {
    gotoFixture("argv");
    const code = compileContracts();
    expect(code).toMatch(`CT.CTRec`);
    expect(code).toMatch(`contract: typeFunctionContract`);
  });
  test("Works on the 7zip-min package", () => {
    gotoFixture("7zip-min");
    const code = compileContracts();
    expect(code).toMatch("const listContract = CT.CTRec");
  });
  test("Works on the base64-arraybuffer", () => {
    gotoFixture("base64-arraybuffer");
    const code = compileContracts();
    expect(code).toMatch(`CT.arrayBufferCT`);
  });
  test("Works on array types", () => {
    const originalLog = console.log;
    console.log = jest.fn();
    gotoFixture("array-generic");
    const code = compile();
    expect(code).toMatch(`CT.numberCT, { immutable: true,`);
    expect(code).toMatch(
      `const MyGenericContract = CT.CTFunction(CT.trueCT, [CT.anyCT], CT.nullCT);`
    );
    expect(code).toMatch(
      `{ length: CT.numberCT, prop: { contract: CT.stringCT, index: "string"`
    );
    console.log = originalLog;
  });
  test("Logs when we give up on a generic type", () => {
    const originalLog = console.log;
    const logMock = jest.fn();
    console.log = logMock;
    gotoFixture("array-generic");
    compile();
    console.log = originalLog;
    expect(logMock.mock.calls[0][0]).toMatch("We gave up on this type: ");
  });
  test("Works with country code lookup", () => {
    gotoFixture("country-code-lookup");
    const code = compile();
    expect(code).not.toMatch(
      "module.exports.Country = CountryContract.wrap(originalModule.Country)"
    );
  });
  test("Succeeds with some constants", () => {
    gotoFixture("constants");
    const code = compileContracts();
    expect(code).toMatch(`const CT = require("@jscontract/contract")`);
    expect(code).toMatch(
      `const originalModule = require("./__ORIGINAL_UNTYPED_MODULE__.js")`
    );
    expect(code).toMatch(`const numContract = CT.numberCT`);
    expect(code).toMatch(`const strContract = CT.stringCT`);
    expect(code).toMatch(`const nilContract = CT.nullCT`);
    expect(code).toMatch(`const boolContract = CT.booleanCT`);
    expect(code).toMatch(`module.exports = {}`);
    expect(code).toMatch(
      `module.exports.num = numContract.wrap(originalModule.num)`
    );
    expect(code).toMatch(
      `module.exports.str = strContract.wrap(originalModule.str)`
    );
    expect(code).toMatch(
      `module.exports.nil = nilContract.wrap(originalModule.nil)`
    );
    expect(code).toMatch(
      `module.exports.bool = boolContract.wrap(originalModule.bool)`
    );
  });
  test("Succeeds with our promise library", () => {
    gotoFixture("promise-example");
    const code = compile();
    expect(code).toMatch(
      `CT.CTPromise(CT.CTFunction(true, [CT.stringCT], CT.anyCT))`
    );
  });
  test("Succeeds with our primtive constructors", () => {
    gotoFixture("primitive-constructors");
    const code = compile();
    expect(code).toMatch(`CT.StringCT`);
    expect(code).toMatch(`CT.NumberCT`);
    expect(code).toMatch(`CT.BooleanCT`);
    expect(code).toMatch(`CT.ObjectCT`);
    expect(code).toMatch(`CT.SymbolCT`);
    expect(code).toMatch(`CT.BigIntCT`);
    expect(code).toMatch(`CT.RegExpCT`);
  });
  test("Works with objects that have functions on them", () => {
    gotoFixture("object-function");
    const code = compile();
    expect(code).toMatch(
      `CT.CTObject({ myMethod: CT.CTFunction( CT.trueCT, [CT.stringCT], CT.CTOr(CT.stringCT, CT.numberCT) )`
    );
  });
  test("Works even if the method has no return type", () => {
    gotoFixture("object-function-no-return");
    const code = compile();
    expect(code).toMatch(`CT.CTFunction(CT.trueCT, [CT.stringCT], CT.anyCT)`);
  });
  test("Works with mutually recursive types", () => {
    gotoFixture("recursive-types");
    const code = compile();
    expect(code).toMatch("const PingContract = CT.CTRec");
  });
  test("Works with delete-empty", () => {
    gotoFixture("delete-empty");
    const code = compile();
    expect(code).toMatch(`const OptionsContract = CT.CTRec`);
  });
  test("Works with a package written in flow", () => {
    gotoFixture("http-codes");
    const code = compileContracts({
      fileName: "http-codes_v1.x.x.js",
      language: "flow",
    });
    expect(code).toMatch(`module.exports = CODESContract`);
    expect(code).not.toMatch(`TOO_EARLY`);
  });
});
