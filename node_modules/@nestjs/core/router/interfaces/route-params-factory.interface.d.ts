import { RouteParamtypes } from '@nestjs/common/enums/route-paramtypes.enum';
export interface IRouteParamsFactory {
    exchangeKeyForValue<TRequest extends Record<string, any> = any, TResponse = any, TResult = any>(key: RouteParamtypes | string, data: any, { req, res, next }: {
        req: TRequest;
        res: TResponse;
        next: Function;
    }): TResult;
}
