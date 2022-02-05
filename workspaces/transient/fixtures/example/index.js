"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.check = exports.anObject = exports.aString = void 0;
require("./tsr-declarations");
var lib_1 = require("ts-runtime/lib");
exports.aString = lib_1.default.nullable(lib_1.default.string()).assert(require("./__ORIGINAL_UNTYPED_MODULE__.js").aString);
var Hello = lib_1.default.type("Hello", lib_1.default.object(lib_1.default.property("hello", lib_1.default.nullable(lib_1.default.string()))));
exports.anObject = lib_1.default.nullable(lib_1.default.ref(Hello)).assert(require("./__ORIGINAL_UNTYPED_MODULE__").anObject);
exports.check = lib_1.default.nullable(lib_1.default.function(lib_1.default.param("x", lib_1.default.nullable(lib_1.default.number())), lib_1.default.return(lib_1.default.nullable(lib_1.default.number())))).assert(require('./__ORIGINAL_UNTYPED_MODULE__').fn);
