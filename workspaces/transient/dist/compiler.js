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
exports.changeExtension = exports.compileDeclarations = void 0;
const ts = __importStar(require("typescript"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
const tsr = __importStar(require("ts-runtime"));
class Compiler {
    constructor() {
        const program = ts.createProgram(["index.d.ts"], {
            esModuleInterop: true,
        });
        this.program = program;
        const sourceFile = program.getSourceFile("index.d.ts");
        this.sourceFile = sourceFile;
        this.checker = program.getTypeChecker();
    }
    compile() {
        this.sourceFile.forEachChild((child) => {
            var _a;
            if (ts.isFunctionDeclaration(child)) {
                console.log((_a = child.name) === null || _a === void 0 ? void 0 : _a.escapedText);
            }
            else if (ts.isFunctionOrConstructorTypeNode(child)) {
                console.log(child);
            }
        });
        return [];
    }
}
const compileDeclarations = () => {
    const meta = new Compiler();
    const code = [
        'import t from "ts-runtime/lib";',
        ...meta.compile()
    ];
    return code.join("\n");
};
exports.compileDeclarations = compileDeclarations;
const changeExtension = (fileName, newExt) => {
    const lastIdx = fileName.lastIndexOf(".");
    if (lastIdx === -1)
        return `${fileName}.ts`;
    return `${fileName.substring(0, fileName.lastIndexOf("."))}.${newExt}`;
};
exports.changeExtension = changeExtension;
const run = async () => {
    const packageJson = require(path_1.default.join(process.cwd(), "package.json"));
    const main = packageJson.main || "index.js";
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
        compilerOptions: { esModuleInterop: true, strict: true },
    });
};
if (require.main === module) {
    run();
}
