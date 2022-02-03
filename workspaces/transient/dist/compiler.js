"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.changeExtension = exports.compileDeclarations = exports.makeExport = void 0;
const ts = __importStar(require("typescript"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
const tsr = __importStar(require("ts-runtime"));
const makeExport = (name, type) => {
    if (name === "default") {
        return `const defaultExp: ${type} = require("./__ORIGINAL_UNTYPED_MODULE__");
export default defaultExp;`;
    }
    if (name === 'export=') {
        return `const defaultExp: ${type} = require("./__ORIGINAL_UNTYPED_MODULE__");
module.exports = defaultExp;`;
    }
    return `export const ${name}: ${type} = require("./__ORIGINAL_UNTYPED_MODULE__").${name};`;
};
exports.makeExport = makeExport;
const fromCompiler = () => {
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
const getEsmoduleExports = (meta) => {
    const { checker, sourceFile } = meta;
    let out = "";
    const libraryExports = checker.getExportsOfModule(sourceFile.symbol);
    for (const anExport of libraryExports) {
        const type = checker.typeToString(checker.getTypeOfSymbolAtLocation(anExport, sourceFile), undefined, ts.TypeFormatFlags.NoTruncation);
        const { name } = anExport;
        out += (0, exports.makeExport)(name, type);
        out += "\n";
    }
    return out;
};
const getExportStar = (meta) => {
    var _a;
    const { sourceFile, checker } = meta;
    let out = "";
    const rootSyms = checker.getRootSymbols(sourceFile.symbol);
    for (const sym of rootSyms) {
        for (const anExport of (((_a = sym.exports) === null || _a === void 0 ? void 0 : _a.values()) || [])) {
            const type = checker.typeToString(checker.getTypeOfSymbolAtLocation(anExport, sourceFile), undefined, ts.TypeFormatFlags.NoTruncation);
            const { name } = anExport;
            out += (0, exports.makeExport)(name, type.includes("typeof") ? "any" : type);
            out += "\n";
        }
    }
    return out;
};
const compileDeclarations = () => {
    const meta = fromCompiler();
    let out = 'import t from "ts-runtime/lib";\n';
    out += getEsmoduleExports(meta);
    out += getExportStar(meta);
    return out;
};
exports.compileDeclarations = compileDeclarations;
const changeExtension = (fileName, newExt) => `${fileName.substring(0, fileName.lastIndexOf("."))}.${newExt}`;
exports.changeExtension = changeExtension;
const run = async () => {
    const packageJson = require(path_1.default.join(process.cwd(), "package.json"));
    const main = packageJson.main;
    const mainPath = path_1.default.join(process.cwd(), main.endsWith(".js") ? main : `${main}.js`);
    const mainDir = path_1.default.dirname(mainPath);
    fs_extra_1.default.moveSync(mainPath, path_1.default.join(mainDir, "__ORIGINAL_UNTYPED_MODULE__.js"), {
        overwrite: true,
    });
    const code = (0, exports.compileDeclarations)();
    const typescriptName = (0, exports.changeExtension)(mainPath, "ts");
    fs_extra_1.default.writeFileSync(typescriptName, code);
    tsr.transform([typescriptName], {
        excludeDeclarationFile: true,
        force: true,
        compilerOptions: { esModuleInterop: true },
    });
};
if (require.main === module) {
    run();
}
