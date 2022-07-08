import { RouteParamtypes } from '@nestjs/common/enums/route-paramtypes.enum';
import { IRouteParamsFactory } from './interfaces/route-params-factory.interface';
export declare class RouteParamsFactory implements IRouteParamsFactory {
    exchangeKeyForValue<TRequest extends Record<string, any> = any, TResponse = any, TResult = any>(key: RouteParamtypes | string, data: string | object | any, { req, res, next }: {
        req: TRequest;
        res: TResponse;
        next: Function;
    }): TResult;
}
