const SyntaxMap = {
  0: "Unknown",
  1: "EndOfFileToken",
  2: "SingleLineCommentTrivia",
  3: "MultiLineCommentTrivia",
  4: "NewLineTrivia",
  5: "WhitespaceTrivia",
  6: "ShebangTrivia",
  7: "ConflictMarkerTrivia",
  8: "NumericLiteral",
  9: "BigIntLiteral",
  10: "StringLiteral",
  11: "JsxText",
  12: "JsxTextAllWhiteSpaces",
  13: "RegularExpressionLiteral",
  14: "NoSubstitutionTemplateLiteral",
  15: "TemplateHead",
  16: "TemplateMiddle",
  17: "TemplateTail",
  18: "OpenBraceToken",
  19: "CloseBraceToken",
  20: "OpenParenToken",
  21: "CloseParenToken",
  22: "OpenBracketToken",
  23: "CloseBracketToken",
  24: "DotToken",
  25: "DotDotDotToken",
  26: "SemicolonToken",
  27: "CommaToken",
  28: "QuestionDotToken",
  29: "LessThanToken",
  30: "LessThanSlashToken",
  31: "GreaterThanToken",
  32: "LessThanEqualsToken",
  33: "GreaterThanEqualsToken",
  34: "EqualsEqualsToken",
  35: "ExclamationEqualsToken",
  36: "EqualsEqualsEqualsToken",
  37: "ExclamationEqualsEqualsToken",
  38: "EqualsGreaterThanToken",
  39: "PlusToken",
  40: "MinusToken",
  41: "AsteriskToken",
  42: "AsteriskAsteriskToken",
  43: "SlashToken",
  44: "PercentToken",
  45: "PlusPlusToken",
  46: "MinusMinusToken",
  47: "LessThanLessThanToken",
  48: "GreaterThanGreaterThanToken",
  49: "GreaterThanGreaterThanGreaterThanToken",
  50: "AmpersandToken",
  51: "BarToken",
  52: "CaretToken",
  53: "ExclamationToken",
  54: "TildeToken",
  55: "AmpersandAmpersandToken",
  56: "BarBarToken",
  57: "QuestionToken",
  58: "ColonToken",
  59: "AtToken",
  60: "QuestionQuestionToken",
  61: "BacktickToken",
  62: "HashToken",
  63: "EqualsToken",
  64: "PlusEqualsToken",
  65: "MinusEqualsToken",
  66: "AsteriskEqualsToken",
  67: "AsteriskAsteriskEqualsToken",
  68: "SlashEqualsToken",
  69: "PercentEqualsToken",
  70: "LessThanLessThanEqualsToken",
  71: "GreaterThanGreaterThanEqualsToken",
  72: "GreaterThanGreaterThanGreaterThanEqualsToken",
  73: "AmpersandEqualsToken",
  74: "BarEqualsToken",
  75: "BarBarEqualsToken",
  76: "AmpersandAmpersandEqualsToken",
  77: "QuestionQuestionEqualsToken",
  78: "CaretEqualsToken",
  79: "Identifier",
  80: "PrivateIdentifier",
  81: "BreakKeyword",
  82: "CaseKeyword",
  83: "CatchKeyword",
  84: "ClassKeyword",
  85: "ConstKeyword",
  86: "ContinueKeyword",
  87: "DebuggerKeyword",
  88: "DefaultKeyword",
  89: "DeleteKeyword",
  90: "DoKeyword",
  91: "ElseKeyword",
  92: "EnumKeyword",
  93: "ExportKeyword",
  94: "ExtendsKeyword",
  95: "FalseKeyword",
  96: "FinallyKeyword",
  97: "ForKeyword",
  98: "FunctionKeyword",
  99: "IfKeyword",
  100: "ImportKeyword",
  101: "InKeyword",
  102: "InstanceOfKeyword",
  103: "NewKeyword",
  104: "NullKeyword",
  105: "ReturnKeyword",
  106: "SuperKeyword",
  107: "SwitchKeyword",
  108: "ThisKeyword",
  109: "ThrowKeyword",
  110: "TrueKeyword",
  111: "TryKeyword",
  112: "TypeOfKeyword",
  113: "VarKeyword",
  114: "VoidKeyword",
  115: "WhileKeyword",
  116: "WithKeyword",
  117: "ImplementsKeyword",
  118: "InterfaceKeyword",
  119: "LetKeyword",
  120: "PackageKeyword",
  121: "PrivateKeyword",
  122: "ProtectedKeyword",
  123: "PublicKeyword",
  124: "StaticKeyword",
  125: "YieldKeyword",
  126: "AbstractKeyword",
  127: "AsKeyword",
  128: "AssertsKeyword",
  129: "AssertKeyword",
  130: "AnyKeyword",
  131: "AsyncKeyword",
  132: "AwaitKeyword",
  133: "BooleanKeyword",
  134: "ConstructorKeyword",
  135: "DeclareKeyword",
  136: "GetKeyword",
  137: "InferKeyword",
  138: "IntrinsicKeyword",
  139: "IsKeyword",
  140: "KeyOfKeyword",
  141: "ModuleKeyword",
  142: "NamespaceKeyword",
  143: "NeverKeyword",
  144: "ReadonlyKeyword",
  145: "RequireKeyword",
  146: "NumberKeyword",
  147: "ObjectKeyword",
  148: "SetKeyword",
  149: "StringKeyword",
  150: "SymbolKeyword",
  151: "TypeKeyword",
  152: "UndefinedKeyword",
  153: "UniqueKeyword",
  154: "UnknownKeyword",
  155: "FromKeyword",
  156: "GlobalKeyword",
  157: "BigIntKeyword",
  158: "OverrideKeyword",
  159: "OfKeyword",
  160: "QualifiedName",
  161: "ComputedPropertyName",
  162: "TypeParameter",
  163: "Parameter",
  164: "Decorator",
  165: "PropertySignature",
  166: "PropertyDeclaration",
  167: "MethodSignature",
  168: "MethodDeclaration",
  169: "ClassStaticBlockDeclaration",
  170: "Constructor",
  171: "GetAccessor",
  172: "SetAccessor",
  173: "CallSignature",
  174: "ConstructSignature",
  175: "IndexSignature",
  176: "TypePredicate",
  177: "TypeReference",
  178: "FunctionType",
  179: "ConstructorType",
  180: "TypeQuery",
  181: "TypeLiteral",
  182: "ArrayType",
  183: "TupleType",
  184: "OptionalType",
  185: "RestType",
  186: "UnionType",
  187: "IntersectionType",
  188: "ConditionalType",
  189: "InferType",
  190: "ParenthesizedType",
  191: "ThisType",
  192: "TypeOperator",
  193: "IndexedAccessType",
  194: "MappedType",
  195: "LiteralType",
  196: "NamedTupleMember",
  197: "TemplateLiteralType",
  198: "TemplateLiteralTypeSpan",
  199: "ImportType",
  200: "ObjectBindingPattern",
  201: "ArrayBindingPattern",
  202: "BindingElement",
  203: "ArrayLiteralExpression",
  204: "ObjectLiteralExpression",
  205: "PropertyAccessExpression",
  206: "ElementAccessExpression",
  207: "CallExpression",
  208: "NewExpression",
  209: "TaggedTemplateExpression",
  210: "TypeAssertionExpression",
  211: "ParenthesizedExpression",
  212: "FunctionExpression",
  213: "ArrowFunction",
  214: "DeleteExpression",
  215: "TypeOfExpression",
  216: "VoidExpression",
  217: "AwaitExpression",
  218: "PrefixUnaryExpression",
  219: "PostfixUnaryExpression",
  220: "BinaryExpression",
  221: "ConditionalExpression",
  222: "TemplateExpression",
  223: "YieldExpression",
  224: "SpreadElement",
  225: "ClassExpression",
  226: "OmittedExpression",
  227: "ExpressionWithTypeArguments",
  228: "AsExpression",
  229: "NonNullExpression",
  230: "MetaProperty",
  231: "SyntheticExpression",
  232: "TemplateSpan",
  233: "SemicolonClassElement",
  234: "Block",
  235: "EmptyStatement",
  236: "VariableStatement",
  237: "ExpressionStatement",
  238: "IfStatement",
  239: "DoStatement",
  240: "WhileStatement",
  241: "ForStatement",
  242: "ForInStatement",
  243: "ForOfStatement",
  244: "ContinueStatement",
  245: "BreakStatement",
  246: "ReturnStatement",
  247: "WithStatement",
  248: "SwitchStatement",
  249: "LabeledStatement",
  250: "ThrowStatement",
  251: "TryStatement",
  252: "DebuggerStatement",
  253: "VariableDeclaration",
  254: "VariableDeclarationList",
  255: "FunctionDeclaration",
  256: "ClassDeclaration",
  257: "InterfaceDeclaration",
  258: "TypeAliasDeclaration",
  259: "EnumDeclaration",
  260: "ModuleDeclaration",
  261: "ModuleBlock",
  262: "CaseBlock",
  263: "NamespaceExportDeclaration",
  264: "ImportEqualsDeclaration",
  265: "ImportDeclaration",
  266: "ImportClause",
  267: "NamespaceImport",
  268: "NamedImports",
  269: "ImportSpecifier",
  270: "ExportAssignment",
  271: "ExportDeclaration",
  272: "NamedExports",
  273: "NamespaceExport",
  274: "ExportSpecifier",
  275: "MissingDeclaration",
  276: "ExternalModuleReference",
  277: "JsxElement",
  278: "JsxSelfClosingElement",
  279: "JsxOpeningElement",
  280: "JsxClosingElement",
  281: "JsxFragment",
  282: "JsxOpeningFragment",
  283: "JsxClosingFragment",
  284: "JsxAttribute",
  285: "JsxAttributes",
  286: "JsxSpreadAttribute",
  287: "JsxExpression",
  288: "CaseClause",
  289: "DefaultClause",
  290: "HeritageClause",
  291: "CatchClause",
  292: "AssertClause",
  293: "AssertEntry",
  294: "PropertyAssignment",
  295: "ShorthandPropertyAssignment",
  296: "SpreadAssignment",
  297: "EnumMember",
  298: "UnparsedPrologue",
  299: "UnparsedPrepend",
  300: "UnparsedText",
  301: "UnparsedInternalText",
  302: "UnparsedSyntheticReference",
  303: "SourceFile",
  304: "Bundle",
  305: "UnparsedSource",
  306: "InputFiles",
  307: "JSDocTypeExpression",
  308: "JSDocNameReference",
  309: "JSDocMemberName",
  310: "JSDocAllType",
  311: "JSDocUnknownType",
  312: "JSDocNullableType",
  313: "JSDocNonNullableType",
  314: "JSDocOptionalType",
  315: "JSDocFunctionType",
  316: "JSDocVariadicType",
  317: "JSDocNamepathType",
  318: "JSDocComment",
  319: "JSDocText",
  320: "JSDocTypeLiteral",
  321: "JSDocSignature",
  322: "JSDocLink",
  323: "JSDocLinkCode",
  324: "JSDocLinkPlain",
  325: "JSDocTag",
  326: "JSDocAugmentsTag",
  327: "JSDocImplementsTag",
  328: "JSDocAuthorTag",
  329: "JSDocDeprecatedTag",
  330: "JSDocClassTag",
  331: "JSDocPublicTag",
  332: "JSDocPrivateTag",
  333: "JSDocProtectedTag",
  334: "JSDocReadonlyTag",
  335: "JSDocOverrideTag",
  336: "JSDocCallbackTag",
  337: "JSDocEnumTag",
  338: "JSDocParameterTag",
  339: "JSDocReturnTag",
  340: "JSDocThisTag",
  341: "JSDocTypeTag",
  342: "JSDocTemplateTag",
  343: "JSDocTypedefTag",
  344: "JSDocSeeTag",
  345: "JSDocPropertyTag",
  346: "SyntaxList",
  347: "NotEmittedStatement",
  348: "PartiallyEmittedExpression",
  349: "CommaListExpression",
  350: "MergeDeclarationMarker",
  351: "EndOfDeclarationMarker",
  352: "SyntheticReferenceExpression",
  353: "Count",
}

export default SyntaxMap;