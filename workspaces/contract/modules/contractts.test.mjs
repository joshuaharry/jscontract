/*=====================================================================*/
/*    .../jscontract/workspaces/contract/contractts.test.mjs           */
/*    -------------------------------------------------------------    */
/*    Author      :  Manuel Serrano                                    */
/*    Creation    :  Wed Jan 19 16:55:25 2022                          */
/*    Last change :  Wed Jan 19 18:05:22 2022 (serrano)                */
/*    Copyright   :  2022 Manuel Serrano                               */
/*    -------------------------------------------------------------    */
/*    Re-implementation of the examples of                             */
/*      https://github.com/jack-williams/contracts-ts                  */
/*=====================================================================*/
"use strict";
"use hopscript";

import * as assert from "assert";
import * as CT from "./contract.mjs";

/*---------------------------------------------------------------------*/
/*    intro                                                            */
/*---------------------------------------------------------------------*/
console.log("intro...");
function f(x) {
    if(typeof x === 'boolean') {
        if (x) return  "hello world"; return !x
    }
    return x*10;
}

const stringOrBoolean = CT.CTOr(CT.isString, CT.isBoolean);
/* const booleanToSorB = CT.CTAnd(CT.isFunction, CT.CTFunction(true, [CT.isBoolean], stringOrBoolean)); */
/* const numToNum = CT.CTAnd(CT.isFunction, CT.CTFunction(true, [CT.isNumber], CT.isNumber)); */
const booleanToSorB = CT.CTFunction(true, [CT.isBoolean], stringOrBoolean);
const numToNum = CT.CTFunction(true, [CT.isNumber], CT.isNumber);

// Wrap the function
const ctf = CT.CTAnd(booleanToSorB, numToNum).wrap(f);

// Try some legal fuction calls
console.log("f(true): " + ctf(true));
console.log("f(false): " + ctf(false));
console.log("f(42): " + ctf(42));


// Some illegal function calls

try {
    // Negative blame because input is not boolean or number
    console.log(ctf("a string"));
    throw "should have raised";
} catch (e) {
   if (typeof(e) === "string") {
      console.log("*** ERROR(" + e + ")");
   } else {
    console.log("ok(error)");
   }
}

try {
    // Negative blame for too many arguments
    ctf(true, false)
    throw "should have raised";
} catch (e) {
   if (typeof(e) === "string") {
      console.log("*** ERROR(" + e + ")");
   } else {
    console.log("ok(error)");
   }
}

// A faulty function implementation

function fBad(x) {
    if(typeof x === 'boolean') {
        if (x) return  "hello world"; return 42;
    }
    return "I should be a number";
}

const ctfBad = CT.CTAnd(booleanToSorB, numToNum).wrap(fBad);

try {
    // Positive blame because the context supplied a boolean so it
    // must be overload: Boolean -> (String or Boolean),
    // however the function returns a number.
    ctfBad(false);
    throw "should have raised";
} catch (e) {
   if (typeof(e) === "string") {
      console.log("*** ERROR(" + e + ")");
   } else {
    console.log("ok(error)");
   }
}

try {
    // Positive blame because the context supplied a number so it
    // must be overload: Number -> Number,
    // however the function returns a string.
    ctfBad(33)
    throw "should have raised";
} catch (e) {
   if (typeof(e) === "string") {
      console.log("*** ERROR(" + e + ")");
   } else {
    console.log("ok(error)");
   }
}

/*---------------------------------------------------------------------*/
/*    union                                                            */
/*---------------------------------------------------------------------*/
console.log("union...");
/*
 * Union types have the very interesting property that in some cases
 * we need multiple applications of the same function to detect a
 * faultly function -- a single call in isolation is not enough.
 */

function faulty(x) {
    if(x) return 1;
    return x;
}

const booleanToNum = CT.CTFunction(true, [CT.isBoolean], CT.isNumber);
const booleanToboolean = CT.CTFunction(true, [CT.isBoolean], CT.isBoolean);
const unionFunction = CT.CTOr(booleanToboolean, booleanToNum);

const faulty1 = unionFunction.wrap(faulty);

// This does not raise blame on it's own because it returns a number
// that satifies the right branch.
console.log("faulty1(true): " + faulty1(true));

// We use a new contract for the second application to isolate the call.

const faulty2 = unionFunction.wrap(faulty);

