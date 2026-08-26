import { Reflector } from '@nestjs/core';
import { JobConfig } from 'src/decorators';
import { JobName, MetadataKey } from 'src/enum';
import { services } from 'src/services';
import { getMethodNames } from 'src/utils/misc';
import { describe, expect, it } from 'vitest';

/**
 * The server refuses to boot when a JobName has no @OnJob handler, which is a
 * good invariant but a slow way to find out: it surfaces only once a container
 * starts. This checks the same thing in milliseconds.
 */
describe('job handlers', () => {
  const reflector = new Reflector();
  const handled = new Set<string>();

  for (const Service of services) {
    // getMethodNames walks the prototype *of* what it is given, so it needs an
    // instance. Object.create gives one without running any constructor.
    const instance = Object.create(Service.prototype) as Record<string, unknown>;

    for (const methodName of getMethodNames(instance)) {
      const config = reflector.get<JobConfig>(MetadataKey.JobConfig, instance[methodName] as () => unknown);
      if (config) {
        handled.add(config.name);
      }
    }
  }

  it('should have a handler for every job name', () => {
    const missing = Object.values(JobName).filter((name) => !handled.has(name));

    expect(missing).toEqual([]);
  });

  it('should find handlers at all, so an empty result cannot pass vacuously', () => {
    expect(handled.size).toBeGreaterThan(20);
  });
});
