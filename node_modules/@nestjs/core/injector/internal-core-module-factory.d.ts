import { HttpAdapterHost } from '../helpers/http-adapter-host';
import { DependenciesScanner } from '../scanner';
import { ModuleCompiler } from './compiler';
import { NestContainer } from './container';
export declare class InternalCoreModuleFactory {
    static create(container: NestContainer, scanner: DependenciesScanner, moduleCompiler: ModuleCompiler, httpAdapterHost: HttpAdapterHost): import("@nestjs/common").DynamicModule;
}
