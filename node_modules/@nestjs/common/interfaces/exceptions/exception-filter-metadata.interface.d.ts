import { ExceptionFilter } from './exception-filter.interface';
import { Type } from '../type.interface';
export interface ExceptionFilterMetadata {
    func: ExceptionFilter['catch'];
    exceptionMetatypes: Type<any>[];
}
