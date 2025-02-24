import { AuthDto } from 'src/dtos/auth.dto';
import { SyncRequestType } from 'src/enum';
import { SyncService } from 'src/services/sync.service';
import { TestContext, TestFactory } from 'test/factory';
import { getKyselyDB, newTestService } from 'test/utils';

const setup = async () => {
  const user = TestFactory.user();
  const session = TestFactory.session({ userId: user.id });
  const auth = TestFactory.auth({ session, user });

  const db = await getKyselyDB();

  const context = await TestContext.from(db).withUser(user).withSession(session).create();

  const { sut } = newTestService(SyncService, context);

  const testSync = async (auth: AuthDto, types: SyncRequestType[]) => {
    const stream = TestFactory.stream();
    await sut.stream(auth, stream, { types });

    return stream.getResponse();
  };

  return {
    auth,
    context,
    sut,
    testSync,
  };
};

describe(SyncService.name, () => {
  describe.concurrent('users', () => {
    it('should detect and sync the first user', async () => {
      const { context, auth, sut, testSync } = await setup();

      const user = await context.userRepository.get(auth.user.id, { withDeleted: false });
      if (!user) {
        expect.fail('First user should exist');
      }

      const initialSyncResponse = await testSync(auth, [SyncRequestType.UsersV1]);
      expect(initialSyncResponse).toHaveLength(1);
      expect(initialSyncResponse).toEqual([
        {
          ack: expect.any(String),
          data: {
            deletedAt: user.deletedAt,
            email: user.email,
            id: user.id,
            name: user.name,
          },
          type: 'UserV1',
        },
      ]);

      const acks = [initialSyncResponse[0].ack];
      await sut.setAcks(auth, { acks });
      const ackSyncResponse = await testSync(auth, [SyncRequestType.UsersV1]);

      expect(ackSyncResponse).toHaveLength(0);
    });

    it('should detect and sync a soft deleted user', async () => {
      const { auth, context, sut, testSync } = await setup();

      const deletedAt = new Date().toISOString();
      const deleted = await context.createUser({ deletedAt });

      const response = await testSync(auth, [SyncRequestType.UsersV1]);

      expect(response).toHaveLength(2);
      expect(response).toEqual(
        expect.arrayContaining([
          {
            ack: expect.any(String),
            data: {
              deletedAt: null,
              email: auth.user.email,
              id: auth.user.id,
              name: auth.user.name,
            },
            type: 'UserV1',
          },
          {
            ack: expect.any(String),
            data: {
              deletedAt,
              email: deleted.email,
              id: deleted.id,
              name: deleted.name,
            },
            type: 'UserV1',
          },
        ]),
      );

      const acks = [response[1].ack];
      await sut.setAcks(auth, { acks });
      const ackSyncResponse = await testSync(auth, [SyncRequestType.UsersV1]);

      expect(ackSyncResponse).toHaveLength(0);
    });

    it('should detect and sync a deleted user', async () => {
      const { auth, context, sut, testSync } = await setup();

      const user = await context.createUser();
      await context.userRepository.delete({ id: user.id }, true);

      const response = await testSync(auth, [SyncRequestType.UsersV1]);

      expect(response).toHaveLength(2);
      expect(response).toEqual(
        expect.arrayContaining([
          {
            ack: expect.any(String),
            data: {
              userId: user.id,
            },
            type: 'UserDeleteV1',
          },
          {
            ack: expect.any(String),
            data: {
              deletedAt: null,
              email: auth.user.email,
              id: auth.user.id,
              name: auth.user.name,
            },
            type: 'UserV1',
          },
        ]),
      );

      const acks = response.map(({ ack }) => ack);
      await sut.setAcks(auth, { acks });
      const ackSyncResponse = await testSync(auth, [SyncRequestType.UsersV1]);

      expect(ackSyncResponse).toHaveLength(0);
    });

    it('should sync a user and then an update to that same user', async () => {
      const { auth, context, sut, testSync } = await setup();

      const initialSyncResponse = await testSync(auth, [SyncRequestType.UsersV1]);

      expect(initialSyncResponse).toHaveLength(1);
      expect(initialSyncResponse).toEqual(
        expect.arrayContaining([
          {
            ack: expect.any(String),
            data: {
              deletedAt: null,
              email: auth.user.email,
              id: auth.user.id,
              name: auth.user.name,
            },
            type: 'UserV1',
          },
        ]),
      );

      const acks = [initialSyncResponse[0].ack];
      await sut.setAcks(auth, { acks });

      const updated = await context.userRepository.update(auth.user.id, { name: 'new name' });

      const updatedSyncResponse = await testSync(auth, [SyncRequestType.UsersV1]);

      expect(updatedSyncResponse).toHaveLength(1);
      expect(updatedSyncResponse).toEqual(
        expect.arrayContaining([
          {
            ack: expect.any(String),
            data: {
              deletedAt: null,
              email: auth.user.email,
              id: auth.user.id,
              name: updated.name,
            },
            type: 'UserV1',
          },
        ]),
      );
    });
  });
});
