import { RpcExceptionFilter } from './rpc-exception-filter.interface';
import { Type } from '../type.interface';
export interface RpcExceptionFilterMetadata {
    func: RpcExceptionFilter['catch'];
    exceptionMetatypes: Type<any>[];
}
