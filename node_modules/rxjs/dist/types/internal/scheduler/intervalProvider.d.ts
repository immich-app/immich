declare type SetIntervalFunction = (handler: () => void, timeout?: number, ...args: any[]) => number;
declare type ClearIntervalFunction = (handle: number) => void;
interface IntervalProvider {
    setInterval: SetIntervalFunction;
    clearInterval: ClearIntervalFunction;
    delegate: {
        setInterval: SetIntervalFunction;
        clearInterval: ClearIntervalFunction;
    } | undefined;
}
export declare const intervalProvider: IntervalProvider;
export {};
//# sourceMappingURL=intervalProvider.d.ts.map