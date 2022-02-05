"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MyInterface = exports.myFunction = exports.arw = exports.arrow = exports.check = exports.anObject = exports.aString = void 0;
require("./tsr-declarations");
var lib_1 = require("ts-runtime/lib");
exports.aString = lib_1.default.nullable(lib_1.default.string()).assert(require("./__ORIGINAL_UNTYPED_MODULE__.js").aString);
var Hello = lib_1.default.type("Hello", lib_1.default.object(lib_1.default.property("hello", lib_1.default.nullable(lib_1.default.string()))));
exports.anObject = lib_1.default.nullable(lib_1.default.ref(Hello)).assert(require("./__ORIGINAL_UNTYPED_MODULE__").anObject);
exports.check = lib_1.default.nullable(lib_1.default.function(lib_1.default.param("x", lib_1.default.nullable(lib_1.default.number())), lib_1.default.return(lib_1.default.nullable(lib_1.default.number())))).assert(require('./__ORIGINAL_UNTYPED_MODULE__').fn);
exports.arrow = lib_1.default.annotate(function (n) {
    var _nType = lib_1.default.nullable(lib_1.default.number());
    var _returnType = lib_1.default.return(lib_1.default.nullable(lib_1.default.string()));
    lib_1.default.param("n", _nType).assert(n);
    var fn = require("./__ORIGINAL_UNTYPED_MODULE__").arw;
    return _returnType.assert(fn(n));
}, lib_1.default.function(lib_1.default.param("n", lib_1.default.nullable(lib_1.default.number())), lib_1.default.return(lib_1.default.nullable(lib_1.default.string()))));
exports.arw = lib_1.default.annotate(function () {
    var args = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        args[_i] = arguments[_i];
    }
    var fn = lib_1.default.annotate(function (n) {
        var _nType = lib_1.default.nullable(lib_1.default.number());
        var _returnType = lib_1.default.return(lib_1.default.nullable(lib_1.default.string()));
        lib_1.default.param("n", _nType).assert(n);
        var implementation = require("./__ORIGINAL_UNTYPED_MODULE__").arw;
        return _returnType.assert(implementation.apply(void 0, args));
    }
    // @ts-ignore
    , lib_1.default.function(lib_1.default.param("n", lib_1.default.nullable(lib_1.default.number())), lib_1.default.return(lib_1.default.nullable(lib_1.default.string()))));
    // @ts-ignore
    return fn.apply(void 0, args);
}, lib_1.default.function(lib_1.default.rest("args", lib_1.default.any()), lib_1.default.return(lib_1.default.any())));
lib_1.default.annotate(myFunction, lib_1.default.function(lib_1.default.param("x", lib_1.default.nullable(lib_1.default.string())), lib_1.default.return(lib_1.default.nullable(lib_1.default.number()))));
lib_1.default.annotate(myFunction, lib_1.default.function(lib_1.default.param("x", lib_1.default.nullable(lib_1.default.number())), lib_1.default.return(lib_1.default.nullable(lib_1.default.string()))));
function myFunction() {
    var args = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        args[_i] = arguments[_i];
    }
    var f = require('./__ORIGINAL_UNTYPED_MODULE__').myFunction;
    return f.apply(void 0, args);
}
exports.myFunction = myFunction;
lib_1.default.annotate(myFunction, lib_1.default.function(lib_1.default.rest("args", lib_1.default.any()), lib_1.default.return(lib_1.default.any())));
var MyInterface = /** @class */ (function () {
    function MyInterface() {
    }
    MyInterface.prototype.method = function (param) {
        return param.toString();
    };
    MyInterface = __decorate([
        lib_1.default.annotate(lib_1.default.class("MyInterface", lib_1.default.property("method", lib_1.default.nullable(lib_1.default.function(lib_1.default.param("param", lib_1.default.nullable(lib_1.default.union(lib_1.default.nullable(lib_1.default.number()), lib_1.default.nullable(lib_1.default.boolean())))), lib_1.default.return(lib_1.default.nullable(lib_1.default.string())))))))
    ], MyInterface);
    return MyInterface;
}());
exports.MyInterface = MyInterface;
