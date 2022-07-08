export declare class IteratorWithOperators<T> implements IterableIterator<T> {
    private source;
    /**
     * @param source Iterator to wrap
     */
    constructor(source: Iterator<T>);
    /**
     * Returns a `{ value, done }` object that adheres to the Iterator protocol
     */
    next(): IteratorResult<T>;
    /**
     * The presence of this method makes the Iterator itself Iterable.
     * This makes it possible to pass it to `for of` and Iterable-accepting functions like `Array.from()`
     */
    [Symbol.iterator](): this;
    /**
     * Returns a new Iterator by running each element thru iteratee
     */
    map<R>(iteratee: (value: T) => R): IteratorWithOperators<R>;
    /**
     * Returns a new Iterator of all elements predicate returns truthy for
     */
    filter(predicate: (element: T) => boolean): IteratorWithOperators<T>;
    filter<R extends T>(predicate: (element: T) => element is R): IteratorWithOperators<R>;
    /**
     * Returns a new Iterator concatenating the Iterator with an additional Iterator or Iterable
     */
    concat<C>(collection: Iterable<C> | Iterator<C>): IteratorWithOperators<T | C>;
    /**
     * Returns a new Iterator that emits slice of the source with n elements taken from the beginning
     *
     * @param limit The number of elements to take.
     */
    take(limit: number): IteratorWithOperators<T>;
    /**
     * Returns a new Iterator that emits slice of the source with n elements dropped from the beginning
     *
     * @param n The number of elements to drop.
     */
    drop(n: number): IteratorWithOperators<T>;
    /**
     * Returns a new Iterator that emits a slice of the source
     *
     * @param {number} start Zero-based positive start index, inclusive
     * @param {number} end Zero-based positive end index, exclusive, defaults to end of iterator
     */
    slice(start: number, end?: number): IteratorWithOperators<T>;
    /**
     * Returns a new Iterator that flattens items emitted by the Iterator a single level deep
     */
    flatten(): IteratorWithOperators<T extends Iterable<infer V> ? V : T>;
    /**
     * Reduces the Iterator to a value which is the accumulated result of running each emitted element thru iteratee,
     * where each successive invocation is supplied the return value of the previous.
     * The first element of collection is used as the initial value.
     */
    reduce(iteratee: (acc: T, val: T) => T): T;
    /**
     * Reduces the Iterator to a value which is the accumulated result of running each emitted element thru iteratee,
     * where each successive invocation is supplied the return value of the previous.
     *
     * @param initialValue The initial value for `acc`
     */
    reduce<A>(iteratee: (acc: A, val: T) => A, initialValue: A): A;
    /**
     * Finds the first item which satisfies the condition provided as the argument.
     * The condition is a typeguard and the result has the correct type.
     * If no argument satisfies the condition, returns undefined.
     *
     * @param predicate The predicate with a typeguard signature to search by
     */
    find<V extends T>(predicate: (value: T) => value is V): V | undefined;
    /**
     * Finds the first item which satisfies the condition provided as the argument.
     * If no item saisfies the condition, returns undefined.
     *
     * @param predicate The predicate to search by
     */
    find(predicate: (value: T) => boolean): T | undefined;
    /**
     * Iterates and checks if `value` is emitted by the Iterator
     *
     * @param value The value to search
     */
    includes(value: T): boolean;
    /**
     * Iterates and checks if `predicate` returns truthy for any element emitted by the Iterator
     */
    some(predicate: (value: T) => boolean): boolean;
    /**
     * Iterates and checks if `predicate` returns truthy for all elements emitted by the Iterator
     */
    every(predicate: (value: T) => boolean): boolean;
    /**
     * Iterates and invokes `iteratee` for every element emitted by the Iterator
     */
    forEach(iteratee: (value: T) => any): void;
    /**
     * Iterates and joins all elements emitted by the Iterator together as a string separated by an optional separator
     */
    join(separator?: string): string;
    /**
     * Iterates and returns all items emitted by the Iterator as an array.
     * Equivalent to passing the Iterator to `Array.from()`
     */
    toArray(): T[];
    /**
     * Iterates and returns all items emitted by the Iterator as an ES6 Set.
     * Equivalent to passing the Iterator to `new Set()`
     */
    toSet(): Set<T>;
    /**
     * Iterates and returns all `[key, value]` paris emitted by the Iterator as an ES6 Map.
     * Equivalent to passing the Iterator to `new Map()`
     */
    toMap<K, V>(this: IteratorWithOperators<[K, V]>): Map<K, V>;
}
/**
 * Creates an Iterator with advanced chainable operator methods for any Iterable or Iterator
 */
export declare function iterate<T>(collection: Iterator<T> | Iterable<T>): IteratorWithOperators<T>;
/**
 * Creates an Iterator that emits pairs of values from the two passed Iterators
 */
export declare function zip<A, B>(a: Iterator<A> | Iterable<A>, b: Iterator<B> | Iterable<B>): IteratorWithOperators<[A, B]>;
export default iterate;
//# sourceMappingURL=iterate.d.ts.map