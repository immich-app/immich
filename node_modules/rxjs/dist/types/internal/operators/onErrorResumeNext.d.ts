import { ObservableInputTuple, OperatorFunction } from '../types';
export declare function onErrorResumeNext<T, A extends readonly unknown[]>(sources: [...ObservableInputTuple<A>]): OperatorFunction<T, T | A[number]>;
export declare function onErrorResumeNext<T, A extends readonly unknown[]>(...sources: [...ObservableInputTuple<A>]): OperatorFunction<T, T | A[number]>;
//# sourceMappingURL=onErrorResumeNext.d.ts.map