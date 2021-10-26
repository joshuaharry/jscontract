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
exports.ORIGINAL_MODULE_FILE = exports.markGraphNodes = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const parser_1 = require("@babel/parser");
const t = __importStar(require("@babel/types"));
const generator_1 = __importDefault(require("@babel/generator"));
const template_1 = __importDefault(require("@babel/template"));
const prettier_1 = __importDefault(require("prettier"));
// Util {{{
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const readTypesFromFile = (name) => fs_1.default.readFileSync(path_1.default.join(process.cwd(), name), "utf-8");
const getAst = (input) => parser_1.parse(input.code, {
    plugins: [input.language],
    sourceType: "module",
});
const getCode = (ast) => prettier_1.default.format(generator_1.default(ast).code, { parser: "babel" });
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const fail = (el) => {
    console.error(el);
    throw new Error("UNEXPECTED ELEMENT");
};
const isBackwardsReference = (nodes, node) => node.dependencies.some((dep) => !nodes.find((aNode) => aNode.name === dep));
const markGraphNodes = (graph) => Object.values(graph).reduce((nodes, node) => nodes.concat(isBackwardsReference(nodes, node)
    ? { ...node, isRecursive: true }
    : node), []);
exports.markGraphNodes = markGraphNodes;
const getTypeName = (curType) => {
    if (curType.type === "Identifier")
        return curType.name;
    const { left, right } = curType;
    return `${getTypeName(left)}.${right.name}`;
};
const isLiteralObject = (literal) => {
    return literal.members.every((member) => member.type === "TSIndexSignature" ||
        member.type === "TSPropertySignature");
};
const addIndexSignature = (acc, el) => {
    var _a;
    const { name } = el.parameters[0];
    const type = ((_a = el.typeAnnotation) === null || _a === void 0 ? void 0 : _a.typeAnnotation) || t.tsAnyKeyword();
    return { ...acc, [name]: { type, isIndex: true, isOptional: false } };
};
const addPropertySignature = (acc, el) => {
    var _a;
    if (el.key.type !== "Identifier")
        return acc;
    const type = (_a = el === null || el === void 0 ? void 0 : el.typeAnnotation) === null || _a === void 0 ? void 0 : _a.typeAnnotation;
    if (!type)
        return acc;
    return {
        ...acc,
        [el.key.name]: { type, isOptional: Boolean(el.optional), isIndex: false },
    };
};
const makeObjectLiteral = (lit) => {
    const object = lit.members.reduce((acc, el) => {
        if (el.type === "TSIndexSignature")
            return addIndexSignature(acc, el);
        if (el.type === "TSPropertySignature")
            return addPropertySignature(acc, el);
        return acc;
    }, {});
    return object;
};
const toFlowObject = (acc, el) => {
    if (el.type === "ObjectTypeSpreadProperty")
        return acc;
    if (el.key.type !== "Identifier")
        return acc;
    return { ...acc, [el.key.name]: el.value };
};
const makeFlowObjectLiteral = (types) => {
    return { types: types.reduce(toFlowObject, {}) };
};
const extractFlowModuleName = (el) => {
    var _a;
    const { typeAnnotation: { typeAnnotation }, } = el;
    if (typeAnnotation.type !== "GenericTypeAnnotation" ||
        ((_a = typeAnnotation === null || typeAnnotation === void 0 ? void 0 : typeAnnotation.id) === null || _a === void 0 ? void 0 : _a.type) !== "Identifier") {
        throw new Error("UNHANDLED FLOW TYPE");
    }
    return typeAnnotation.id.name;
};
const markExports = (l) => {
    const theExports = l.filter((token) => token.typeToMark !== null);
    const theTypes = l.filter((token) => token.typeToMark === null);
    return theTypes.map((type) => {
        return theExports.some((exp) => exp.typeToMark === type.name)
            ? { ...type, isMainExport: true }
            : type;
    });
};
const getParameterType = (el) => {
    var _a;
    return el.type !== "TSParameterProperty" &&
        ((_a = el === null || el === void 0 ? void 0 : el.typeAnnotation) === null || _a === void 0 ? void 0 : _a.type) === "TSTypeAnnotation"
        ? el.typeAnnotation.typeAnnotation
        : t.tsAnyKeyword();
};
const getParameterTypes = (els) => els.map((el) => {
    return {
        type: getParameterType(el),
        isRestParameter: el.type === "RestElement",
        isOptional: Boolean(el.type === "Identifier" && el.optional),
    };
});
const accumulateType = (acc, el, type) => {
    var _a;
    if (!type || ((_a = el === null || el === void 0 ? void 0 : el.key) === null || _a === void 0 ? void 0 : _a.type) !== "Identifier")
        return acc;
    const { name } = el.key;
    return {
        ...acc,
        [name]: { type, isIndex: false, isOptional: Boolean(el.optional) },
    };
};
const coerceMethodSignature = (el) => ({
    type: "TSFunctionType",
    typeAnnotation: el.typeAnnotation,
    parameters: el.parameters,
    leadingComments: null,
    innerComments: null,
    trailingComments: null,
    loc: null,
    start: null,
    end: null,
});
const childMappers = {
    TSPropertySignature(acc, el) {
        var _a;
        const type = (_a = el === null || el === void 0 ? void 0 : el.typeAnnotation) === null || _a === void 0 ? void 0 : _a.typeAnnotation;
        return accumulateType(acc, el, type);
    },
    TSMethodSignature(acc, el) {
        return accumulateType(acc, el, coerceMethodSignature(el));
    },
};
const returnObjectRecord = (acc, _) => acc;
const getObjectTypes = (els) => {
    return els.reduce((acc, el) => {
        const fn = childMappers[el.type] || returnObjectRecord;
        return fn(acc, el);
    }, {});
};
const typeContainsName = (name, chunk) => {
    const loop = (type) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const loopMap = {
            TSTypeReference(type) {
                const typeName = getTypeName(type.typeName);
                return typeName === name;
            },
            TSFunctionType(type) {
                const { typeAnnotation } = type;
                if (typeAnnotation && loop(typeAnnotation.typeAnnotation))
                    return true;
                return false;
            },
            TSArrayType(type) {
                return loop(type.elementType);
            },
            TSParenthesizedType(type) {
                return loop(type.typeAnnotation);
            },
            TSUnionType(type) {
                return type.types.some((type) => loop(type) === true);
            },
        };
        const fn = loopMap[type === null || type === void 0 ? void 0 : type.type];
        return fn ? fn(type) : false;
    };
    return loop(chunk.type);
};
const isRecursiveChunk = (name, entry) => {
    const [typeName, typeIdentifier] = entry;
    return typeName === name || typeContainsName(name, typeIdentifier);
};
const checkRecursive = (name, types) => {
    return Object.entries(types).some((entry) => isRecursiveChunk(name, entry));
};
const getTypeToken = (name, type) => {
    if (type.type !== "TSTypeLiteral")
        return { hint: "flat", syntax: type };
    if (!isLiteralObject(type))
        return { hint: "flat", syntax: type };
    const types = makeObjectLiteral(type);
    return {
        hint: "object",
        syntax: { types, isRecursive: checkRecursive(name, types) },
    };
};
const getFlowTypeToken = (_, type) => {
    if (type.type === "ObjectTypeAnnotation")
        return {
            hint: "flowObject",
            syntax: makeFlowObjectLiteral(type.properties),
        };
    throw new Error("UNHANDLED FLOW TYPE");
};
const tokenMap = {
    File(el) {
        // @ts-ignore
        return reduceTokens(el.program.body);
    },
    DeclareModule(el) {
        return reduceTokens(el.body.body);
    },
    DeclareModuleExports(el) {
        return [
            {
                name: "NONE",
                type: null,
                isSubExport: false,
                isMainExport: false,
                existsInJs: false,
                typeToMark: extractFlowModuleName(el),
            },
        ];
    },
    DeclareTypeAlias(el) {
        return [
            {
                name: el.id.name,
                typeToMark: null,
                type: getFlowTypeToken(el.id.name, el.right),
                isSubExport: false,
                isMainExport: false,
                existsInJs: true,
            },
        ];
    },
    TSTypeAliasDeclaration(el) {
        const { name } = el.id;
        const typeAnnotation = el.typeAnnotation;
        if (!t.isTSType(typeAnnotation))
            return [];
        const type = typeAnnotation;
        return [
            {
                name,
                type: getTypeToken(name, type),
                typeToMark: null,
                isSubExport: false,
                isMainExport: false,
                existsInJs: false,
            },
        ];
    },
    TSExportAssignment(el) {
        if (el.expression.type !== "Identifier")
            return [];
        const { name } = el.expression;
        return [
            {
                name,
                typeToMark: null,
                type: null,
                isSubExport: false,
                isMainExport: true,
                existsInJs: true,
            },
        ];
    },
    TSModuleBlock(el) {
        return reduceTokens(el.body);
    },
    TSModuleDeclaration(el) {
        const tokens = getContractTokens(el.body);
        if (el.id.type !== "Identifier")
            return [];
        const { name } = el.id;
        return tokens.map((token) => ({ ...token, name: `${name}.${token.name}` }));
    },
    TSInterfaceDeclaration(el) {
        const name = el.id.name;
        const { body } = el.body;
        const types = getObjectTypes(body);
        return [
            {
                name,
                type: {
                    hint: "object",
                    syntax: { types, isRecursive: checkRecursive(name, types) },
                },
                typeToMark: null,
                isSubExport: false,
                isMainExport: false,
                existsInJs: false,
            },
        ];
    },
    TSDeclareFunction(el) {
        var _a, _b;
        const name = (_a = el.id) === null || _a === void 0 ? void 0 : _a.name;
        if (!name)
            return [];
        if (((_b = el === null || el === void 0 ? void 0 : el.returnType) === null || _b === void 0 ? void 0 : _b.type) !== "TSTypeAnnotation")
            return [];
        const syntax = {
            range: el.returnType.typeAnnotation,
            domain: getParameterTypes(el.params),
        };
        return [
            {
                name,
                typeToMark: null,
                type: { hint: "function", syntax },
                isSubExport: false,
                isMainExport: false,
                existsInJs: true,
            },
        ];
    },
    ExportNamedDeclaration(el) {
        if (!el.declaration)
            return [];
        const tokens = getContractTokens(el.declaration);
        if (tokens.length === 0)
            return [];
        if (tokens.length > 1)
            return fail(tokens);
        const statement = tokens[0];
        return [{ ...statement, isSubExport: statement.existsInJs }];
    },
    VariableDeclaration(el) {
        if (el.declarations.length !== 1)
            return fail(el);
        const declaration = el.declarations[0];
        return getContractTokens(declaration);
    },
    VariableDeclarator(el) {
        if (el.id.type !== "Identifier")
            return [];
        return getContractTokens(el.id);
    },
    Identifier(el) {
        var _a;
        const { name } = el;
        if (((_a = el === null || el === void 0 ? void 0 : el.typeAnnotation) === null || _a === void 0 ? void 0 : _a.type) !== "TSTypeAnnotation")
            return [];
        const syntax = el.typeAnnotation.typeAnnotation;
        return [
            {
                name,
                typeToMark: null,
                type: getTypeToken(name, syntax),
                isSubExport: false,
                isMainExport: false,
                existsInJs: true,
            },
        ];
    },
};
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const noToken = (_) => [];
const reduceTokens = (l) => {
    const tokens = l.reduce((acc, el) => acc.concat(getContractTokens(el)), []);
    return markExports(tokens);
};
const getContractTokens = (el) => {
    const fn = tokenMap[el.type] || noToken;
    return fn(el);
};
const getReferenceDeps = (ref) => {
    return getTypeName(ref.typeName);
};
const depMap = {
    TSTypeReference(type) {
        return [getReferenceDeps(type)];
    },
    TSFunctionType(type) {
        if (!type.typeAnnotation)
            return [];
        return getTypeDependencies({
            hint: "function",
            syntax: {
                domain: getParameterTypes(type.parameters),
                range: type.typeAnnotation.typeAnnotation,
            },
        });
    },
    TSUnionType(type) {
        return type.types.flatMap(getDeps);
    },
    TSArrayType(type) {
        return getTypeDependencies({ hint: "flat", syntax: type.elementType });
    },
};
const getDeps = (type) => {
    const fn = depMap[type.type];
    if (!fn)
        return [];
    return fn(type);
};
const getTypeDependencies = (type) => {
    if (type.hint === "flat")
        return getDeps(type.syntax);
    if (type.hint === "function") {
        const syntax = type.syntax;
        return [
            ...syntax.domain.flatMap((stx) => getDeps(stx.type)),
            ...getDeps(syntax.range),
        ];
    }
    const syntax = type.syntax;
    return Object.values(syntax.types).flatMap((type) => getDeps(type.type));
};
const getDependencies = (types) => Array.from(new Set(types.flatMap(getTypeDependencies)));
const getNodeTypes = (tokens) => {
    const baseTypes = tokens
        .filter((token) => token.type !== null)
        .map((token) => token.type);
    return baseTypes;
};
const filterRedundantTypes = (name, types) => {
    return types.filter((type) => {
        if (type.hint !== "flat")
            return true;
        if (type.syntax.type !== "TSTypeReference")
            return true;
        const contractName = getContractName(getTypeName(type.syntax.typeName));
        return contractName !== getContractName(name);
    });
};
const buildNode = (nodeName, tokens) => {
    const nodeTokens = tokens.filter((token) => token.name === nodeName);
    const isSubExport = nodeTokens.some((token) => token.isSubExport);
    const isMainExport = nodeTokens.some((token) => token.isMainExport);
    const types = getNodeTypes(nodeTokens);
    return {
        name: nodeName,
        isSubExport,
        isMainExport,
        isRecursive: false,
        types: filterRedundantTypes(nodeName, types),
        dependencies: getDependencies(types),
    };
};
const fixDependencyNames = (graph) => {
    const nameList = Object.keys(graph);
    const nameSet = new Set(nameList);
    return Object.entries(graph).reduce((acc, [name, node]) => {
        const dependencies = node.dependencies
            .map((dep) => {
            if (nameSet.has(dep))
                return dep;
            const realName = nameList.find((name) => name.endsWith(dep));
            return realName;
        })
            .filter((dep) => dep && dep !== node.name);
        return {
            ...acc,
            [name]: {
                ...node,
                dependencies,
            },
        };
    }, {});
};
const getContractGraph = (tokens) => {
    const names = Array.from(new Set(tokens.map((token) => token.name)));
    return fixDependencyNames(names.reduce((acc, el) => {
        return { ...acc, [el]: buildNode(el, tokens) };
    }, {}));
};
// }}}
// Transform the Environment into an AST {{{
// Boundary Management - Exports, Requires {{{
const getFinalName = (name) => {
    return name.includes(".")
        ? name.substring(name.lastIndexOf(".") + 1, name.length)
        : name;
};
const getContractName = (name) => `${getFinalName(name)}Contract`;
exports.ORIGINAL_MODULE_FILE = "./__ORIGINAL_UNTYPED_MODULE__.js";
const requireContractLibrary = () => [
    template_1.default.statement(`const CT = require('@jscontract/contract')`)({
        CT: t.identifier("CT"),
    }),
    template_1.default.statement(`const originalModule = require(%%replacementName%%)`)({
        replacementName: t.stringLiteral(exports.ORIGINAL_MODULE_FILE),
    }),
];
const getModuleExports = (nodes) => {
    const mainExport = nodes.find((node) => node.isMainExport);
    return mainExport
        ? template_1.default.statement(`module.exports = %%contract%%.wrap(originalModule)`)({
            contract: getContractName(mainExport.name),
        })
        : template_1.default.statement(`module.exports = {}`)({});
};
const getSubExport = (node) => template_1.default.statement(`module.exports.%%name%% = %%contract%%.wrap(originalModule.%%name%%)`)({
    name: node.name,
    contract: getContractName(node.name),
});
const exportContracts = (nodes) => {
    const moduleExports = getModuleExports(nodes);
    const subExports = nodes.filter((node) => node.isSubExport).map(getSubExport);
    return [moduleExports, ...subExports];
};
// }}}
// Map Node to Contract {{{
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const makeAnyCt = (_) => template_1.default.expression(`CT.anyCT`)({ CT: t.identifier("CT") });
const makeCtExpression = (name) => template_1.default.expression(name)({ CT: t.identifier("CT") });
const wrapRecursive = (expr) => template_1.default.expression(`CT.CTRec(() => %%contract%%)`)({
    contract: expr,
});
const nameReference = (refName) => {
    return template_1.default.expression(`%%name%%`)({
        name: getContractName(refName),
    });
};
const extractRefParams = (ref) => {
    var _a;
    const params = (_a = ref === null || ref === void 0 ? void 0 : ref.typeParameters) === null || _a === void 0 ? void 0 : _a.params;
    if (!Array.isArray(params)) {
        throw new Error(`Could not unwrap parameters on ${ref}!`);
    }
    return params;
};
const makeReduceNode = (env) => {
    const typeIsInEnvironment = (typeName) => {
        if (env[typeName])
            return true;
        return Object.keys(env).some((key) => key.match(`.${typeName}`));
    };
    const giveUpOnReference = (ref) => {
        console.log(`We gave up on this type: `, prettier_1.default.format(JSON.stringify(ref), { parser: "json" }));
        return makeAnyCt();
    };
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const handleUnknownReference = (ref) => {
        const typeName = getTypeName(ref.typeName);
        if (typeIsInEnvironment(typeName))
            return nameReference(typeName);
        return giveUpOnReference(ref);
    };
    const unwrapTypeParams = (ref, expr) => {
        const params = extractRefParams(ref);
        return template_1.default.expression(expr)({
            contract: params.length === 1
                ? mapFlat(params[0])
                : template_1.default.expression(`CT.CTOr(%%ors%%)`)({
                    ors: params.map((param) => mapFlat(param)),
                }),
        });
    };
    const typeRefMap = {
        Array(ref) {
            return unwrapTypeParams(ref, "CT.CTArray(%%contract%%)");
        },
        ArrayLike(ref) {
            return unwrapTypeParams(ref, `CT.CTObject({ length: CT.numberCT, prop: { contract: %%contract%%, index: "string" } })`);
        },
        ArrayBuffer(_) {
            return template_1.default.expression(`CT.arrayBufferCT`)({
                CT: t.identifier("CT"),
            });
        },
        Promise(ref) {
            return unwrapTypeParams(ref, "CT.CTPromise(CT.CTFunction(true, [%%contract%%], CT.anyCT))");
        },
        String(_) {
            return makeCtExpression("CT.StringCT");
        },
        Number(_) {
            return makeCtExpression("CT.NumberCT");
        },
        Boolean(_) {
            return makeCtExpression("CT.BooleanCT");
        },
        Object(_) {
            return makeCtExpression("CT.ObjectCT");
        },
        Symbol(_) {
            return makeCtExpression("CT.SymbolCT");
        },
        BigInt(_) {
            return makeCtExpression("CT.BigIntCT");
        },
        RegExp(_) {
            return makeCtExpression("CT.RegExpCT");
        },
        Error(_) {
            return makeCtExpression("CT.errorCT");
        },
    };
    const flatContractMap = {
        TSNumberKeyword() {
            return makeCtExpression("CT.numberCT");
        },
        TSBooleanKeyword() {
            return makeCtExpression("CT.booleanCT");
        },
        TSStringKeyword() {
            return makeCtExpression("CT.stringCT");
        },
        TSNullKeyword() {
            return makeCtExpression("CT.nullCT");
        },
        TSVoidKeyword() {
            return makeCtExpression("CT.undefinedCT");
        },
        TSArrayType(arr) {
            return template_1.default.expression(`CT.CTArray(%%contract%%)`)({
                contract: mapFlat(arr.elementType),
            });
        },
        TSTypeReference(ref) {
            var _a;
            if (((_a = ref === null || ref === void 0 ? void 0 : ref.typeName) === null || _a === void 0 ? void 0 : _a.type) !== "Identifier")
                return handleUnknownReference(ref);
            const { name } = ref.typeName;
            const refFn = typeRefMap[name] || handleUnknownReference;
            return refFn(ref);
        },
        TSParenthesizedType(paren) {
            return mapFlat(paren.typeAnnotation);
        },
        TSUnionType(union) {
            return template_1.default.expression(`CT.CTOr(%%types%%)`)({
                types: union.types.map(mapFlat),
            });
        },
        TSFunctionType(type) {
            var _a;
            return mapFunction({
                domain: getParameterTypes(type.parameters),
                range: ((_a = type.typeAnnotation) === null || _a === void 0 ? void 0 : _a.typeAnnotation) || t.tsAnyKeyword(),
            });
        },
        TSTypeOperator(type) {
            const base = mapFlat(type.typeAnnotation);
            if (base.type !== "CallExpression")
                return makeAnyCt();
            base.arguments.push(template_1.default.expression(`{ immutable: true }`)({}));
            return base;
        },
        TSTypeLiteral(type) {
            if (isLiteralObject(type))
                return mapObject({
                    isRecursive: false,
                    types: makeObjectLiteral(type),
                });
            return makeAnyCt();
        },
    };
    const mapFlat = (type) => {
        const fn = flatContractMap[type.type] || makeAnyCt;
        return fn(type);
    };
    const makeRestParameter = (rest) => {
        if (rest.type !== "TSArrayType")
            return template_1.default.expression(`{ contract: CT.anyCT, dotdotdot: true }`)({});
        return template_1.default.expression(`{ contract: %%contract%%, dotdotdot: true }`)({
            contract: mapFlat(rest.elementType),
        });
    };
    const makeOptionalParameter = (optional) => {
        return template_1.default.expression(`{contract: %%contract%%, optional: true}`)({
            contract: mapFlat(optional),
        });
    };
    const mapDomain = (domain) => {
        return template_1.default.expression(`%%contracts%%`)({
            contracts: t.arrayExpression(domain.map((el) => {
                if (el.isRestParameter)
                    return makeRestParameter(el.type);
                if (el.isOptional)
                    return makeOptionalParameter(el.type);
                return mapFlat(el.type);
            })),
        });
    };
    const mapFunction = (stx) => {
        return template_1.default.expression(`CT.CTFunction(CT.trueCT, %%domain%%, %%range%%)`)({
            domain: mapDomain(stx.domain),
            range: mapFlat(stx.range),
        });
    };
    const getObjectTemplate = (stx) => `CT.CTObject({ ${Object.keys(stx.types)
        .map((key) => `${key}: %%${key}%%`)
        .join(", ")} })`;
    const addOptionalType = (acc, [name, type]) => {
        return {
            ...acc,
            [name]: template_1.default.expression(`{ contract: %%contract%%, optional: true }`)({
                contract: mapFlat(type.type),
            }),
        };
    };
    const addIndexType = (acc, [name, type]) => {
        return {
            ...acc,
            [name]: template_1.default.expression(`{ contract: %%contract%%, index: "string" }`)({
                contract: mapFlat(type.type),
            }),
        };
    };
    const getObjectContracts = (stx) => {
        return Object.entries(stx.types).reduce((acc, chunkEntry) => {
            const [name, type] = chunkEntry;
            if (type.isOptional)
                return addOptionalType(acc, chunkEntry);
            if (type.isIndex)
                return addIndexType(acc, chunkEntry);
            return { ...acc, [name]: mapFlat(type.type) };
        }, {});
    };
    const buildObjectContract = (stx) => {
        const templateString = getObjectTemplate(stx);
        const templateObject = getObjectContracts(stx);
        if (Object.keys(templateObject).length <= 0)
            return makeAnyCt();
        return template_1.default.expression(templateString)(templateObject);
    };
    const mapObject = (stx) => {
        const objectContract = buildObjectContract(stx);
        return stx.isRecursive ? wrapRecursive(objectContract) : objectContract;
    };
    const mapType = (type) => {
        if (type.hint === "flat")
            return mapFlat(type.syntax);
        if (type.hint === "function")
            return mapFunction(type.syntax);
        return mapObject(type.syntax);
    };
    const mapAndContract = (types) => template_1.default.expression(`CT.CTAnd(%%contracts%%)`)({
        contracts: types.map(mapType),
    });
    const mapNodeTypes = (node) => {
        if (node.types.length === 0)
            return makeAnyCt();
        if (node.types.length === 1)
            return mapType(node.types[0]);
        return mapAndContract(node.types);
    };
    const buildContract = (node) => {
        const contract = mapNodeTypes(node);
        return node.isRecursive ? wrapRecursive(contract) : contract;
    };
    const reduceNode = (node) => template_1.default.statement(`const %%name%% = %%contract%%`)({
        name: getContractName(node.name),
        contract: buildContract(node),
    });
    return reduceNode;
};
// }}}
const compileTypes = (nodes, graph) => {
    const reduceNode = makeReduceNode(graph);
    return nodes.map(reduceNode);
};
const getContractAst = (graph) => {
    const ast = parser_1.parse("");
    const statements = exports.markGraphNodes(graph);
    ast.program.body = [
        ...requireContractLibrary(),
        ...compileTypes(statements, graph),
        ...exportContracts(statements),
    ];
    return ast;
};
const compile = (input) => {
    const declarationAst = getAst(input);
    const tokens = getContractTokens(declarationAst);
    const graph = getContractGraph(tokens);
    const contractAst = getContractAst(graph);
    return getCode(contractAst);
};
const DEFAULT_OPTIONS = {
    fileName: "index.d.ts",
    language: "typescript",
};
const compileContracts = (options = DEFAULT_OPTIONS) => compile({
    language: options.language,
    code: readTypesFromFile(options.fileName),
});
exports.default = compileContracts;
// }}}
if (require.main === module) {
    fs_1.default.writeFileSync("./__COMPILATION_RESULT__.js", compileContracts());
}
