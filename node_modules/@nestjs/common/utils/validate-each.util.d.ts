export declare class InvalidDecoratorItemException extends Error {
    private readonly msg;
    constructor(decorator: string, item: string, context: string);
    what(): string;
}
export declare function validateEach(context: {
    name: string;
}, arr: any[], predicate: Function, decorator: string, item: string): boolean;
