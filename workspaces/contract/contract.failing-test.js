/* These are tests that are known to be failing; separate them out so that
   contract.test.js is still useful
 */

"use strict";
"use hopscript";
const assert = require("assert");
const CT = require("./contract.js");

/*
 * Promise
 */
// this test case fails because we do not yet understand how to
// add contracts to promises
assert.ok(
  (() => {
    function open(string) {
      return new Promise(function (res, rej) {
        if (string.length > 0) {
          res(string);
        } else {
          rej(string);
        }
      });
    }

    const openCT = CT.CTFunction(
      CT.trueCT,
      [CT.isString],
      CT.CTPromise(CT.isString, CT.isNumber)
    );
    const ctopen = openCT.wrap(open);

    const x = ctopen("foo");
    console.log("hi " + x);
    x.then((v) => console.log("res=", v)); // ok

    ctopen("").then(
      (v) => 0,
      (v) => console.log("rej=", v)
    ); // wrong
  })(),
  "promise.1"
);
