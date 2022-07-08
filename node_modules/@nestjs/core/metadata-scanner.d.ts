import { Injectable } from '@nestjs/common/interfaces/injectable.interface';
export declare class MetadataScanner {
    scanFromPrototype<T extends Injectable, R = any>(instance: T, prototype: object, callback: (name: string) => R): R[];
    getAllFilteredMethodNames(prototype: object): IterableIterator<string>;
}
