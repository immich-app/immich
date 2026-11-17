import { Kysely } from 'kysely';
import { PersonUserRole } from 'src/dtos/person.dto.js';
import { AssetFileType, AssetVisibility, UserMetadataKey } from 'src/enum.js';
import { LoggingRepository } from 'src/repositories/logging.repository.js';
import { PersonUserRepository } from 'src/repositories/person-user.repository.js';
import { PersonRepository, type PersonSearchOptions } from 'src/repositories/person.repository.js';
import { DB } from 'src/schema/index.js';
import { BaseService } from 'src/services/base.service.js';
import { MediumTestContext, newMediumService } from 'test/medium.factory.js';
import { getKyselyDB } from 'test/utils.js';

let defaultDatabase: Kysely<DB>;

const setup = (db?: Kysely<DB>) => {
  const { ctx } = newMediumService(BaseService, {
    database: db || defaultDatabase,
    real: [],
    mock: [LoggingRepository],
  });
  return { ctx, sut: ctx.get(PersonRepository) };
};

const listFor = async (sut: PersonRepository, userId: string, options?: Partial<PersonSearchOptions>) => {
  const { items } = await sut.getAllForUser({ take: 100, skip: 0 }, userId, {
    withHidden: false,
    partnerIds: [],
    ...options,
  });
  return items;
};

const countFor = async (sut: PersonRepository, userId: string, options?: Partial<PersonSearchOptions>) => {
  const { total, hidden } = await sut.getAllForUser({ take: 100, skip: 0 }, userId, {
    withHidden: false,
    partnerIds: [],
    ...options,
  });
  return { total, hidden };
};

// a named person with at least one visible face clears the minimum-faces rule
const newNamedPerson = async (ctx: MediumTestContext, ownerId: string, name: string) => {
  const { result: person } = await ctx.newPerson({ ownerId, name });
  const { asset } = await ctx.newAsset({ ownerId });
  await ctx.newAssetFace({ assetId: asset.id, personGroupId: person.personGroupId });
  return person;
};

const otherPeopleOf = async (
  sut: PersonRepository,
  ctx: MediumTestContext,
  userId: string,
  groupId: string,
  partnerIds: string[],
) => {
  const listItems = await listFor(sut, userId, { partnerIds });
  const listed = listItems.find((item) => item.personGroupId === groupId);
  const byGroupId = await sut.getByGroupId({ ownerId: userId, personGroupId: groupId });
  return {
    getAllForUser: listed?.otherPeople,
    getByGroupId: byGroupId?.otherPeople,
  };
};

beforeAll(async () => {
  defaultDatabase = await getKyselyDB();
});

