/**
 * An iterator that emits results by running each element through a provided predicate
 */
export declare class MapIterator<T, R> implements Iterator<R> {
    private source;
    private iteratee;
    constructor(source: Iterator<T>, iteratee: (value: T) => R);
    next(): IteratorResult<R>;
}
//# sourceMappingURL=map.d.ts.map