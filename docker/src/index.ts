import { mkdirSync, writeFileSync } from 'node:fs';
import { buildYaml } from '../lib/index';
import { GeneratorOptions } from '../lib/types';

const main = () => {
  const commonOptions = {
    releaseVersion: 'v1.122.0',
    baseLocation: '/home/immich/library',
    serverTimeZone: 'America/New_York',
    healthchecks: true,
    machineLearning: true,
    containerNames: true,
    // hardwareAcceleration: 'nvenc',
  };

  const postgresOptions = {
    postgresUser: 'postgres',
    postgresPassword: 'postgres',
    postgresDatabase: 'immich',
    postgresDataLocation: '/home/immich/database',
  };

  const defaultOptions: GeneratorOptions = { ...commonOptions, ...postgresOptions, redis: true };

  const samples: Array<{ name: string; options: GeneratorOptions }> = [
    { name: 'defaults', options: defaultOptions },
    { name: 'no-names', options: { ...defaultOptions, containerNames: false } },
    { name: 'no-healthchecks', options: { ...defaultOptions, healthchecks: false } },
    { name: 'external-ioredis', options: { ...defaultOptions, redisUrl: 'ioredis://<base64>' } },
    { name: 'external-redis', options: { ...defaultOptions, redisHost: '192.168.0.5', redisPort: 1234 } },
    {
      name: 'external-postgres',
      options: {
        ...defaultOptions,
        postgresUrl: 'postgres://immich:immich@localhost:5432/immich',
        postgresVectorExtension: 'pgvector',
      },
    },
    {
      name: 'split-storage',
      options: {
        ...defaultOptions,
        thumbnailsLocation: '/home/fast/thumbs',
        encodedVideoLocation: '/home/fast/encoded-videos',
      },
    },
  ];

  // TODO replace with vitest test files/scripts
  mkdirSync('./examples', { recursive: true });
  for (const { name, options } of samples) {
    const spec = buildYaml(options);

    const filename = `./examples/docker-compose.${name}.yaml`;
    writeFileSync(filename, spec);
    console.log(`Wrote ${filename}`);
  }
};

main();
