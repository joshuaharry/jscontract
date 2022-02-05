import * as ts from "typescript";
import fs from "fs-extra";
import path from "path";
import * as tsr from "ts-runtime";

interface PrimitiveExport {
  name: string;
  type: string;
}

interface FunctionExport {
  name: string;
  parameters: string[];
  output: string;
}

interface InterfaceExport {
  name: string;
  keyType: Record<string, string>;
}

type Export = PrimitiveExport | FunctionExport | InterfaceExport;

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
  execute(): Export[] {
    return []
  }
}



export const compileDeclarations = (): string => {
  const code: Array<string> = ['import t from "ts-runtime/lib";'];
  const exports = new AstExtractor().execute();
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
