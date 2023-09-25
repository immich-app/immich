import { PostgreSqlContainer } from '@testcontainers/postgresql';
import { DockerComposeEnvironment, GenericContainer, Wait } from 'testcontainers';
export default async () => {
  const composeFilePath = '../docker/';
  const composeFile = 'docker-compose.e2e.yml';

  process.env.IMMICH_SERVER_URL = 'asdf';
  process.env.IMMICH_API_URL_EXTERNAL = 'asdf';
  process.env.TYPESENSE_ENABLED = 'false';

  process.env.IMMICH_MACHINE_LEARNING_ENABLED = 'false';

  const environment = await new DockerComposeEnvironment(composeFilePath, composeFile)
    .withBuild()
    // .withWaitStrategy('immich_server-e2e', Wait.forLogMessage('Immich Server is listening on'))
    // .withWaitStrategy('immich_microservices-e2e ', Wait.forLogMessage('Immich Microservices is listening on'))
    //.withBuild()
    .up();
  console.log(environment);
};

export async function waitForQueues() {
  process.env.NODE_ENV = 'development';
  process.env.TYPESENSE_ENABLED = 'false';
  process.env.IMMICH_MACHINE_LEARNING_ENABLED = 'false';

  const pg = await new PostgreSqlContainer('postgres')
    .withExposedPorts(5432)
    .withDatabase('immich')
    .withUsername('postgres')
    .withPassword('postgres')
    .withReuse()
    .start();

  process.env.DB_URL = pg.getConnectionUri();

  const redis = await new GenericContainer('redis').withExposedPorts(6379).withReuse().start();

  process.env.REDIS_PORT = String(redis.getMappedPort(6379));
  process.env.REDIS_HOSTNAME = redis.getHost();
}
