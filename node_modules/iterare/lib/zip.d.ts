export declare class ZipIterator<A, B> implements Iterator<[A, B]> {
    private a;
    private b;
    constructor(a: Iterator<A>, b: Iterator<B>);
    next(): IteratorResult<[A, B]>;
}
//# sourceMappingURL=zip.d.ts.map