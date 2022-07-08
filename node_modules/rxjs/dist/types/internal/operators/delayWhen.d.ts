import { Observable } from '../Observable';
import { MonoTypeOperatorFunction } from '../types';
/** @deprecated The `subscriptionDelay` parameter will be removed in v8. */
export declare function delayWhen<T>(delayDurationSelector: (value: T, index: number) => Observable<any>, subscriptionDelay: Observable<any>): MonoTypeOperatorFunction<T>;
export declare function delayWhen<T>(delayDurationSelector: (value: T, index: number) => Observable<any>): MonoTypeOperatorFunction<T>;
//# sourceMappingURL=delayWhen.d.ts.map