const thisModule = require(".");

const testableExports = Object.keys(thisModule)
  .filter((anExport) => {
    return typeof thisModule[anExport].randomTest === "function";
  })
  .map((canTest) => {
    return thisModule[canTest];
  });

console.log("Starting random tests...");

/**
 * Another process will need to kill this process.
 */
while (true) {
  for (const testableExport of testableExports) {
    testableExport.randomTest();
  }
}
