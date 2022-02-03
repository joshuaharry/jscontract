declare function test(x: number): string;
declare namespace test {
  export const x: number;
}
export = test;
export as namespace test;


