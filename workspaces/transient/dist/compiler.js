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
exports.compileDeclarations = exports.makeExport = void 0;
const ts = __importStar(require("typescript"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
const makeExport = (name, type) => {
    if (name === 'default') {
        return `const defaultExp: ${type} = require("./__ORIGINAL_UNTYPED_MODULE__");
export default defaultExp;`;
    }
    return `export const ${name}: ${type} = require("./__ORIGINAL_UNTYPED_MODULE__").${name};`;
};
exports.makeExport = makeExport;
const compileDeclarations = () => {
    const program = ts.createProgram(["index.d.ts"], {
        esModuleInterop: true,
    });
    const sourceFile = program.getSourceFile("index.d.ts");
    if (!sourceFile) {
        throw new Error("MISSING index.d.ts");
    }
    const checker = program.getTypeChecker();
    const libraryExports = checker.getExportsOfModule(sourceFile.symbol);
    let out = "";
    for (const anExport of libraryExports) {
        const type = checker.typeToString(checker.getTypeOfSymbolAtLocation(anExport, sourceFile));
        const { name } = anExport;
        out += (0, exports.makeExport)(name, type);
        out += '\n';
    }
    return out;
};
exports.compileDeclarations = compileDeclarations;
const run = async () => {
    const packageJson = require(path_1.default.join(process.cwd(), 'package.json'));
    const main = packageJson.main;
    const mainPath = path_1.default.join(process.cwd(), (main.endsWith('.js') ? main : `${main}.js`));
    const mainDir = path_1.default.dirname(mainPath);
    fs_extra_1.default.moveSync(mainPath, path_1.default.join(mainDir, '__ORIGINAL_UNTYPED_MODULE__.js'));
    const code = (0, exports.compileDeclarations)();
    fs_extra_1.default.writeFileSync(mainPath, code);
};
if (require.main === module) {
    run();
}
