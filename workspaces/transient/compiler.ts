import * as ts from "typescript";
import fs from "fs-extra";
import path from "path";
import * as tsr from "ts-runtime";

export const makeExport = (name: string, type: string) => {
  if (name === "default" || name === "export=") {
    return `const defaultExp: ${type} = require("./__ORIGINAL_UNTYPED_MODULE__");
module.exports = defaultExp;
export default defaultExp;`;
  }
  return `export const ${name}: ${type} = require("./__ORIGINAL_UNTYPED_MODULE__").${name};`;
};

class Compiler {
  readonly checker: ts.TypeChecker;
  readonly program: ts.Program;
  readonly sourceFile: ts.SourceFile;
  constructor() {
    const program = ts.createProgram(["index.d.ts"], {
      esModuleInterop: true,
    });
    this.program = program;
    const sourceFile = program.getSourceFile("index.d.ts")!;
    this.sourceFile = sourceFile!;
    this.checker = program.getTypeChecker();
  }
  stringify(type: ts.Type): string {
    return this.checker.typeToString(
      type,
      undefined,
      ts.TypeFormatFlags.NoTruncation
    );
  }
  getType(sym: ts.Symbol) {
    return this.checker.getTypeOfSymbolAtLocation(sym, this.sourceFile);
  }
  typeString(sym: ts.Symbol) {
    return this.stringify(this.getType(sym));
  }
}



const getEsmoduleExports = (meta: Compiler): string[] => {
  const { checker, sourceFile } = meta;
  const libraryExports = checker.getExportsOfModule((sourceFile as any).symbol);
  const code = libraryExports.map((anExport) => {
    const { name } = anExport;
    return makeExport(name, meta.typeString(anExport));
  });
  return code;
};

const getExportStar = (meta: Compiler): string[] => {
  const { sourceFile, checker } = meta;
  const rootSyms = checker.getRootSymbols((sourceFile as any).symbol);
  const theExports: Array<any> = rootSyms.flatMap((sym) => {
    return sym.exports ? Array.from(sym.exports.values() as any) : [];
  });
  const code = theExports.map((anExport) => {
    const name = anExport.name;
    const type = meta.typeString(anExport);
    return makeExport(name, type.includes("typeof") ? "any" : type);
  });
  return code;
};

export const compileDeclarations = (): string => {
  const meta = new Compiler();
  const code: Array<string> = [
    'import t from "ts-runtime/lib";',
    ...getEsmoduleExports(meta),
    ...getExportStar(meta),
  ];
  return code.join("\n");
};

export const changeExtension = (fileName: string, newExt: string): string =>
  `${fileName.substring(0, fileName.lastIndexOf("."))}.${newExt}`;

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
