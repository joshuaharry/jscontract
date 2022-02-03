import * as ts from "typescript";
import fs from "fs-extra";
import path from "path";
import * as tsr from "ts-runtime";

export const makeExport = (name: string, type: string) => {
  if (name === "default") {
    return `const defaultExp: ${type} = require("./__ORIGINAL_UNTYPED_MODULE__");
export default defaultExp;`;
  }
  if (name === "export=") {
    return `const defaultExp: ${type} = require("./__ORIGINAL_UNTYPED_MODULE__");
module.exports = defaultExp;`;
  }
  return `export const ${name}: ${type} = require("./__ORIGINAL_UNTYPED_MODULE__").${name};`;
};

interface Compiler {
  checker: ts.TypeChecker;
  program: ts.Program;
  sourceFile: ts.SourceFile;
}

const fromCompiler = (): Compiler => {
  const program = ts.createProgram(["index.d.ts"], {
    esModuleInterop: true,
  });
  const sourceFile = program.getSourceFile("index.d.ts");
  if (!sourceFile) {
    throw new Error("MISSING index.d.ts");
  }
  const checker = program.getTypeChecker();
  return { program, sourceFile, checker };
};

const getEsmoduleExports = (meta: Compiler): string => {
  const { checker, sourceFile } = meta;
  let out: string = "";
  const libraryExports = checker.getExportsOfModule((sourceFile as any).symbol);
  for (const anExport of libraryExports) {
    const type = checker.typeToString(
      checker.getTypeOfSymbolAtLocation(anExport, sourceFile),
      undefined,
      ts.TypeFormatFlags.NoTruncation
    );
    const { name } = anExport;
    out += makeExport(name, type);
    out += "\n";
  }
  return out;
};

const getExportStar = (meta: Compiler): string => {
  const { sourceFile, checker } = meta;
  let out: string = "";
  const rootSyms = checker.getRootSymbols((sourceFile as any).symbol);
  for (const sym of rootSyms) {
    for (const anExport of (sym.exports?.values() || []) as any) {
      const type = checker.typeToString(
        checker.getTypeOfSymbolAtLocation(anExport, sourceFile),
        undefined,
        ts.TypeFormatFlags.NoTruncation
      );
      const { name } = anExport;
      out += makeExport(name, type.includes("typeof") ? "any" : type);
      out += "\n";
    }
  }
  return out;
};

export const compileDeclarations = (): string => {
  const meta = fromCompiler();
  let out: string = 'import t from "ts-runtime/lib";\n';
  out += getEsmoduleExports(meta);
  out += getExportStar(meta);
  return out;
};

export const changeExtension = (fileName: string, newExt: string): string =>
  `${fileName.substring(0, fileName.lastIndexOf("."))}.${newExt}`;

const run = async () => {
  const packageJson = require(path.join(process.cwd(), "package.json"));
  const main = packageJson.main as string;
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
