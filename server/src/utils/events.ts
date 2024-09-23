import { ModuleRef, Reflector } from '@nestjs/core';
import _ from 'lodash';
import { EmitConfig } from 'src/decorators';
import { EmitEvent, EmitHandler, IEventRepository } from 'src/interfaces/event.interface';
import { Metadata } from 'src/middleware/auth.guard';
import { repositories } from 'src/repositories';
import { services } from 'src/services';

type Item<T extends EmitEvent> = {
  event: T;
  handler: EmitHandler<T>;
  priority: number;
  label: string;
};

export class ImmichStartupError extends Error {}
export const isStartUpError = (error: unknown): error is ImmichStartupError => error instanceof ImmichStartupError;

export const setupEventHandlers = (moduleRef: ModuleRef) => {
  const reflector = moduleRef.get(Reflector, { strict: false });
  const repository = moduleRef.get<IEventRepository>(IEventRepository);
  const items: Item<EmitEvent>[] = [];

  // discovery
  for (const classRef of [...services, ...repositories.map((r) => r.provide)]) {
    let instance;
    try {
      instance = moduleRef.get<any>(classRef);
    } catch (error: any) {
      if (!error.message.includes('scoped provider')) {
        throw error;
      }
      continue;
    }
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

      const options = reflector.get<EmitConfig>(Metadata.ON_EMIT_CONFIG, handler);
      if (!options) {
        continue;
      }

      items.push({
        event: options.event,
        priority: options.priority || 0,
        handler: handler.bind(instance),
        label: `${typeof classRef === 'string' ? classRef : classRef.name}.${handler.name}`,
      });
    }
  }

  const handlers = _.orderBy(items, ['priority'], ['asc']);

  // register by priority
  for (const { event, handler } of handlers) {
    repository.on(event as EmitEvent, handler);
  }

  return handlers;
};
