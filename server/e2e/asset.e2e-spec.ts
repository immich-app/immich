import { AuthService, AuthUserDto, JobCommand, JobService, LibraryService, QueueName, UserService } from '@app/domain';
import { AppModule } from '@app/immich/app.module';
import { AppService } from '@app/immich/app.service';
import { LibraryType } from '@app/infra/entities';
import { JobRepository } from '@app/infra/repositories/job.repository';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Job, QueueEvents } from 'bullmq';
import { queue } from 'sharp';
import { AppService as MicroAppService } from 'src/microservices/app.service';
import { MicroservicesModule } from 'src/microservices/microservices.module';
import { DataSource } from 'typeorm';
import { clearDb } from '../test/test-utils';

jest.setTimeout(30000);

describe('Asset', () => {
  let app: INestApplication;

  let database: DataSource;
  let authService: AuthService;
  let appService: AppService;
  let microAppService: MicroAppService;
  let userService: UserService;

  let jobRepository: JobRepository;
  let libraryService: LibraryService;
  let jobService: JobService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule, MicroservicesModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    database = app.get(DataSource);
    authService = app.get(AuthService);
    libraryService = app.get(LibraryService);
    jobService = app.get(JobService);
    appService = app.get(AppService);
    userService = app.get(UserService);
    microAppService = app.get(MicroAppService);
    database = app.get(DataSource);
    await app.init();
    await appService.init();
    await microAppService.init();
  });

  describe('can import library', () => {
    beforeAll(async () => {
      // setup users
      const adminSignUpDto = await authService.adminSignUp({
        email: 'one@test.com',
        password: '1234',
        firstName: 'one',
        lastName: 'test',
      });
      const adminUser = { ...adminSignUpDto, isAdmin: true }; // TODO: find out why adminSignUp doesn't have isAdmin (maybe can just return UserResponseDto)

      const library = await libraryService.create(adminUser, { libraryType: LibraryType.IMPORT, name: 'Library' });

      await libraryService.setImportPaths(adminUser, library.id, { importPaths: ['e2e/assets/nature'] });

      await libraryService.refresh(adminUser, library.id, {});
    });

    it('scans the library', async () => {
      const queueEvents = new QueueEvents(QueueName.LIBRARY, {
        connection: {
          host: process.env.REDIS_HOSTNAME,
          port: Number(process.env.REDIS_PORT),
        },
      });

      const c = jobService.getQueue(QueueName.LIBRARY);
      const jobs = await c.getJobs();

      // Segfaults here
      const d = await jobs[1].waitUntilFinished(queueEvents);

      console.log(d);

      const jobStatus = await jobService.getAllJobsStatus();
      console.log(jobStatus);

      expect(true).toBe(false);
    });
  });

  afterAll(async () => {
    // await clearDb(database);
    await app.close();
  });
});
