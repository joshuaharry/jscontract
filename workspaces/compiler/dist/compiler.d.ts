import { ParserPlugin } from "@babel/parser";
interface GraphNode {
    name: string;
    dependencies: string[];
    isRecursive: boolean;
    [otherProperty: string]: any;
}
declare type Graph = Record<string, GraphNode>;
export declare const markGraphNodes: (graph: Graph) => GraphNode[];
export declare const ORIGINAL_MODULE_FILE = "./__ORIGINAL_UNTYPED_MODULE__.js";
interface CompilerOptions {
    fileName: string;
    language: ParserPlugin;
}
declare const compileContracts: (options?: CompilerOptions) => string;
export default compileContracts;
