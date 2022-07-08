declare type SetTimeoutFunction = (handler: () => void, timeout?: number, ...args: any[]) => number;
declare type ClearTimeoutFunction = (handle: number) => void;
interface TimeoutProvider {
    setTimeout: SetTimeoutFunction;
    clearTimeout: ClearTimeoutFunction;
    delegate: {
        setTimeout: SetTimeoutFunction;
        clearTimeout: ClearTimeoutFunction;
    } | undefined;
}
export declare const timeoutProvider: TimeoutProvider;
export {};
//# sourceMappingURL=timeoutProvider.d.ts.map