// This does not raise blame on it's own because it returns a boolean
// that satifies the left branch.
console.log("faulty2(false): " + faulty2(false));

/*
 * However the type (B -> B) `union` (B -> N) says that it satifies
 * one of the function types, but it may not flip-flop between
 * both. However we cannot detect this unless we issue multipe calls.
 */

const faulty3 = unionFunction.wrap(faulty);

// This single call is ok.
console.log("faulty3(true): " + faulty3(true));

try {
    // However when we apply the same function again we observe that
    // it has now flip-flopped and decided it wants to satisfy the
    // other branch. This is not allowed and we get positive blame.
    faulty3(false);
    throw "should have raised";
} catch (e) {
   if (typeof(e) === "string") {
      console.log("*** ERROR(" + e + ")");
   } else {
    console.log("ok(error)");
   }
}

/*
 * We can give this function a meaningful type, however we must change
 * where the union type is introduced. Instead of:
 *
 * - (B -> B) `union` (B -> N)
 *
 * We shall let the function pick the union branch to satisfy /per/
 * application, using type:
 *
 * - B -> (B `union` N)
 *
 */

const booleanOrNumber = CT.CTOr(CT.isBoolean, CT.isNumber);
const correctType = CT.CTFunction(true, [CT.isBoolean], booleanOrNumber);
const ok = correctType.wrap(faulty);

// Now issuing both calls are ok, as we can pick to satify boolean or
// number per application.

console.log("ok(true): " + ok(true));
console.log("ok(false): " + ok(false));


/*---------------------------------------------------------------------*/
/*    intersection                                                     */
/*---------------------------------------------------------------------*/
console.log("intersection...");
// Pos -> Bool
const posToBoolean = CT.CTFunction(true, [n => n >= 0], CT.isBoolean);

// Even -> String
const evenToString = CT.CTFunction(true, [n => n % 2 === 0], CT.isString);

const overload1 = CT.CTFunction(true, [posToBoolean], CT.isNumber);
const overload2 = CT.CTFunction(true, [evenToString], CT.isString);

// (Pos -> Bool) `intersection` (Even -> String)
const functionType = CT.CTAnd(overload1, overload2);

function impl(f) {
    const result = f(4);
    if(typeof result === "boolean") return result ? 1 : 0;
    return result;
}

const ctimpl = functionType.wrap(impl);

// Select the first overload by passing a function that returns a boolean
console.log("impl(x => x < 100): " + ctimpl(x => x < 100));

// Select the second overload by passing a function that returns a string
console.log("impl(x => x + \"a string\"): " + ctimpl(x => x + "a string"));

/*
 * The next example will exhibit higher order positive blame, and show
 * why compatibly (defined in the paper) must find the smallest
 * elimination context.
 *
 * Sometimes it as ok for an intersection branch to raise positive
 * blame, provided that the same branch has raised negative blame
 * (because that overload was removed). In the first example, applying
 * impl to x => x < 100, will raise positive blame on the codomain of
 * the right branch because the result is not a string. This is ok
 * because we have already seen negative blame on the right branch
 * (the input function returns a boolean, not a string.)
 *
 * However there are cases we it is not ok to raise positive blame,
 * even if negative blame has been raised in the same branch.
 */

function badImpl(f) {
    const result = f(4);

    /*
     * After applying f to 4 using the application in try/catch below,
     * negative blame will be raised on the path dom[0]/cod[0]. So is
     * it now ok for the function body to supply an argument that does
     * not respect the right branch? The answer is no. This
     * application is not safe in general because the context could
     * have chosen the second overload, in which case passing an odd
     * argument would be invalid. The body of this function is relying
     * on the argument picking the first overload, which it cannot
     * do. We correctly get positive blame for the second application.
     *
     * Try commenting out the call f(3) to see the blame disappear.
     *
     */
    const result2 = f(3);
    if(typeof result === "boolean") return result ? 1 : 0;
    return result;
}

const ctbadImpl = functionType.wrap(badImpl);

try {
    // Select the first overload by passing a function that returns a boolean
    console.log("impl(x => x < 100): " + ctbadImpl(x => x < 100));
    throw "should have raised";
} catch (e) {
   if (typeof(e) === "string") {
      console.log("*** ERROR(" + e + ")");
   } else {
    console.log("ok(error)");
   }
}

