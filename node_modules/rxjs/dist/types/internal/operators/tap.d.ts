import { MonoTypeOperatorFunction, Observer } from '../types';
export interface TapObserver<T> extends Observer<T> {
    subscribe: () => void;
    unsubscribe: () => void;
    finalize: () => void;
}
export declare function tap<T>(observer?: Partial<TapObserver<T>>): MonoTypeOperatorFunction<T>;
export declare function tap<T>(next: (value: T) => void): MonoTypeOperatorFunction<T>;
/** @deprecated Instead of passing separate callback arguments, use an observer argument. Signatures taking separate callback arguments will be removed in v8. Details: https://rxjs.dev/deprecations/subscribe-arguments */
export declare function tap<T>(next?: ((value: T) => void) | null, error?: ((error: any) => void) | null, complete?: (() => void) | null): MonoTypeOperatorFunction<T>;
//# sourceMappingURL=tap.d.ts.map