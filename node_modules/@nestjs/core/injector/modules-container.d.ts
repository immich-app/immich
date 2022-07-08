import { Module } from './module';
export declare class ModulesContainer extends Map<string, Module> {
    private readonly _applicationId;
    get applicationId(): string;
}
