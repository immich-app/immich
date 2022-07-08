import { HttpServer } from '@nestjs/common';
import { RequestMethod } from '@nestjs/common/enums/request-method.enum';
export declare class RouterMethodFactory {
    get(target: HttpServer, requestMethod: RequestMethod): Function;
}
