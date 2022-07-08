export declare class ExceptionsZone {
    private static readonly exceptionHandler;
    static run(callback: () => void, teardown?: (err: any) => void, autoFlushLogs?: boolean): void;
    static asyncRun(callback: () => Promise<void>, teardown?: (err: any) => void, autoFlushLogs?: boolean): Promise<void>;
}
