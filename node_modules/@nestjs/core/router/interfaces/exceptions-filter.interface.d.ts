import { Controller } from '@nestjs/common/interfaces/controllers/controller.interface';
import { ExceptionsHandler } from '../../exceptions/exceptions-handler';
import { ContextId } from '../../injector/instance-wrapper';
export interface ExceptionsFilter {
    create(instance: Controller, callback: Function, module: string, contextId?: ContextId, inquirerId?: string): ExceptionsHandler;
}
