import { RuntimeException } from './exceptions/runtime.exception';
export declare class ExceptionHandler {
    private static readonly logger;
    handle(exception: RuntimeException | Error): void;
}
