import * as ts from "typescript";
import fs from "fs-extra";
import path from "path";
import * as tsr from "ts-runtime";
import SyntaxMap from "./SyntaxMap";

const printChildren = (node: ts.Node): void => {
  console.log(
    node
      .getChildren()
      .map((child) => SyntaxMap[child.kind])
      .join("\n")
  );
};

type SkippableExport = { typeHint: "skip" };

type DirectExport = { typeHint: "direct"; typeString: string };

type PrimitiveExport = {
  typeHint: "primitive";
  typeString: string;
  name: string;
};

type KeywordFunctionExport = {
  typeHint: "keyword-function";
  typeString: string;
  name: string;
};

type ArrowFunctionExport = {
  typeHint: "arrow-function";
  typeString: string;
  name: string;
};

type FunctionOverloadExport = {
  typeHint: "function-overload";
  typeList: string[];
  name: string;
};

type Export =
  | SkippableExport
  | DirectExport
  | PrimitiveExport
  | KeywordFunctionExport
  | ArrowFunctionExport
  | FunctionOverloadExport;

class AstExtractor {
  private readonly program: ts.Program;
  private readonly sourceFile: ts.SourceFile;
  private readonly checker: ts.TypeChecker;

  constructor() {
    const program = ts.createProgram(["index.d.ts"], {
      esModuleInterop: true,
    });
    const sourceFile = program.getSourceFile("index.d.ts")!;
    const checker = program.getTypeChecker()!;

    this.program = program;
    this.sourceFile = sourceFile;
    this.checker = checker;
  }

  stringify = (sym: ts.Symbol): string => {
    return this.checker.typeToString(
      this.checker.getTypeOfSymbolAtLocation(sym, this.sourceFile),
      undefined,
      ts.TypeFormatFlags.NoTruncation
    );
  };

  makeInterfaceExport = (symbol: ts.Symbol): DirectExport => {
    const decs = symbol.getDeclarations()?.map((dec) => dec.getText()) || [""];
    return {
      typeHint: "direct",
      typeString: decs[0],
    };
  };

  makeArrowFunction = (
    name: string,
    symbol: ts.Symbol
  ): ArrowFunctionExport => {
    const type = this.stringify(symbol);
    return {
      name,
      typeString: this.stringify(symbol),
      typeHint: "arrow-function",
    };
  };

  makeKeywordFunction = (
    name: string,
    symbol: ts.Symbol
  ): KeywordFunctionExport => {
    const [declaration] = symbol.getDeclarations()!;
    return {
      name,
      typeHint: "keyword-function",
      typeString: declaration.getText().replace(";", ""),
    };
  };

  makePrimitiveExport = (name: string, symbol: ts.Symbol): PrimitiveExport => {
    return {
      name,
      typeHint: "primitive",
      typeString: this.stringify(symbol),
    };
  };

  makeFunctionOverload = (
    name: string,
    symbol: ts.Symbol
  ): FunctionOverloadExport => {
    const overloads = symbol.getDeclarations() || [];
    return {
      name,
      typeHint: "function-overload",
      typeList: overloads.map((x) => x.getText()),
    };
  };

  makeClassicFunction = (name: string, symbol: ts.Symbol): Export => {
    const overloads = symbol.getDeclarations() || [];
    const fn =
      overloads.length <= 1
        ? this.makeKeywordFunction
        : this.makeFunctionOverload;
    return fn(name, symbol);
  };

  toExport = (pair: [name: string, symbol: ts.Symbol]): Export => {
    const [name, symbol] = pair;
    if (symbol === undefined) return { typeHint: "skip" };
    if (symbol.flags & ts.SymbolFlags.Interface) {
      return this.makeInterfaceExport(symbol);
    }
    if (symbol.flags & ts.SymbolFlags.Function) {
      return this.makeClassicFunction(name, symbol);
    }
    const typeString = this.stringify(symbol);
    if (typeString.includes("=>")) {
      return this.makeArrowFunction(name, symbol);
    }
    return this.makePrimitiveExport(name, symbol);
  };

