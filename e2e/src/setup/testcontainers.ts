import { log } from 'console';
import { DockerComposeEnvironment, Wait } from 'testcontainers';

const setup = async () => {
  const composeFilePath = `${__dirname}/../../`;
  const composeFile = 'docker-compose.yml';

  const serverContainer = 'immich-e2e-server';
  const dbContainer = 'database';

  console.log('Starting e2e test containers, please be patient...');
  const environment = await new DockerComposeEnvironment(composeFilePath, composeFile)
    .withWaitStrategy(
      serverContainer,
      Wait.forAll([
        Wait.forLogMessage('Immich Microservices is running'),
        Wait.forLogMessage('Immich Server is listening on'),
      ]),
    )
    .withStartupTimeout(120000)
    .up();

  const SERVER_HOST = environment.getContainer(serverContainer).getHost();
  const SERVER_PORT = environment.getContainer(serverContainer).getMappedPort(3001);

  const DB_HOST = environment.getContainer(dbContainer).getHost();
  const DB_PORT = environment.getContainer(dbContainer).getMappedPort(5432);

  process.env.IMMICH_SERVER_HOST = SERVER_HOST;
  process.env.IMMICH_SERVER_PORT = SERVER_PORT.toString();
  process.env.IMMICH_SERVER_URL = `${SERVER_HOST}:${SERVER_PORT}`;

  process.env.DB_HOST = DB_HOST;
  process.env.DB_PORT = DB_PORT.toString();
  process.env.DB_URL = `${DB_HOST}:${DB_PORT}`;

  console.log(`Immich server started at: http://${process.env.IMMICH_SERVER_URL}`);
  console.log(`Database server started at: ${process.env.DB_URL}`);

  return async () => {
    await environment.down();
  };
};

export default setup;
