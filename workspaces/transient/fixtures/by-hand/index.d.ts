export const str: string;
export const num: number;
export const arw: (n: number) => string;
export function fn(x: string): number;
export const withDots: (...args: string[]) => number;
export const withGeneric:  <T>(fn: T) => T;
export interface Hello {
  hello: string;
}
export const onHello: ((x: Hello) => number) | ((x: Hello) => string);
export function copyFile(src: string, dest: string, flags?: number): Promise<void>;
export function copyFile(src: string, dest: string, callback: (err: Error) => void): void;
export function copyFile(src: string, dest: string, flags: number, callback: (err: Error) => void): void;