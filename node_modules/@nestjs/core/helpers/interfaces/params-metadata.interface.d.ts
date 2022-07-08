import { ParamData } from '@nestjs/common';
export declare type ParamsMetadata = Record<number, ParamMetadata>;
export interface ParamMetadata {
    index: number;
    data?: ParamData;
}
