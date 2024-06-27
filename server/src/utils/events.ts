import { ModuleRef, Reflector } from '@nestjs/core';
import _ from 'lodash';
import { HandlerOptions } from 'src/decorators';
import { EmitEvent, EmitEventHandler, IEventRepository, OnEvents, events } from 'src/interfaces/event.interface';
import { Metadata } from 'src/middleware/auth.guard';
import { services } from 'src/services';

export const setupEventHandlers = (moduleRef: ModuleRef) => {
  const reflector = moduleRef.get(Reflector, { strict: false });
  const repository = moduleRef.get<IEventRepository>(IEventRepository);
  const handlers: Array<{ event: EmitEvent; handler: EmitEventHandler<EmitEvent>; priority: number }> = [];

  // discovery
  for (const Service of services) {
    const instance = moduleRef.get<OnEvents>(Service);
    for (const event of events) {
      const handler = instance[event] as EmitEventHandler<typeof event>;
      if (typeof handler !== 'function') {
        continue;
      }

      const options = reflector.get<HandlerOptions>(Metadata.EVENT_HANDLER_OPTIONS, handler);
      const priority = options?.priority || 0;

      handlers.push({ event, handler: handler.bind(instance), priority });
    }
  }

  // register by priority
  for (const { event, handler } of _.orderBy(handlers, ['priority'], ['asc'])) {
    repository.on(event, handler);
  }
};
