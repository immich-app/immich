declare type SetImmediateFunction = (handler: () => void, ...args: any[]) => number;
declare type ClearImmediateFunction = (handle: number) => void;
interface ImmediateProvider {
    setImmediate: SetImmediateFunction;
    clearImmediate: ClearImmediateFunction;
    delegate: {
        setImmediate: SetImmediateFunction;
        clearImmediate: ClearImmediateFunction;
    } | undefined;
}
export declare const immediateProvider: ImmediateProvider;
export {};
//# sourceMappingURL=immediateProvider.d.ts.map