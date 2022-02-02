import * as ts from "typescript";
import fs from 'fs-extra';
import path from 'path';
import * as tsr from 'ts-runtime';

export const makeExport = (name: string, type: string) => {
  if (name === 'default') {
    return `const defaultExp: ${type} = require("./__ORIGINAL_UNTYPED_MODULE__");
export default defaultExp;`
  }
  return `export const ${name}: ${type} = require("./__ORIGINAL_UNTYPED_MODULE__").${name};`
}

export const compileDeclarations = (): string => {
  const program = ts.createProgram(["index.d.ts"], {
    esModuleInterop: true,
  });
  const sourceFile = program.getSourceFile("index.d.ts");
  if (!sourceFile) {
    throw new Error("MISSING index.d.ts");
  }
  const checker = program.getTypeChecker();
  const libraryExports = checker.getExportsOfModule((sourceFile as any).symbol);

  let out: string = "";
  for (const anExport of libraryExports) {
    const type = checker.typeToString(
      checker.getTypeOfSymbolAtLocation(anExport, sourceFile)
    );
    const { name } = anExport;
    out += makeExport(name, type);
    out += '\n';
  }
  return out;
};

const run = async () => {
  const packageJson = require(path.join(process.cwd(), 'package.json'));
  const main = packageJson.main as string;
  const mainPath = path.join(process.cwd(), (main.endsWith('.js') ? main : `${main}.js`));
  const mainDir = path.dirname(mainPath);
  fs.moveSync(mainPath, path.join(mainDir, '__ORIGINAL_UNTYPED_MODULE__.js'));
  const code = compileDeclarations();
  fs.writeFileSync(mainPath, code);
}

if (require.main === module) {
  run();
}