import { ModuleRef, Reflector } from '@nestjs/core';
import _ from 'lodash';
import { EventConfig } from 'src/decorators';
import { MetadataKey } from 'src/enum';
import { EmitEvent, EmitHandler, IEventRepository } from 'src/interfaces/event.interface';
import { services } from 'src/services';

type Item<T extends EmitEvent> = {
  event: T;
  handler: EmitHandler<T>;
  priority: number;
  server: boolean;
  label: string;
};

export class ImmichStartupError extends Error {}
export const isStartUpError = (error: unknown): error is ImmichStartupError => error instanceof ImmichStartupError;

export const setupEventHandlers = (moduleRef: ModuleRef) => {
  const reflector = moduleRef.get(Reflector, { strict: false });
  const repository = moduleRef.get<IEventRepository>(IEventRepository);
  const items: Item<EmitEvent>[] = [];

  // discovery
  for (const Service of services) {
    const instance = moduleRef.get<any>(Service);
    const ctx = Object.getPrototypeOf(instance);
    for (const property of Object.getOwnPropertyNames(ctx)) {
      const descriptor = Object.getOwnPropertyDescriptor(ctx, property);
      if (!descriptor || descriptor.get || descriptor.set) {
        continue;
      }

      const handler = instance[property];
      if (typeof handler !== 'function') {
        continue;
      }

      const event = reflector.get<EventConfig>(MetadataKey.EVENT_CONFIG, handler);
      if (!event) {
        continue;
      }

      items.push({
        event: event.name,
        priority: event.priority || 0,
        server: event.server ?? false,
        handler: handler.bind(instance),
        label: `${Service.name}.${handler.name}`,
      });
    }
  }

  const handlers = _.orderBy(items, ['priority'], ['asc']);

  // register by priority
  for (const handler of handlers) {
    repository.on(handler);
  }

  return handlers;
};