describe(PersonRepository.name, () => {
  describe('createAll', () => {
    it('should create people in the groups they were given', async () => {
      const { ctx, sut } = setup();
      const [{ user: user1 }, { user: user2 }] = [await ctx.newUser(), await ctx.newUser()];

      const [group1, group2] = await sut.createGroups([
        { clusterGroupId: user1.clusterGroupId },
        { clusterGroupId: user1.clusterGroupId },
      ]);
      const group3 = await sut.createGroup(user2.id);

      const people = await sut.createAll([
        { ownerId: user1.id, name: 'Alice', personGroupId: group1.id },
        { ownerId: user1.id, name: 'Bob', personGroupId: group2.id },
        { ownerId: user2.id, name: 'Carol', personGroupId: group3.id },
      ]);

      expect(people.map(({ personGroupId }) => personGroupId)).toEqual([group1.id, group2.id, group3.id]);

      const groups = await ctx.database
        .selectFrom('person')
        .innerJoin('person_group', 'person_group.id', 'person.personGroupId')
        .innerJoin('user', 'user.id', 'person.ownerId')
        .select(['person.name', 'person_group.clusterGroupId', 'user.clusterGroupId as ownerClusterGroupId'])
        .where(
          'person.personGroupId',
          'in',
          people.map(({ personGroupId }) => personGroupId),
        )
        .execute();

      expect(groups).toHaveLength(3);
      for (const group of groups) {
        expect(group.clusterGroupId).toBe(group.ownerClusterGroupId);
      }
    });
  });

  describe('createGroup', () => {
    it('should create a group in the owner cluster group', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();

      const group = await sut.createGroup(user.id);

      const owner = await ctx.database
        .selectFrom('person_group')
        .innerJoin('user', 'user.clusterGroupId', 'person_group.clusterGroupId')
        .select('user.id')
        .where('person_group.id', '=', group.id)
        .executeTakeFirstOrThrow();

      expect(owner.id).toBe(user.id);
    });

    it('should put people created with the same group into that group', async () => {
      const { ctx, sut } = setup(await getKyselyDB());
      const [{ user: user1 }, { user: user2 }] = [await ctx.newUser(), await ctx.newUser()];

      const group = await sut.createGroup(user1.id);
      const person1 = await sut.create({ ownerId: user1.id, name: 'Alice', personGroupId: group.id });
      const person2 = await sut.create({ ownerId: user2.id, name: 'Alice', personGroupId: group.id });

      expect(person1.personGroupId).toBe(group.id);
      expect(person2.personGroupId).toBe(group.id);

      const groups = await ctx.database.selectFrom('person_group').select('person_group.id').execute();
      expect(groups.map(({ id }) => id)).toEqual([group.id]);
    });
  });

  describe('getByGroupId', () => {
    it('should not return a person owned by another user', async () => {
      const { ctx, sut } = setup();
      const [{ user: user1 }, { user: user2 }] = [await ctx.newUser(), await ctx.newUser()];
      const group = await sut.createGroup(user1.id);

      const person1 = await sut.create({ ownerId: user1.id, name: 'Alice', personGroupId: group.id });
      const person2 = await ctx.database
        .insertInto('person')
        .values({ ownerId: user2.id, name: 'Alice', personGroupId: person1.personGroupId })
        .returningAll()
        .executeTakeFirstOrThrow();

      await expect(sut.getByGroupId({ ownerId: user1.id, personGroupId: person1.personGroupId })).resolves.toEqual(
        expect.objectContaining({ personGroupId: person1.personGroupId, ownerId: user1.id }),
      );
      await expect(sut.getByGroupId({ ownerId: user2.id, personGroupId: person1.personGroupId })).resolves.toEqual(
        expect.objectContaining({ personGroupId: person2.personGroupId, ownerId: user2.id }),
      );
    });

    it('should return nothing when the group belongs to another user', async () => {
      const { ctx, sut } = setup();
      const [{ user: user1 }, { user: user2 }] = [await ctx.newUser(), await ctx.newUser()];
      const group = await sut.createGroup(user1.id);

      const person = await sut.create({ ownerId: user1.id, name: 'Alice', personGroupId: group.id });

      await expect(
        sut.getByGroupId({ ownerId: user2.id, personGroupId: person.personGroupId }),
      ).resolves.toBeUndefined();
    });
  });

  describe('otherPeople', () => {
    it('should report the person shared with the user from every lookup', async () => {
      const { ctx, sut } = setup();
      const [{ user: owner }, { user: recipient }] = [await ctx.newUser(), await ctx.newUser()];
      const person = await newNamedPerson(ctx, owner.id, 'Alice');

      await ctx.get(PersonUserRepository).createAll([
        {
          personGroupId: person.personGroupId,
          sharedById: owner.id,
          sharedWithId: recipient.id,
          role: PersonUserRole.Write,
        },
      ]);

      const expected = [{ sharedById: owner.id, role: PersonUserRole.Write, name: 'Alice', birthDate: null }];
      const results = await otherPeopleOf(sut, ctx, recipient.id, person.personGroupId, [owner.id]);

      expect(results.getAllForUser).toEqual(expected);
      expect(results.getByGroupId).toEqual(expected);
    });

    it('should not report a share pointed at a different user', async () => {
      const { ctx, sut } = setup();
      const [{ user: owner }, { user: first }, { user: second }] = [
        await ctx.newUser(),
        await ctx.newUser(),
        await ctx.newUser(),
      ];
      const person = await newNamedPerson(ctx, owner.id, 'Alice');

      await ctx.get(PersonUserRepository).createAll([
        {
          personGroupId: person.personGroupId,
          sharedById: owner.id,
          sharedWithId: first.id,
          role: PersonUserRole.Read,
        },
        {
          personGroupId: person.personGroupId,
          sharedById: owner.id,
          sharedWithId: second.id,
          role: PersonUserRole.Read,
        },
      ]);

      const expected = [{ sharedById: owner.id, role: PersonUserRole.Read, name: 'Alice', birthDate: null }];
      const results = await otherPeopleOf(sut, ctx, first.id, person.personGroupId, [owner.id]);

      expect(results.getAllForUser).toEqual(expected);
      expect(results.getByGroupId).toEqual(expected);
    });

    it('should be empty for a group the user was never shared into', async () => {
      const { ctx, sut } = setup();
      const [{ user: owner }, { user: other }] = [await ctx.newUser(), await ctx.newUser()];
      const person = await newNamedPerson(ctx, owner.id, 'Alice');

      await ctx.database
        .insertInto('person')
        .values({ ownerId: other.id, name: 'Alice', personGroupId: person.personGroupId })
        .execute();

      const results = await otherPeopleOf(sut, ctx, other.id, person.personGroupId, [owner.id]);

      expect(results.getByGroupId).toEqual([]);
    });
  });
  describe('deleteEmptyGroups', () => {
    it('should delete groups that no longer have any people', async () => {
      const { ctx, sut } = setup(await getKyselyDB());
      const { user } = await ctx.newUser();
      const [keptGroup, emptiedGroup] = await sut.createGroups([
        { clusterGroupId: user.clusterGroupId },
        { clusterGroupId: user.clusterGroupId },
      ]);

      const kept = await sut.create({ ownerId: user.id, name: 'Alice', personGroupId: keptGroup.id });
      const emptied = await sut.create({ ownerId: user.id, name: 'Bob', personGroupId: emptiedGroup.id });
      await ctx.database
        .deleteFrom('person')
        .where('person.ownerId', '=', emptied.ownerId)
        .where('person.personGroupId', '=', emptied.personGroupId)
        .execute();

      await expect(sut.deleteEmptyGroups()).resolves.toBe(1);

      const groups = await ctx.database.selectFrom('person_group').select('person_group.id').execute();
      expect(groups.map(({ id }) => id)).toEqual([kept.personGroupId]);
    });
  });

  describe('deleteOrphanedClusterGroups', () => {
    it('should delete cluster groups that no longer belong to a user, along with their people', async () => {
      const { ctx, sut } = setup(await getKyselyDB());
      const [{ user: kept }, { user: removed }] = [await ctx.newUser(), await ctx.newUser()];
      const keptGroup = await sut.createGroup(kept.id);
      const removedGroup = await sut.createGroup(removed.id);

      const keptPerson = await sut.create({ ownerId: kept.id, name: 'Alice', personGroupId: keptGroup.id });
      await sut.create({ ownerId: removed.id, name: 'Bob', personGroupId: removedGroup.id });
      const { clusterGroupId } = await ctx.database
        .selectFrom('user')
        .select('user.clusterGroupId')
        .where('user.id', '=', kept.id)
        .executeTakeFirstOrThrow();
      await ctx.database.deleteFrom('user').where('user.id', '=', removed.id).execute();

      await expect(sut.deleteOrphanedClusterGroups()).resolves.toBe(1);

      const clusterGroups = await ctx.database.selectFrom('cluster_group').select('cluster_group.id').execute();
      expect(clusterGroups.map(({ id }) => id)).toEqual([clusterGroupId]);

      const groups = await ctx.database.selectFrom('person_group').select('person_group.id').execute();
      expect(groups.map(({ id }) => id)).toEqual([keptPerson.personGroupId]);
    });
  });

  describe('getDataForThumbnailGenerationJob', () => {
    it('should not return the edited preview path', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();

      const { asset } = await ctx.newAsset({ ownerId: user.id });
      const { person } = await ctx.newPerson({ ownerId: user.id });

      const { assetFace } = await ctx.newAssetFace({
        assetId: asset.id,
        personGroupId: person.personGroupId,
        boundingBoxX1: 10,
        boundingBoxY1: 10,
        boundingBoxX2: 90,
        boundingBoxY2: 90,
      });

      // there's a circular dependency between assetFace and person, so we need to update the person after creating the assetFace
      await ctx.database
        .updateTable('person')
        .set({ faceAssetId: assetFace.id })
        .where('ownerId', '=', person.ownerId)
        .where('personGroupId', '=', person.personGroupId)
        .execute();

      await ctx.newAssetFile({
        assetId: asset.id,
        type: AssetFileType.Preview,
        path: 'preview_edited.jpg',
        isEdited: true,
      });
      await ctx.newAssetFile({
        assetId: asset.id,
        type: AssetFileType.Preview,
        path: 'preview_unedited.jpg',
        isEdited: false,
      });

      const result = await sut.getDataForThumbnailGenerationJob({
        ownerId: person.ownerId,
        personGroupId: person.personGroupId,
      });

      expect(result).toEqual(
        expect.objectContaining({
          previewPath: 'preview_unedited.jpg',
        }),
      );
    });
  });

  describe('forBirthdayMemories', () => {
    const target = { year: 2025, month: 6, day: 13 };

    it('should return people with a birthday on the given day', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();
      const { person } = await ctx.newPerson({ ownerId: user.id, name: 'Alice', birthDate: '1990-06-13' });
      await ctx.newPerson({ ownerId: user.id, name: 'Bob', birthDate: '1990-06-14' });

      const people = await sut.forBirthdayMemories(user.id, target);

      expect(people).toEqual([
        { personGroupId: person.personGroupId, name: 'Alice', birthDate: { year: 1990, month: 6, day: 13 } },
      ]);
    });

    it('should not return hidden people, unnamed people, or people without a birth date', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();
      await ctx.newPerson({ ownerId: user.id, name: 'Alice', birthDate: '1990-06-13', isHidden: true });
      await ctx.newPerson({ ownerId: user.id, name: '', birthDate: '1990-06-13' });
      await ctx.newPerson({ ownerId: user.id, name: 'Carol', birthDate: null });

      const people = await sut.forBirthdayMemories(user.id, target);

      expect(people).toEqual([]);
    });

    it('should not return people belonging to another user', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();
      const { user: otherUser } = await ctx.newUser();
      await ctx.newPerson({ ownerId: otherUser.id, name: 'Alice', birthDate: '1990-06-13' });

      const people = await sut.forBirthdayMemories(user.id, target);

      expect(people).toEqual([]);
    });

    it('should not return people born in the target year', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();
      await ctx.newPerson({ ownerId: user.id, name: 'Alice', birthDate: '2025-06-13' });

      const people = await sut.forBirthdayMemories(user.id, target);

      expect(people).toEqual([]);
    });

    it('should include leap-day birthdays on february 28th of non-leap years', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();
      const { person } = await ctx.newPerson({ ownerId: user.id, name: 'Alice', birthDate: '1992-02-29' });

      const people = await sut.forBirthdayMemories(user.id, { year: 2025, month: 2, day: 28 });

      expect(people.map(({ personGroupId }) => personGroupId)).toEqual([person.personGroupId]);
    });

    it('should include people born on february 28th on february 28th of non-leap years', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();
      const { person } = await ctx.newPerson({ ownerId: user.id, name: 'Alice', birthDate: '1991-02-28' });

      const people = await sut.forBirthdayMemories(user.id, { year: 2025, month: 2, day: 28 });

      expect(people.map(({ personGroupId }) => personGroupId)).toEqual([person.personGroupId]);
    });

    it('should not include leap-day birthdays on february 28th of leap years', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();
      await ctx.newPerson({ ownerId: user.id, name: 'Alice', birthDate: '1992-02-29' });

      const people = await sut.forBirthdayMemories(user.id, { year: 2024, month: 2, day: 28 });

      expect(people).toEqual([]);
    });

    it('should include leap-day birthdays on february 29th of leap years', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();
      const { person } = await ctx.newPerson({ ownerId: user.id, name: 'Alice', birthDate: '1992-02-29' });

      const people = await sut.forBirthdayMemories(user.id, { year: 2024, month: 2, day: 29 });

      expect(people.map(({ personGroupId }) => personGroupId)).toEqual([person.personGroupId]);
    });
  });

  describe('getForFeatureFaceUpdate', () => {
    it('should ignore soft deleted faces', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();
      const { asset } = await ctx.newAsset({ ownerId: user.id });
      const { person } = await ctx.newPerson({ ownerId: user.id });
      await ctx.newAssetFace({ assetId: asset.id, deletedAt: new Date(), personGroupId: person.personGroupId });

      await expect(
        sut.getForFeatureFaceUpdate({ personGroupId: person.personGroupId, assetId: asset.id }),
      ).resolves.toEqual(undefined);
    });
  });

  describe('getAllForUser', () => {
    it('should return the user own people', async () => {
      const { ctx, sut } = setup(await getKyselyDB());
      const { user } = await ctx.newUser();
      const person = await newNamedPerson(ctx, user.id, 'Alice');

      await expect(listFor(sut, user.id)).resolves.toEqual([
        expect.objectContaining({ ownerId: user.id, personGroupId: person.personGroupId, name: 'Alice' }),
      ]);
    });

    it('should not return people belonging to another user', async () => {
      const { ctx, sut } = setup(await getKyselyDB());
      const [{ user: user1 }, { user: user2 }] = [await ctx.newUser(), await ctx.newUser()];
      await newNamedPerson(ctx, user1.id, 'Alice');

      await expect(listFor(sut, user2.id)).resolves.toEqual([]);
    });

    it('should return a person shared with the user', async () => {
      const { ctx, sut } = setup(await getKyselyDB());
      const [{ user: owner }, { user: sharedWith }] = [await ctx.newUser(), await ctx.newUser()];
      const person = await newNamedPerson(ctx, owner.id, 'Alice');

      await ctx.get(PersonUserRepository).createAll([
        {
          personGroupId: person.personGroupId,
          sharedById: owner.id,
          sharedWithId: sharedWith.id,
          role: PersonUserRole.Read,
        },
      ]);

      await expect(listFor(sut, sharedWith.id, { partnerIds: [owner.id] })).resolves.toEqual([
        expect.objectContaining({
          ownerId: sharedWith.id,
          personGroupId: person.personGroupId,
          // the trigger seeds the name from the sharer
          name: 'Alice',
          otherPeople: [expect.objectContaining({ sharedById: owner.id, name: 'Alice' })],
        }),
      ]);
    });

    it('should not return a shared person without any visible faces', async () => {
      const { ctx, sut } = setup(await getKyselyDB());
      const [{ user: owner }, { user: sharedWith }] = [await ctx.newUser(), await ctx.newUser()];
      const { result: person } = await ctx.newPerson({ ownerId: owner.id, name: 'Alice' });

      await ctx.get(PersonUserRepository).createAll([
        {
          personGroupId: person.personGroupId,
          sharedById: owner.id,
          sharedWithId: sharedWith.id,
          role: PersonUserRole.Read,
        },
      ]);

      await expect(listFor(sut, sharedWith.id, { partnerIds: [owner.id] })).resolves.toEqual([]);
    });

    it('should not return a shared person whose faces are only on assets the user cannot see', async () => {
      const { ctx, sut } = setup(await getKyselyDB());
      const [{ user: owner }, { user: sharedWith }] = [await ctx.newUser(), await ctx.newUser()];
      const person = await newNamedPerson(ctx, owner.id, 'Alice');

      await ctx.get(PersonUserRepository).createAll([
        {
          personGroupId: person.personGroupId,
          sharedById: owner.id,
          sharedWithId: sharedWith.id,
          role: PersonUserRole.Read,
        },
      ]);

      await expect(listFor(sut, sharedWith.id)).resolves.toEqual([]);
    });

    it('should count faces on partner assets', async () => {
      const { ctx, sut } = setup(await getKyselyDB());
      const [{ user: owner }, { user: partner }] = [await ctx.newUser(), await ctx.newUser()];
      const { result: person } = await ctx.newPerson({ ownerId: owner.id, name: '' });
      for (let i = 0; i < 3; i++) {
        const { asset } = await ctx.newAsset({ ownerId: partner.id });
        await ctx.newAssetFace({ assetId: asset.id, personGroupId: person.personGroupId });
      }

      await expect(listFor(sut, owner.id)).resolves.toEqual([]);
      await expect(listFor(sut, owner.id, { partnerIds: [partner.id] })).resolves.toEqual([
        expect.objectContaining({ ownerId: owner.id, personGroupId: person.personGroupId }),
      ]);
    });

    it('should count people with the same rules as the list', async () => {
      const { ctx, sut } = setup(await getKyselyDB());
      const [{ user: owner }, { user: partner }] = [await ctx.newUser(), await ctx.newUser()];
      const named = await newNamedPerson(ctx, owner.id, 'Alice');
      await ctx.database
        .updateTable('person')
        .set({ isHidden: true })
        .where('personGroupId', '=', named.personGroupId)
        .execute();
      await ctx.newPerson({ ownerId: owner.id, name: '' });
      const { result: onPartnerAssets } = await ctx.newPerson({ ownerId: owner.id, name: '' });
      for (let i = 0; i < 3; i++) {
        const { asset } = await ctx.newAsset({ ownerId: partner.id });
        await ctx.newAssetFace({ assetId: asset.id, personGroupId: onPartnerAssets.personGroupId });
      }

      await expect(countFor(sut, owner.id)).resolves.toEqual({ total: 1, hidden: 1 });
      await expect(countFor(sut, owner.id, { partnerIds: [partner.id] })).resolves.toEqual({ total: 2, hidden: 1 });
    });

    it('should count everyone who matches the filters, hidden people included', async () => {
      const { ctx, sut } = setup(await getKyselyDB());
      const { user } = await ctx.newUser();
      await newNamedPerson(ctx, user.id, 'Alice');
      await newNamedPerson(ctx, user.id, 'Bob');
      const hidden = await newNamedPerson(ctx, user.id, 'Carol');
      await ctx.database
        .updateTable('person')
        .set({ isHidden: true })
        .where('personGroupId', '=', hidden.personGroupId)
        .execute();

      await expect(listFor(sut, user.id)).resolves.toHaveLength(2);
      await expect(countFor(sut, user.id)).resolves.toEqual({ total: 3, hidden: 1 });
      await expect(countFor(sut, user.id, { name: 'alice' })).resolves.toEqual({ total: 1, hidden: 0 });
      // an empty page still has the counts
      await expect(countFor(sut, user.id, { isFavorite: true })).resolves.toEqual({ total: 0, hidden: 0 });
      const { items, total } = await sut.getAllForUser({ take: 10, skip: 10 }, user.id, {
        withHidden: false,
        partnerIds: [],
      });
      expect({ items, total }).toEqual({ items: [], total: 3 });
    });

    it('should page through people who tie on every other sort key in a stable order', async () => {
      const { ctx, sut } = setup(await getKyselyDB());
      const { user } = await ctx.newUser();
      const ids: string[] = [];
      for (let i = 0; i < 6; i++) {
        const person = await newNamedPerson(ctx, user.id, 'Twin');
        ids.push(person.personGroupId);
      }
      await ctx.database
        .updateTable('person')
        .set({ createdAt: new Date('2024-01-01') })
        .where('ownerId', '=', user.id)
        .execute();

      const pages = [];
      for (let skip = 0; skip < 6; skip += 2) {
        const { items } = await sut.getAllForUser({ take: 2, skip }, user.id, { withHidden: false, partnerIds: [] });
        pages.push(...items.map(({ personGroupId }) => personGroupId));
      }
      expect(pages).toEqual(ids.toSorted());
    });

    it('should order people by similarity to the closest person', async () => {
      const { ctx, sut } = setup(await getKyselyDB());
      const { user } = await ctx.newUser();
      // alphabetical order is the reverse of the order by similarity to Zed
      const axes = { Zed: [1, 0], Mid: [1, 1], Abe: [0, 1] };
      const people: Record<string, string> = {};
      for (const [name, [x, y]] of Object.entries(axes)) {
        const { result: person } = await ctx.newPerson({ ownerId: user.id, name });
        const { asset } = await ctx.newAsset({ ownerId: user.id });
        const { assetFace } = await ctx.newAssetFace({ assetId: asset.id, personGroupId: person.personGroupId });
        const embedding = `[${[x, y, ...Array.from({ length: 510 }, () => 0)]}]`;
        await ctx.database.insertInto('face_search').values({ faceId: assetFace.id, embedding }).execute();
        await ctx.database
          .updateTable('person')
          .set({ faceAssetId: assetFace.id })
          .where('personGroupId', '=', person.personGroupId)
          .execute();
        people[name] = person.personGroupId;
      }
      const { result: faceless } = await ctx.newPerson({ ownerId: user.id, name: 'Faceless' });
      const closestTo = async (closestPersonId: string) => {
        const { items } = await sut.getAllForUser({ take: 10, skip: 0 }, user.id, {
          withHidden: false,
          partnerIds: [],
          closestPersonId,
        });
        return items.map(({ name }) => name);
      };

      await expect(listFor(sut, user.id)).resolves.toEqual(
        ['Abe', 'Mid', 'Zed'].map((name) => expect.objectContaining({ name })),
      );
      await expect(closestTo(people.Zed)).resolves.toEqual(['Zed', 'Mid', 'Abe']);
      // a person without a face has nothing to compare against, so the default order applies
      await expect(closestTo(faceless.personGroupId)).resolves.toEqual(['Abe', 'Mid', 'Zed']);
    });

    it('should match names with a word similarity of at least 0.5', async () => {
      const { ctx, sut } = setup(await getKyselyDB());
      const { user } = await ctx.newUser();
      const person = await newNamedPerson(ctx, user.id, 'Alison');
      // 'alisty' is 0.57 similar to 'Alison', below the default threshold of 0.6
      const match = [expect.objectContaining({ personGroupId: person.personGroupId })];

      await expect(listFor(sut, user.id, { name: 'alisty' })).resolves.toEqual(match);
      await expect(sut.getByName(user.id, 'alisty', { withHidden: true })).resolves.toEqual(match);
    });

    it('should stop counting faces on an asset while it is archived or trashed', async () => {
      const { ctx, sut } = setup(await getKyselyDB());
      const { user } = await ctx.newUser();
      const { result: person } = await ctx.newPerson({ ownerId: user.id, name: 'Alice' });
      const { asset } = await ctx.newAsset({ ownerId: user.id });
      await ctx.newAssetFace({ assetId: asset.id, personGroupId: person.personGroupId });
      const { asset: archived } = await ctx.newAsset({ ownerId: user.id, visibility: AssetVisibility.Archive });
      await ctx.newAssetFace({ assetId: archived.id, personGroupId: person.personGroupId });
      const updateAsset = (values: { visibility?: AssetVisibility; deletedAt?: Date | null }) =>
        ctx.database.updateTable('asset').set(values).where('id', '=', asset.id).execute();
      const statistics = () => sut.getStatistics(person.personGroupId, { ownerId: user.id, partnerIds: [] });

      await expect(statistics()).resolves.toEqual({ assets: 1 });

      await updateAsset({ visibility: AssetVisibility.Archive });
      await expect(listFor(sut, user.id)).resolves.toEqual([]);
      await expect(statistics()).resolves.toEqual({ assets: 0 });

      await updateAsset({ visibility: AssetVisibility.Timeline, deletedAt: new Date() });
      await expect(listFor(sut, user.id)).resolves.toEqual([]);

      await updateAsset({ deletedAt: null });
      await expect(listFor(sut, user.id)).resolves.toEqual([
        expect.objectContaining({ personGroupId: person.personGroupId }),
      ]);
      await expect(statistics()).resolves.toEqual({ assets: 1 });
    });

    it("should count a partner's face once when it is also in an album shared with the user", async () => {
      const { ctx, sut } = setup(await getKyselyDB());
      const [{ user }, { user: partner }] = [await ctx.newUser(), await ctx.newUser()];
      const person = await newNamedPerson(ctx, user.id, 'Alice');
      const { asset } = await ctx.newAsset({ ownerId: partner.id });
      await ctx.newAssetFace({ assetId: asset.id, personGroupId: person.personGroupId });
      const { album } = await ctx.newAlbum({ ownerId: partner.id }, [asset.id]);
      await ctx.newAlbumUser({ albumId: album.id, userId: user.id });

      await expect(listFor(sut, user.id, { partnerIds: [partner.id] })).resolves.toEqual([
        expect.objectContaining({ personGroupId: person.personGroupId, faceCount: 2 }),
      ]);
    });

    it("should count a face once, and faces on other users' assets only in albums shared with the user", async () => {
      const { ctx, sut } = setup(await getKyselyDB());
      const [{ user }, { user: other }] = [await ctx.newUser(), await ctx.newUser()];
      const { result: person } = await ctx.newPerson({ ownerId: user.id, name: '' });
      const ownAssetIds: string[] = [];
      for (let i = 0; i < 2; i++) {
        const { asset } = await ctx.newAsset({ ownerId: user.id });
        await ctx.newAssetFace({ assetId: asset.id, personGroupId: person.personGroupId });
        ownAssetIds.push(asset.id);
      }
      await ctx.newAlbum({ ownerId: user.id }, ownAssetIds);
      const { asset } = await ctx.newAsset({ ownerId: other.id });
      await ctx.newAssetFace({ assetId: asset.id, personGroupId: person.personGroupId });
      const { album } = await ctx.newAlbum({ ownerId: other.id }, [asset.id]);

      // two faces are below the minimum of three, even though their assets are also in the user's album
      await expect(listFor(sut, user.id)).resolves.toEqual([]);

      await ctx.newAlbumUser({ albumId: album.id, userId: user.id });
      await expect(listFor(sut, user.id)).resolves.toEqual([
        expect.objectContaining({ personGroupId: person.personGroupId }),
      ]);
      await expect(sut.getStatistics(person.personGroupId, { ownerId: user.id, partnerIds: [] })).resolves.toEqual({
        assets: 3,
      });
    });

    it('should require unnamed people to meet the minimum face count', async () => {
      const { ctx, sut } = setup(await getKyselyDB());
      const { user } = await ctx.newUser();
      const { result: person } = await ctx.newPerson({ ownerId: user.id, name: '' });
      const { asset } = await ctx.newAsset({ ownerId: user.id });
      await ctx.newAssetFace({ assetId: asset.id, personGroupId: person.personGroupId });

      await expect(listFor(sut, user.id)).resolves.toEqual([]);
    });

    it("should use the user's minimum face count", async () => {
      const { ctx, sut } = setup(await getKyselyDB());
      const { user } = await ctx.newUser();
      const { result: person } = await ctx.newPerson({ ownerId: user.id, name: '' });
      for (let i = 0; i < 2; i++) {
        const { asset } = await ctx.newAsset({ ownerId: user.id });
        await ctx.newAssetFace({ assetId: asset.id, personGroupId: person.personGroupId });
      }

      await expect(listFor(sut, user.id)).resolves.toEqual([]);
      await ctx.database
        .insertInto('user_metadata')
        .values({ userId: user.id, key: UserMetadataKey.Preferences, value: { people: { minimumFaces: 2 } } })
        .execute();
      await expect(listFor(sut, user.id)).resolves.toEqual([
        expect.objectContaining({ personGroupId: person.personGroupId, faceCount: 2 }),
      ]);
    });

    it('should stop returning a shared person once the user deletes their copy', async () => {
      const { ctx, sut } = setup(await getKyselyDB());
      const [{ user: owner }, { user: sharedWith }] = [await ctx.newUser(), await ctx.newUser()];
      const person = await newNamedPerson(ctx, owner.id, 'Alice');

      await ctx.get(PersonUserRepository).createAll([
        {
          personGroupId: person.personGroupId,
          sharedById: owner.id,
          sharedWithId: sharedWith.id,
          role: PersonUserRole.Read,
        },
      ]);
      await expect(listFor(sut, sharedWith.id, { partnerIds: [owner.id] })).resolves.toHaveLength(1);

      await sut.delete([person.personGroupId], sharedWith.id);

      await expect(listFor(sut, sharedWith.id, { partnerIds: [owner.id] })).resolves.toEqual([]);
      // the owner still has theirs
      await expect(listFor(sut, owner.id)).resolves.toHaveLength(1);
    });

    it('should exclude hidden people unless asked for them', async () => {
      const { ctx, sut } = setup(await getKyselyDB());
      const { user } = await ctx.newUser();
      const visible = await newNamedPerson(ctx, user.id, 'Alice');
      const hidden = await newNamedPerson(ctx, user.id, 'Bob');
      await ctx.database
        .updateTable('person')
        .set({ isHidden: true })
        .where('personGroupId', '=', hidden.personGroupId)
        .execute();

      await expect(listFor(sut, user.id)).resolves.toEqual([
        expect.objectContaining({ personGroupId: visible.personGroupId }),
      ]);
      await expect(listFor(sut, user.id, { withHidden: true })).resolves.toHaveLength(2);
    });
  });
});
