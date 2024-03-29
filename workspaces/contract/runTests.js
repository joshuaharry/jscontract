const CT = require('@jscontract/contract');

const testableExports = [];

const findTestableExports = (objectOrFunction, name) => {
  const theType = typeof objectOrFunction;
  if (theType === 'function') {
    if (typeof objectOrFunction.randomTest === 'function') {
      testableExports.push({ name: name, fn: objectOrFunction });
    }
  } else if (theType === 'object' && theType !== null) {
    for (const [key, maybeObj] of Object.entries(objectOrFunction)) {
      findTestableExports(maybeObj, key);
    }
  }
}

findTestableExports(require('.'), require('./package.json').name);

if (testableExports.length === 0) {
  console.log('Found no tests, aborting.');
  process.exit(0);
}

console.log("Starting random tests...");

/**
 * Another process will need to kill this process.
 */
while (true) {
  for (const { name, fn } of testableExports) {
    console.log(`Testing ${name}...`);
  }
}
