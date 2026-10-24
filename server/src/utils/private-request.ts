import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

// Keep PIN-protected metadata out of request logs and HTTP caches.
export const PrivateRequest = Reflector.createDecorator<boolean>();

export const isPrivateRequest = (reflector: Reflector, context: ExecutionContext): boolean =>
  !!reflector.getAllAndOverride(PrivateRequest, [context.getHandler(), context.getClass()]);
