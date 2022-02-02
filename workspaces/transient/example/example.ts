import * as ts from "typescript";

const program = ts.createProgram(["index.d.ts"], {
  esModuleInterop: true,
});
const sourceFile = program.getSourceFile("index.d.ts");
const checker = program.getTypeChecker();
const libraryExports = checker.getExportsOfModule((sourceFile as any).symbol);

for (const anExport of libraryExports) {
  const type = checker.getTypeOfSymbolAtLocation(anExport, sourceFile);
  const { name } = anExport;
}
