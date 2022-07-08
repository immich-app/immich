export declare class FlattenIterator<V> implements Iterator<V> {
    private outer;
    private inner?;
    constructor(outer: Iterator<any>);
    next(): IteratorResult<V>;
}
//# sourceMappingURL=flatten.d.ts.map