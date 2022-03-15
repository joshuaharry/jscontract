const CT = require('./contract');
const assert = require('assert');

// x: string
const myFnUnwrapped = (x) => {
  throw new Error('My error');
}

const myFn = CT.CTFunction(true, [CT.stringCT], CT.anyCT).wrap(myFnUnwrapped);

assert.ok(
  (() => {
    try {
      myFn(3);
    } catch (err) {
      return err.message === 'My error';
    }
  })()
);
