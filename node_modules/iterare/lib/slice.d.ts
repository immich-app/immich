export declare class SliceIterator<T> implements Iterator<T> {
    private source;
    private start;
    private end;
    private i;
    /**
     * @param {Iterator<T>} source Source Iterator
     * @param {number} start Zero-based positive start index, inclusive
     * @param {number} end Zero-based positive end index, exclusive, defaults to end of iterator
     */
    constructor(source: Iterator<T>, start: number, end?: number);
    next(): IteratorResult<T>;
}
//# sourceMappingURL=slice.d.ts.map