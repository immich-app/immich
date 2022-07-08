import { ParamData, RouteParamMetadata } from '../decorators/http/route-params.decorator';
import { PipeTransform, Type } from '../interfaces';
import { CustomParamFactory } from '../interfaces/features/custom-route-param-factory.interface';
export declare function assignCustomParameterMetadata(args: Record<number, RouteParamMetadata>, paramtype: number | string, index: number, factory: CustomParamFactory, data?: ParamData, ...pipes: (Type<PipeTransform> | PipeTransform)[]): {};
