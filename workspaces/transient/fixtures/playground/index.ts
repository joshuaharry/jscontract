import { isArgumentsObject } from "util/types";

export const aString: string = require("./__ORIGINAL_UNTYPED_MODULE__.js").aString;
interface Hello {
  hello: string;
}
export const anObject: Hello = require("./__ORIGINAL_UNTYPED_MODULE__").anObject;
export const check: (x: number) => number = require('./__ORIGINAL_UNTYPED_MODULE__').fn;

export const arrow = (n: number): string => {
  const fn = require("./__ORIGINAL_UNTYPED_MODULE__").arw;
  return fn(n);
}

export const arw = (...args: any): any => {
  const fn = (n: number) : string => {
    const implementation = require("./__ORIGINAL_UNTYPED_MODULE__").arw;
    return implementation(...args);
  }
  // @ts-ignore
  return fn(...args);
}

// Neither of these examples support unions?
export function myFunction(x: string): number; 
export function myFunction(x: number): string;
export function myFunction(...args: any): any {
  const f = require('./__ORIGINAL_UNTYPED_MODULE__').myFunction;
  return f(...args);
}

export class MyInterface {
  method(param: number): string;
  method(param: boolean): string;
  method(param: any): any {
    return param.toString();
  }
}
