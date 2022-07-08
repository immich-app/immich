import { AbstractHttpAdapter } from '../adapters';
import { HttpAdapterHost } from '../helpers/http-adapter-host';
export declare class InternalProvidersStorage {
    private readonly _httpAdapterHost;
    private _httpAdapter;
    get httpAdapterHost(): HttpAdapterHost;
    get httpAdapter(): AbstractHttpAdapter;
    set httpAdapter(httpAdapter: AbstractHttpAdapter);
}
