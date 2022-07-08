export declare class ConcatIterator<T> implements Iterator<T> {
    private toConcat;
    constructor(toConcat: Iterator<T>[]);
    next(): IteratorResult<T>;
}
//# sourceMappingURL=concat.d.ts.map