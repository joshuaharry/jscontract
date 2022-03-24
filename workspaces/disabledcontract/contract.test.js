const CT = require('./contract');
const assert = require('assert');

assert.ok(CT.stringCT.wrap(3));

{
  const plus_ctc = CT.CTAnd(
    CT.CTFunction(true, [CT.isNumber, CT.isNumber], CT.isNumber),
    CT.CTFunction(true, [CT.isString, CT.isString], CT.isString)
  );
  function f(x, y) {
    return x + y;
  }
  const wf = plus_ctc.wrap(f);
  wf(1, "2");
}

{
  var unpackContract = CT.CTAnd(
    CT.CTFunction(
      true,
      [
        CT.stringCT,
        CT.stringCT,
        CT.CTFunction(
          CT.trueCT,
          [CT.CTOr(CT.errorCT, CT.nullCT)],
          CT.undefinedCT
        ),
      ],
      CT.undefinedCT
    ),
    CT.CTFunction(
      true,
      [
        CT.stringCT,
        CT.CTFunction(
          CT.trueCT,
          [CT.CTOr(CT.errorCT, CT.nullCT)],
          CT.undefinedCT
        ),
      ],
      CT.undefinedCT
    )
  ).wrap(() => {});
  unpackContract(3);
}