/*
 * The next example includes an overloaded function that may return
 * another function.
 */

const booleanNegate  = CT.CTFunction(true,[CT.isBoolean], CT.isBoolean); 

const plus = CT.CTFunction(true, [CT.isNumber], numToNum);

const plusOrNegateType = CT.CTAnd(plus, booleanNegate);

function plusOrNegate(x) {
    if(typeof x === "number") {
        return y => x + y;
    }
    return !x;
}

const ctplusOrNegate = plusOrNegateType.wrap(plusOrNegate);

// Select the first overload and then apply the result.
console.log("plusOrNegate(3)(4): " + ctplusOrNegate(3)(4));
console.log("plusOrNegate(40)(2): " + ctplusOrNegate(40)(2));

// Select the second overload.
console.log("plusOrNegate(true): " + ctplusOrNegate(true));
console.log("plusOrNegate(false): " + ctplusOrNegate(false));

try {
    // Negative blame because we try and use the first overload but
    // supply a boolean where a number is expected!
    console.log("plusOrNegate(1)(true): " + ctplusOrNegate(1)(true));
} catch (e) {
    console.log(e);
}

try {
    // Negative blame because we violate the arity in both overloads.
    console.log("plusOrNegate(true,1): " + ctplusOrNegate(true,1));
    throw "should have raised";
} catch (e) {
   if (typeof(e) === "string") {
      console.log("*** ERROR(" + e + ")");
   } else {
    console.log("ok(error)");
   }
}

/*
 * Intersection types and singleton types for conditionals
 */

const trueThenNumber = CT.CTFunction(true,[CT.isAny], CT.isNumber); 
const falseThenString = CT.CTFunction([CT.falseCT], Base.string);
const ifThenNumberElseString = CT.CTAnd(trueThenNumber, falseThenString);

function ten(x) {
    return x ? 10 : "ten";
}

const ctten = ifThenNumberElseString.wrap(ten);

console.log("f(true): " + ctten(true));
console.log("f(false): " + ctten(false))

try {
    // Not true or false, so negative blame!
    console.log("f(0): " + ctten(0));
    throw "should have raised";
} catch (e) {
   if (typeof(e) === "string") {
      console.log("*** ERROR(" + e + ")");
   } else {
    console.log("ok(error)");
   }
}

/*
 * Nested intersection
 */

const evenThenTrue = CT.CTFunction(true,[n => n % 2 === 0], CT.trueCT);  
const oddThenFalse = CT.CTFunction(true,[n => n % 2 === 1], CT.falseCT);
const stringThenNtoN = CT.CTFunction(true,[CT.isString], numToNum);

const mega =
      CT.CTAnd(
          trueThenNumber,               // true -> Number
          CT.CTAnd(            
              falseThenString,          // false -> String
              CT.CTAnd(        
                  evenThenTrue,         // Even -> true
                  CT.CTAnd(    
                      oddThenFalse,     // Odd -> false
                      stringThenNtoN    // String -> Number -> Number
                  )
              )
          )
      );

function bigSwitch(x) {
    switch (typeof x) {
    case "boolean": return x ? 1 : "hello world";
    case "number": return x % 2 === 0;
    case "string": return y => y + x.length;
    }
}

const ctbigSwitch = mega.wrap(bigSwitch);

console.log("bigSwitch(true): " + ctbigSwitch(true));
console.log("bigSwitch(false): " + ctbigSwitch(false));
console.log("bigSwitch(0): " + ctbigSwitch(0));
console.log("bigSwitch(1): " + ctbigSwitch(1));
console.log("bigSwitch(\"a long string\")(29): " + ctbigSwitch("a long string")(29));

try {
    // Passing an undefined that does not satisfy any of the domain
    // types, yielding negative blame.
    ctbigSwitch(undefined);
    throw "should have raised";
} catch (e) {
   if (typeof(e) === "string") {
      console.log("*** ERROR(" + e + ")");
   } else {
    console.log("ok(error)");
   }
}

try {
    // Passing a string selects the overload String -> Number ->
    // Number, however we supply a string as the second argument so
    // negative blame is raised.
    ctbigSwitch("a string")("another string");
    throw "should have raised";
} catch (e) {
   if (typeof(e) === "string") {
      console.log("*** ERROR(" + e + ")");
   } else {
    console.log("ok(error)");
   }
}