  extract = (): Export[] => {
    const root = this.checker.getSymbolAtLocation(this.sourceFile)!;
    const baseExportPairs: Array<[string, ts.Symbol]> = Array.from(
      root.exports!.entries() as any
    );
    const baseExports = baseExportPairs.map(this.toExport);

    return baseExports;
  };
}

const makeArrowFunction = (exp: ArrowFunctionExport): string => {
  const arrowCount = exp.typeString.match(/=>/g)?.length;
  /**
   * If '=>' appears more than once, we have a union type, and ts-runtime can't
   * handle those. Bail out to any.
   */
  const theType =
    arrowCount === 1
      ? exp.typeString.replace("=>", ":")
      : "(...args: any): any";
  return `export const ${exp.name} = (...args: any): any => {
    const fn = ${theType} => {
      const implementation = require("./__ORIGINAL_UNTYPED_MODULE__").${exp.name};
      return implementation(...args);
    }
    return fn(...args);
}`;
};

const makeKeywordFunction = (exp: KeywordFunctionExport): string => {
  return `${exp.typeString} {
    const implementation = require("./__ORIGINAL_UNTYPED_MODULE__").${exp.name};
    return implementation(...arguments);
}`;
};

const makePrimitiveExport = (exp: PrimitiveExport): string => {
  const theType = exp.typeString.includes('typeof') ? 'any' : exp.typeString;
  return `export const ${exp.name}: ${theType} = require("./__ORIGINAL_UNTYPED_MODULE__").${exp.name};`;
};

const makeFunctionOverload = (exp: FunctionOverloadExport): string => {
  const implementation = `export function ${exp.name}(...args: any) {
  const fn = require("./__ORIGINAL_UNTYPED_MODULE__").${exp.name};
  return fn(...args)
}`;
  return [...exp.typeList, implementation].join("\n");
};

const stringifyRawExport = (anExp: Export): string => {
  switch (anExp.typeHint) {
    case "skip":
      return "";
    case "direct":
      return anExp.typeString;
    case "primitive":
      return makePrimitiveExport(anExp);
    case "keyword-function":
      return makeKeywordFunction(anExp);
    case "arrow-function":
      return makeArrowFunction(anExp);
    case "function-overload":
      return makeFunctionOverload(anExp);
  }
};

const fixDefault = (out: string): string => {
  const fix = (name: string, main: string): string => {
    if (!main.includes(`export const ${name}`)) return main;
    main = main.replace(`export const ${name}`, `const defaultExp`);
    main = main.replace(`require("./__ORIGINAL_UNTYPED_MODULE__").${name};`, `require("./__ORIGINAL_UNTYPED_MODULE__");`)
    main += `\nexport default defaultExp;`
    main += `\nmodule.exports = defaultExp`;
    return main;
  }
  return fix('export=', fix('default', out));
}

const stringifyExport = (anExp: Export): string => {
  const out = stringifyRawExport(anExp);
  return fixDefault(out);
};

export const compileDeclarations = (): string => {
  const code: Array<string> = [
    'import t from "ts-runtime/lib";',
    ...new AstExtractor().extract().map(stringifyExport),
  ];
  return code.join("\n");
};

export const changeExtension = (fileName: string, newExt: string): string => {
  const lastIdx = fileName.lastIndexOf(".");
  if (lastIdx === -1) return `${fileName}.ts`;
  return `${fileName.substring(0, fileName.lastIndexOf("."))}.${newExt}`;
};

const run = async () => {
  const packageJson = require(path.join(process.cwd(), "package.json"));
  const main = packageJson.main || "index.js";
  const mainPath = path.join(
    process.cwd(),
    main.endsWith(".js") ? main : `${main}.js`
  );
  const mainDir = path.dirname(mainPath);
  fs.moveSync(mainPath, path.join(mainDir, "__ORIGINAL_UNTYPED_MODULE__.js"), {
    overwrite: true,
  });
  const code = compileDeclarations();
  const typescriptName = changeExtension(mainPath, "ts");
  fs.writeFileSync(typescriptName, code);
  tsr.transform([typescriptName], {
    excludeDeclarationFile: true,
    force: true,
    compilerOptions: { esModuleInterop: true, strict: true },
  });
};

if (require.main === module) {
  run();
}
