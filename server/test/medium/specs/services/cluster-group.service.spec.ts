import { Kysely } from 'kysely';
import { AccessRepository } from 'src/repositories/access.repository';
import { ClusterGroupRepository } from 'src/repositories/cluster-group.repository';
import { EventRepository } from 'src/repositories/event.repository';
import { LoggingRepository } from 'src/repositories/logging.repository';
import { PersonRepository } from 'src/repositories/person.repository';
import { UserRepository } from 'src/repositories/user.repository';
import { DB } from 'src/schema';
import { ClusterGroupService } from 'src/services/cluster-group.service';
import { newMediumService } from 'test/medium.factory';
import { factory } from 'test/small.factory';
import { getKyselyDB } from 'test/utils';

let defaultDatabase: Kysely<DB>;

const setup = (db?: Kysely<DB>) => {
  const ctx = newMediumService(ClusterGroupService, {
    database: db || defaultDatabase,
    real: [AccessRepository, ClusterGroupRepository, PersonRepository, UserRepository],
    mock: [LoggingRepository, EventRepository],
  });

  ctx.ctx.getMock(EventRepository).emit.mockResolvedValue();

  return ctx;
};

const getClusterGroupId = async (ctx: ReturnType<typeof setup>['ctx'], userId: string) => {
  const { clusterGroupId } = await ctx.database
    .selectFrom('user')
    .select('user.clusterGroupId')
    .where('user.id', '=', userId)
    .executeTakeFirstOrThrow();

  return clusterGroupId;
};

const getPeople = (ctx: ReturnType<typeof setup>['ctx'], ownerId: string) =>
  ctx.database.selectFrom('person').selectAll('person').where('person.ownerId', '=', ownerId).execute();

beforeAll(async () => {
  defaultDatabase = await getKyselyDB();
});

