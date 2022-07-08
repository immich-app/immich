export declare class FilterIterator<T, V extends T = T> implements Iterator<T> {
    private source;
    private predicate;
    constructor(source: Iterator<T>, predicate: ((element: T) => element is V) | ((element: T) => boolean));
    next(): IteratorResult<V>;
}
//# sourceMappingURL=filter.d.ts.map