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

type DirectExport = { typeHint: "direct"; typeString: string };

type PrimitiveExport = {
  typeHint: "primitive";
  typeString: string;
  name: string;
};

type FunctionExport = {
  typeHint: "function";
  typeString: string;
  name: string;
};

type FunctionOverload = {
  typeHint: "function-overload";
  typeList: string[];
  name: string;
};

type Export =
  | DirectExport
  | PrimitiveExport
  | FunctionExport
  | FunctionOverload;

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

  toExport = (pair: [name: string, symbol: ts.Symbol]): Export => {
    const [name, symbol] = pair;
    if (symbol.flags & ts.SymbolFlags.Interface) {
      const decs = symbol.getDeclarations()?.map((dec) => dec.getText()) || [
        "",
      ];
      return {
        typeHint: "direct",
        typeString: decs[0],
      };
    }
    if (symbol.flags & ts.SymbolFlags.Function) {
      const overloads =
        symbol
          .getDeclarations()
          ?.map((dec) => dec.getText().replace(";", "")) || [];
      if (overloads.length <= 1) {
        return {
          name,
          typeHint: "function",
          typeString: this.stringify(symbol),
        };
      }
      return {
        name,
        typeHint: "function-overload",
        typeList: overloads,
      };
    }
    const typeString = this.stringify(symbol);
    if (typeString.includes("=>")) {
      /**
       * TODO: Walk the tree to get the arguments in a nicer format
       */
      return {
        name,
        typeString: this.stringify(symbol),
        typeHint: "function",
      };
    }
    return {
      name,
      typeHint: "primitive",
      typeString: this.stringify(symbol),
    };
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

const makeFunctionExport = (exp: FunctionExport): string => {
  return `export const ${exp.name} = ${exp.typeString} {
    const fn = require("./__ORIGINAL_UNTYPED_MODULE__").${exp.name};
}`;
};

const makePrimitiveExport = (exp: PrimitiveExport): string => {
  return `export const ${exp.name}: ${exp.typeString} = require("./__ORIGINAL_UNTYPED_MODULE__").${exp.name}`;
};

const makeFunctionOverload = (exp: FunctionOverload): string => {
  const attemptNames = exp.typeList.map((_, i) => `${exp.name}${i}`);
  const attemptFns = exp.typeList.map((sig, i) => {
    const fnName = `${exp.name}${i}`;
    const replacedSig = fnName.replace(exp.name, fnName);
    return replacedSig;
  }).join('\n');
  return `export function ${exp.name}(...args: any) {

}`;
};

const stringifyExport = (anExp: Export): string => {
  switch (anExp.typeHint) {
    case "direct":
      return anExp.typeString;
    case "function":
      return makeFunctionExport(anExp);
    case "primitive":
      return makePrimitiveExport(anExp);
    case "function-overload":
      return makeFunctionOverload(anExp);
  }
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
