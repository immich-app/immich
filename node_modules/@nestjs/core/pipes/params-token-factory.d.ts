import { Paramtype } from '@nestjs/common';
import { RouteParamtypes } from '@nestjs/common/enums/route-paramtypes.enum';
export declare class ParamsTokenFactory {
    exchangeEnumForString(type: RouteParamtypes): Paramtype;
}
