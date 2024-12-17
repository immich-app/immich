import { dump as dumpYaml } from 'js-yaml';
import { ComposeBuilder, ServiceBuilder } from 'lib/docker-compose/builder';
import { ContainerName, GeneratorOptions, ServiceName } from 'lib/types';
import { asQueryParams, getImmichEnvironment, getImmichVolumes, isExternalPostgres, isIoRedis } from 'lib/utils';

const RELEASE_VERSION = 'v1.122.0';
const postgresHealthCheck = [
  'pg_isready --dbname="$${POSTGRES_DB}" --username="$${POSTGRES_USER}" || exit 1;',
  `Chksum="$$(psql --dbname="$\${POSTGRES_DB}" --username="$\${POSTGRES_USER}" --tuples-only --no-align`,
  `--command='SELECT COALESCE(SUM(checksum_failures), 0) FROM pg_stat_database')";`,
  'echo "checksum failure count is $$Chksum";',
  `[ "$$Chksum" = '0' ] || exit 1\n`,
].join(' ');
const postgresCommand = [
  `postgres`,
  `-c shared_preload_libraries=vectors.so`,
  `-c 'search_path="$$user", public, vectors'`,
  `-c logging_collector=on`,
  `-c max_wal_size=2GB`,
  `-c shared_buffers=512MB`,
  `-c wal_compression=on`,
].join(' ');

const build = (options: GeneratorOptions) => {
  const healthchecksEnabled = options.healthchecks ?? true;
  const containerNames = options.containerNames ?? true;

  const immichService = ServiceBuilder.create(ServiceName.ImmichServer)
    .setImage(`ghcr.io/immich-app/immich-server:${RELEASE_VERSION}`)
    .setContainerName(containerNames && ContainerName.ImmichServer)
    .setRestartPolicy('always')
    .setHealthcheck(healthchecksEnabled)
    .setEnvironment(getImmichEnvironment(options))
    .addExposedPort(2283)
    .addVolumes(getImmichVolumes(options));

  const machineLearningEnabled = options.machineLearning;
  const modelCacheVolume = 'model-cache';
  const machineLearningService =
    machineLearningEnabled &&
    ServiceBuilder.create(ServiceName.ImmichMachineLearning)
      .setImage(`ghcr.io/immich-app/immich-machine-learning:${RELEASE_VERSION}-cuda`)
      .setContainerName(containerNames && ContainerName.ImmichMachineLearning)
      .setRestartPolicy('always')
      .setHealthcheck(healthchecksEnabled)
      .addVolume(`${modelCacheVolume}:/cache`);

  const redisService = isIoRedis(options)
    ? false
    : ServiceBuilder.create(ServiceName.Redis)
        .setImage('docker.io/redis:6.2-alpine')
        .setContainerName(containerNames && ContainerName.Redis)
        .setRestartPolicy('always')
        .setHealthcheck(healthchecksEnabled && 'redis-cli ping || exit 1');

  const postgresService = isExternalPostgres(options)
    ? false
    : ServiceBuilder.create(ServiceName.Postgres)
        .setImage('docker.io/tensorchord/pgvecto-rs:pg14-v0.2.0')
        .setContainerName(containerNames && ContainerName.Postgres)
        .setRestartPolicy('always')
        .setEnvironment({
          POSTGRES_PASSWORD: options.postgresPassword,
          POSTGRES_USER: options.postgresUser,
          POSTGRES_DB: options.postgresDatabase,
          POSTGRES_INITDB_ARGS: '--data-checksums',
        })
        .setHealthcheck(healthchecksEnabled && postgresHealthCheck)
        .setCommand(postgresCommand)
        .addVolume(`${options.postgresDataLocation}:/var/lib/postgresql/data`);

  const domain = 'https://get.immich.app';
  const url = `${domain}/compose?${asQueryParams(options)}`;

  return ComposeBuilder.create('immich')
    .addComment(`This docker compose file was originally generated at https://get.immich.app/compose`)
    .addComment(url)
    .addComment(`${dumpYaml({ options }, { indent: 2 })}`)
    .addService(immichService.addDependsOn(redisService).addDependsOn(postgresService))
    .addService(machineLearningService)
    .addService(redisService)
    .addService(postgresService)
    .addVolume(modelCacheVolume, machineLearningEnabled && {});
};

export const buildSpec = (options: GeneratorOptions) => build(options).asSpec();
export const buildYaml = (options: GeneratorOptions) => build(options).asYaml();