describe(ClusterGroupService.name, () => {
  describe('createRequest', () => {
    it('should create a request for another user', async () => {
      const { sut, ctx } = setup();
      const { user: owner } = await ctx.newUser();
      const { user: invitee } = await ctx.newUser();
      const auth = factory.auth({ user: owner });
      const clusterGroupId = await getClusterGroupId(ctx, owner.id);

      const { value: request } = await sut.createRequest(auth, clusterGroupId, { userId: invitee.id });

      expect(request).toEqual(
        expect.objectContaining({ clusterGroupId, userId: invitee.id, createdAt: expect.any(Date) }),
      );
      expect(ctx.getMock(EventRepository).emit).toHaveBeenCalledWith('ClusterGroupRequest', {
        clusterGroupId,
        userId: invitee.id,
        senderName: owner.name,
      });
    });

    it('should reject a cluster group the user is not a member of', async () => {
      const { sut, ctx } = setup();
      const { user: owner } = await ctx.newUser();
      const { user: other } = await ctx.newUser();
      const auth = factory.auth({ user: owner });
      const otherClusterGroupId = await getClusterGroupId(ctx, other.id);

      await expect(sut.createRequest(auth, otherClusterGroupId, { userId: other.id })).rejects.toThrow(
        'Not found or no clusterGroupRequest.create access',
      );
    });

    it('should return the existing request when it was already created', async () => {
      const { sut, ctx } = setup();
      const { user: owner } = await ctx.newUser();
      const { user: invitee } = await ctx.newUser();
      const auth = factory.auth({ user: owner });
      const clusterGroupId = await getClusterGroupId(ctx, owner.id);

      const created = await sut.createRequest(auth, clusterGroupId, { userId: invitee.id });
      expect(created.duplicate).toBe(false);

      const again = await sut.createRequest(auth, clusterGroupId, { userId: invitee.id });
      expect(again.duplicate).toBe(true);
      expect(again.value).toEqual(created.value);

      await expect(sut.getRequests(factory.auth({ user: invitee }))).resolves.toEqual([created.value]);
    });

    it('should reject an unknown user', async () => {
      const { sut, ctx } = setup();
      const { user: owner } = await ctx.newUser();
      const auth = factory.auth({ user: owner });
      const clusterGroupId = await getClusterGroupId(ctx, owner.id);

      await expect(sut.createRequest(auth, clusterGroupId, { userId: factory.uuid() })).rejects.toThrow(
        'User not found',
      );
    });
  });

  describe('getRequests', () => {
    it('should only return the requests for the current user', async () => {
      const { sut, ctx } = setup();
      const { user: owner } = await ctx.newUser();
      const { user: invitee } = await ctx.newUser();
      const { user: other } = await ctx.newUser();
      const clusterGroupId = await getClusterGroupId(ctx, owner.id);

      const { value: request } = await sut.createRequest(factory.auth({ user: owner }), clusterGroupId, {
        userId: invitee.id,
      });
      await sut.createRequest(factory.auth({ user: owner }), clusterGroupId, { userId: other.id });

      await expect(sut.getRequests(factory.auth({ user: invitee }))).resolves.toEqual([request]);
    });
  });

  describe('getRequestsForGroup', () => {
    it('should return the requests sent by the cluster group', async () => {
      const { sut, ctx } = setup();
      const { user: owner } = await ctx.newUser();
      const { user: invitee } = await ctx.newUser();
      const { user: other } = await ctx.newUser();
      const auth = factory.auth({ user: owner });
      const clusterGroupId = await getClusterGroupId(ctx, owner.id);

      const { value: request } = await sut.createRequest(auth, clusterGroupId, { userId: invitee.id });

      await expect(sut.getRequestsForGroup(auth, clusterGroupId)).resolves.toEqual([request]);
      await expect(sut.getRequestsForGroup(factory.auth({ user: other }), clusterGroupId)).rejects.toThrow(
        'Not found or no clusterGroup.read access',
      );
    });
  });

  describe('getUsers', () => {
    it('should return the members of the cluster group', async () => {
      const { sut, ctx } = setup();
      const { user: owner } = await ctx.newUser();
      const { user: member } = await ctx.newUser();
      const { user: other } = await ctx.newUser();
      const auth = factory.auth({ user: owner });
      const clusterGroupId = await getClusterGroupId(ctx, owner.id);

      const { value: request } = await sut.createRequest(auth, clusterGroupId, { userId: member.id });
      await sut.acceptRequest(factory.auth({ user: member }), request.id);

      const users = await sut.getUsers(auth, clusterGroupId);
      expect(users.map(({ id }) => id)).toEqual(expect.arrayContaining([owner.id, member.id]));
      expect(users.map(({ id }) => id)).not.toContain(other.id);

      await expect(sut.getUsers(factory.auth({ user: other }), clusterGroupId)).rejects.toThrow(
        'Not found or no clusterGroup.read access',
      );
    });

    it('should let a user with a pending request see the members', async () => {
      const { sut, ctx } = setup();
      const { user: owner } = await ctx.newUser();
      const { user: invitee } = await ctx.newUser();
      const auth = factory.auth({ user: owner });
      const clusterGroupId = await getClusterGroupId(ctx, owner.id);

      await expect(sut.getUsers(factory.auth({ user: invitee }), clusterGroupId)).rejects.toThrow(
        'Not found or no clusterGroup.read access',
      );

      await sut.createRequest(auth, clusterGroupId, { userId: invitee.id });

      const users = await sut.getUsers(factory.auth({ user: invitee }), clusterGroupId);
      expect(users.map(({ id }) => id)).toContain(owner.id);
    });
  });

  describe('acceptRequest', () => {
    it('should move the user into the cluster group and delete the request', async () => {
      const { sut, ctx } = setup();
      const { user: owner } = await ctx.newUser();
      const { user: invitee } = await ctx.newUser();
      const clusterGroupId = await getClusterGroupId(ctx, owner.id);

      const { value: request } = await sut.createRequest(factory.auth({ user: owner }), clusterGroupId, {
        userId: invitee.id,
      });
      await sut.acceptRequest(factory.auth({ user: invitee }), request.id);

      await expect(getClusterGroupId(ctx, invitee.id)).resolves.toBe(clusterGroupId);
      await expect(sut.getRequests(factory.auth({ user: invitee }))).resolves.toEqual([]);
    });

    it('should not accept a request belonging to someone else', async () => {
      const { sut, ctx } = setup();
      const { user: owner } = await ctx.newUser();
      const { user: invitee } = await ctx.newUser();
      const { user: other } = await ctx.newUser();
      const clusterGroupId = await getClusterGroupId(ctx, owner.id);
      const otherClusterGroupId = await getClusterGroupId(ctx, other.id);

      const { value: request } = await sut.createRequest(factory.auth({ user: owner }), clusterGroupId, {
        userId: invitee.id,
      });

      await expect(sut.acceptRequest(factory.auth({ user: other }), request.id)).rejects.toThrow(
        'Not found or no clusterGroupRequest.read access',
      );
      await expect(getClusterGroupId(ctx, other.id)).resolves.toBe(otherClusterGroupId);
    });
  });

  describe('leave', () => {
    it('should move the user into a new cluster group', async () => {
      const { sut, ctx } = setup();
      const { user: owner } = await ctx.newUser();
      const { user } = await ctx.newUser();
      const clusterGroupId = await getClusterGroupId(ctx, owner.id);
      const auth = factory.auth({ user });

      const { value: request } = await sut.createRequest(factory.auth({ user: owner }), clusterGroupId, {
        userId: user.id,
      });
      await sut.acceptRequest(auth, request.id);

      await sut.leave(auth, clusterGroupId);

      const newClusterGroupId = await getClusterGroupId(ctx, user.id);
      expect(newClusterGroupId).not.toBe(clusterGroupId);
      await expect(
        ctx.database
          .selectFrom('cluster_group')
          .select('cluster_group.id')
          .where('cluster_group.id', '=', newClusterGroupId)
          .executeTakeFirst(),
      ).resolves.toBeDefined();
    });

    it('should reject a cluster group the user is not a member of', async () => {
      const { sut, ctx } = setup();
      const { user } = await ctx.newUser();
      const { user: other } = await ctx.newUser();
      const auth = factory.auth({ user });
      const otherClusterGroupId = await getClusterGroupId(ctx, other.id);

      await expect(sut.leave(auth, otherClusterGroupId)).rejects.toThrow('Not found or no clusterGroup.leave access');
    });

    it('should not let the last member leave', async () => {
      const { sut, ctx } = setup();
      const { user } = await ctx.newUser();
      const auth = factory.auth({ user });
      const clusterGroupId = await getClusterGroupId(ctx, user.id);

      await expect(sut.leave(auth, clusterGroupId)).rejects.toThrow(
        'Cannot leave a cluster group without any other members',
      );
      await expect(getClusterGroupId(ctx, user.id)).resolves.toBe(clusterGroupId);
    });
  });

  describe('joining a cluster group', () => {
    it('should take the groups of the user along', async () => {
      const { sut, ctx } = setup(await getKyselyDB());
      const personRepo = ctx.get(PersonRepository);
      const { user: owner } = await ctx.newUser();
      const { user } = await ctx.newUser();
      const clusterGroupId = await getClusterGroupId(ctx, owner.id);

      const { person } = await ctx.newPerson({ ownerId: user.id });
      const { asset } = await ctx.newAsset({ ownerId: user.id });
      const { assetFace } = await ctx.newAssetFace({ assetId: asset.id, personGroupId: person.personGroupId });

      const { value: request } = await sut.createRequest(factory.auth({ user: owner }), clusterGroupId, {
        userId: user.id,
      });
      await sut.acceptRequest(factory.auth({ user }), request.id);

      // the group keeps its id, it only changes cluster group
      await expect(personRepo.getByGroupId(person)).resolves.toEqual(
        expect.objectContaining({ personGroupId: person.personGroupId }),
      );
      await expect(
        ctx.database
          .selectFrom('person_group')
          .select('person_group.clusterGroupId')
          .where('person_group.id', '=', person.personGroupId)
          .executeTakeFirstOrThrow(),
      ).resolves.toEqual({ clusterGroupId });
      await expect(
        ctx.database
          .selectFrom('asset_face')
          .select('asset_face.personGroupId')
          .where('asset_face.id', '=', assetFace.id)
          .executeTakeFirstOrThrow(),
      ).resolves.toEqual({ personGroupId: person.personGroupId });
      await expect(getClusterGroupId(ctx, user.id)).resolves.toBe(clusterGroupId);
    });
  });

  describe('leaving a shared cluster group', () => {
    it('should recreate the shared groups and take the rest of its own along', async () => {
      const { sut, ctx } = setup(await getKyselyDB());
      const personRepo = ctx.get(PersonRepository);
      const { user: user1 } = await ctx.newUser();
      const { user: user2 } = await ctx.newUser();
      const clusterGroupId = await getClusterGroupId(ctx, user1.id);

      const { value: request } = await sut.createRequest(factory.auth({ user: user1 }), clusterGroupId, {
        userId: user2.id,
      });
      await sut.acceptRequest(factory.auth({ user: user2 }), request.id);

      // a group both of them have a person in
      const { person: shared1 } = await ctx.newPerson({ ownerId: user1.id });
      await ctx.newPerson({ ownerId: user2.id, personGroupId: shared1.personGroupId });
      // a group only the leaving user has a person in
      const { person: only2 } = await ctx.newPerson({ ownerId: user2.id });
      // a group only the remaining user has a person in
      const { person: only1 } = await ctx.newPerson({ ownerId: user1.id });

      const { asset: asset2 } = await ctx.newAsset({ ownerId: user2.id });
      const { assetFace: sharedFace2 } = await ctx.newAssetFace({
        assetId: asset2.id,
        personGroupId: shared1.personGroupId,
      });
      const { asset: asset1 } = await ctx.newAsset({ ownerId: user1.id });
      const { assetFace: sharedFace1 } = await ctx.newAssetFace({
        assetId: asset1.id,
        personGroupId: shared1.personGroupId,
      });

      await sut.leave(factory.auth({ user: user2 }), clusterGroupId);

      const newClusterGroupId = await getClusterGroupId(ctx, user2.id);
      expect(newClusterGroupId).not.toBe(clusterGroupId);

      // the shared group is recreated for the leaving user, the one only they had comes along as it is
      const leaverPeople = await getPeople(ctx, user2.id);
      const movedShared = leaverPeople.find(({ personGroupId }) => personGroupId !== only2.personGroupId);
      expect(movedShared).toBeDefined();
      expect(movedShared!.personGroupId).not.toBe(shared1.personGroupId);
      await expect(personRepo.getByGroupId(only2)).resolves.toBeDefined();

      // the remaining user is untouched
      await expect(personRepo.getByGroupId(shared1)).resolves.toBeDefined();
      await expect(personRepo.getByGroupId(only1)).resolves.toBeDefined();

      const groups = await ctx.database
        .selectFrom('person_group')
        .select(['person_group.id', 'person_group.clusterGroupId'])
        .execute();
      expect(groups).toEqual(
        expect.arrayContaining([
          { id: shared1.personGroupId, clusterGroupId },
          { id: only1.personGroupId, clusterGroupId },
          { id: only2.personGroupId, clusterGroupId: newClusterGroupId },
          { id: movedShared!.personGroupId, clusterGroupId: newClusterGroupId },
        ]),
      );

      // only the faces on the assets of the leaving user follow the recreated group
      const faces = await ctx.database
        .selectFrom('asset_face')
        .select(['asset_face.id', 'asset_face.personGroupId'])
        .where('asset_face.id', 'in', [sharedFace1.id, sharedFace2.id])
        .execute();
      expect(faces).toEqual(
        expect.arrayContaining([
          { id: sharedFace1.id, personGroupId: shared1.personGroupId },
          { id: sharedFace2.id, personGroupId: movedShared!.personGroupId },
        ]),
      );
    });

    it('should give each shared group its own new group when a user leaves the group', async () => {
      const { sut, ctx } = setup(await getKyselyDB());
      const { user: user1 } = await ctx.newUser();
      const { user: user2 } = await ctx.newUser();
      const clusterGroupId = await getClusterGroupId(ctx, user1.id);

      const { value: request } = await sut.createRequest(factory.auth({ user: user1 }), clusterGroupId, {
        userId: user2.id,
      });
      await sut.acceptRequest(factory.auth({ user: user2 }), request.id);

      // two groups both users have a person in
      const { person: sharedA } = await ctx.newPerson({ ownerId: user1.id });
      const { person: sharedB } = await ctx.newPerson({ ownerId: user1.id });
      await ctx.newPerson({ ownerId: user2.id, personGroupId: sharedA.personGroupId, name: 'Alice' });
      await ctx.newPerson({ ownerId: user2.id, personGroupId: sharedB.personGroupId, name: 'Bob' });

      const { asset } = await ctx.newAsset({ ownerId: user2.id });
      const { assetFace: faceA } = await ctx.newAssetFace({ assetId: asset.id, personGroupId: sharedA.personGroupId });
      const { assetFace: faceB } = await ctx.newAssetFace({ assetId: asset.id, personGroupId: sharedB.personGroupId });

      await sut.leave(factory.auth({ user: user2 }), clusterGroupId);

      const moved = await getPeople(ctx, user2.id);
      const movedGroupIds = moved.map(({ personGroupId }) => personGroupId);
      expect(movedGroupIds).toHaveLength(2);
      expect(movedGroupIds).not.toContain(sharedA.personGroupId);
      expect(movedGroupIds).not.toContain(sharedB.personGroupId);
      expect(new Set(movedGroupIds).size).toBe(2);

      // the group id changes on the way out, so the name is what identifies each person
      const movedA = moved.find(({ name }) => name === 'Alice');
      const movedB = moved.find(({ name }) => name === 'Bob');

      const faces = await ctx.database
        .selectFrom('asset_face')
        .select(['asset_face.id', 'asset_face.personGroupId'])
        .where('asset_face.id', 'in', [faceA.id, faceB.id])
        .execute();
      expect(faces).toEqual(
        expect.arrayContaining([
          { id: faceA.id, personGroupId: movedA!.personGroupId },
          { id: faceB.id, personGroupId: movedB!.personGroupId },
        ]),
      );
    });
  });

  describe('deleteRequest', () => {
    it('should let the user it was created for decline it', async () => {
      const { sut, ctx } = setup();
      const { user: owner } = await ctx.newUser();
      const { user: invitee } = await ctx.newUser();
      const clusterGroupId = await getClusterGroupId(ctx, owner.id);
      const inviteeClusterGroupId = await getClusterGroupId(ctx, invitee.id);

      const { value: request } = await sut.createRequest(factory.auth({ user: owner }), clusterGroupId, {
        userId: invitee.id,
      });
      await sut.deleteRequest(factory.auth({ user: invitee }), request.id);

      await expect(sut.getRequests(factory.auth({ user: invitee }))).resolves.toEqual([]);
      await expect(getClusterGroupId(ctx, invitee.id)).resolves.toBe(inviteeClusterGroupId);
    });

    it('should let the cluster group it was created by revoke it', async () => {
      const { sut, ctx } = setup();
      const { user: owner } = await ctx.newUser();
      const { user: invitee } = await ctx.newUser();
      const clusterGroupId = await getClusterGroupId(ctx, owner.id);

      const { value: request } = await sut.createRequest(factory.auth({ user: owner }), clusterGroupId, {
        userId: invitee.id,
      });
      await sut.deleteRequest(factory.auth({ user: owner }), request.id);

      await expect(sut.getRequests(factory.auth({ user: invitee }))).resolves.toEqual([]);
    });

    it('should not let an unrelated user delete it', async () => {
      const { sut, ctx } = setup();
      const { user: owner } = await ctx.newUser();
      const { user: invitee } = await ctx.newUser();
      const { user: other } = await ctx.newUser();
      const clusterGroupId = await getClusterGroupId(ctx, owner.id);

      const { value: request } = await sut.createRequest(factory.auth({ user: owner }), clusterGroupId, {
        userId: invitee.id,
      });

      await expect(sut.deleteRequest(factory.auth({ user: other }), request.id)).rejects.toThrow(
        'Not found or no clusterGroupRequest.delete access',
      );
      await expect(sut.getRequests(factory.auth({ user: invitee }))).resolves.toEqual([request]);
    });
  });
});
