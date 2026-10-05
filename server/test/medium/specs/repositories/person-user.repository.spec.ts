import { Kysely } from 'kysely';
import { DateTime } from 'luxon';
import { PersonUserRole } from 'src/dtos/person.dto.js';
import { SharingDirection } from 'src/enum.js';
import { LoggingRepository } from 'src/repositories/logging.repository.js';
import { PersonUserRepository } from 'src/repositories/person-user.repository.js';
import { PersonRepository } from 'src/repositories/person.repository.js';
import { person_delete_shares, person_user_after_insert } from 'src/schema/functions.js';
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
  return { ctx, sut: ctx.get(PersonUserRepository) };
};

const getPeopleByGroupId = (ctx: MediumTestContext, personGroupId: string) =>
  ctx.database
    .selectFrom('person')
    .selectAll()
    .where('personGroupId', '=', personGroupId)
    .orderBy('createdAt')
    .execute();

beforeAll(async () => {
  defaultDatabase = await getKyselyDB();
});

const newShares = async () => {
  const { ctx, sut } = setup();
  const [{ user: owner }, { user: reader }, { user: writer }, { user: stranger }] = [
    await ctx.newUser(),
    await ctx.newUser(),
    await ctx.newUser(),
    await ctx.newUser(),
  ];
  const { result: alice } = await ctx.newPerson({ ownerId: owner.id, name: 'Alice' });
  const { result: bob } = await ctx.newPerson({ ownerId: stranger.id, name: 'Bob' });

  await sut.createAll([
    {
      personGroupId: alice.personGroupId,
      sharedById: owner.id,
      sharedWithId: reader.id,
      role: PersonUserRole.Read,
    },
    {
      personGroupId: alice.personGroupId,
      sharedById: owner.id,
      sharedWithId: writer.id,
      role: PersonUserRole.Write,
    },
    {
      personGroupId: bob.personGroupId,
      sharedById: stranger.id,
      sharedWithId: owner.id,
      role: PersonUserRole.Admin,
    },
  ]);

  return { ctx, sut, owner, reader, writer, stranger, alice, bob };
};

describe(PersonUserRepository.name, () => {
  describe('createAll', () => {
    describe(person_user_after_insert.name, () => {
      it('should create automatically person for the user it was shared with', async () => {
        const { ctx, sut } = setup();
        const [{ user: owner }, { user: sharedWith }] = [await ctx.newUser(), await ctx.newUser()];
        const { result: person } = await ctx.newPerson({
          ownerId: owner.id,
          name: 'Alice',
          birthDate: DateTime.fromISO('1990-04-01').toJSDate(),
        });

        await sut.createAll([
          {
            personGroupId: person.personGroupId,
            sharedById: owner.id,
            sharedWithId: sharedWith.id,
            role: PersonUserRole.Read,
          },
        ]);

        const people = await getPeopleByGroupId(ctx, person.personGroupId);

        expect(people).toHaveLength(2);
        expect(people).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              ownerId: owner.id,
              personGroupId: person.personGroupId,
            }),
            expect.objectContaining({
              ownerId: sharedWith.id,
              personGroupId: person.personGroupId,
              name: person.name,
              birthDate: person.birthDate,
            }),
          ]),
        );
      });

      it('should create a person for each user in a bulk insert', async () => {
        const { ctx, sut } = setup();
        const [{ user: owner }, { user: sharedWith1 }, { user: sharedWith2 }] = [
          await ctx.newUser(),
          await ctx.newUser(),
          await ctx.newUser(),
        ];
        const { result: person } = await ctx.newPerson({ ownerId: owner.id, name: 'Alice' });

        await sut.createAll([
          {
            personGroupId: person.personGroupId,
            sharedById: owner.id,
            sharedWithId: sharedWith1.id,
            role: PersonUserRole.Read,
          },
          {
            personGroupId: person.personGroupId,
            sharedById: owner.id,
            sharedWithId: sharedWith2.id,
            role: PersonUserRole.Write,
          },
        ]);

        const people = await getPeopleByGroupId(ctx, person.personGroupId);

        expect(people).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              ownerId: owner.id,
              personGroupId: person.personGroupId,
            }),
            expect.objectContaining({
              ownerId: sharedWith1.id,
              personGroupId: person.personGroupId,
            }),
            expect.objectContaining({
              ownerId: sharedWith2.id,
              personGroupId: person.personGroupId,
            }),
          ]),
        );
      });

      it('should create one person when two owners share the same group with a user', async () => {
        const { ctx, sut } = setup();
        const [{ user: owner1 }, { user: owner2 }, { user: sharedWith }] = [
          await ctx.newUser(),
          await ctx.newUser(),
          await ctx.newUser(),
        ];
        const { result: person } = await ctx.newPerson({ ownerId: owner1.id, name: 'Alice' });
        await ctx
          .get(PersonRepository)
          .create({ ownerId: owner2.id, personGroupId: person.personGroupId, name: 'Alice (theirs)' });

        await sut.createAll([
          {
            personGroupId: person.personGroupId,
            sharedById: owner1.id,
            sharedWithId: sharedWith.id,
            role: PersonUserRole.Read,
          },
          {
            personGroupId: person.personGroupId,
            sharedById: owner2.id,
            sharedWithId: sharedWith.id,
            role: PersonUserRole.Read,
          },
        ]);

        const people = await getPeopleByGroupId(ctx, person.personGroupId);

        expect(people).toHaveLength(3);
        expect(people.filter(({ ownerId }) => ownerId === sharedWith.id)).toHaveLength(1);
      });

      it('should skip existing records', async () => {
        const { ctx, sut } = setup();
        const [{ user: owner }, { user: sharedWith }] = [await ctx.newUser(), await ctx.newUser()];
        const { result: person } = await ctx.newPerson({ ownerId: owner.id, name: 'Alice' });
        const existing = await ctx.get(PersonRepository).create({
          ownerId: sharedWith.id,
          personGroupId: person.personGroupId,
          name: 'Alice (mine)',
          isFavorite: true,
        });

        await sut.createAll([
          {
            personGroupId: person.personGroupId,
            sharedById: owner.id,
            sharedWithId: sharedWith.id,
            role: PersonUserRole.Read,
          },
        ]);

        const people = await getPeopleByGroupId(ctx, person.personGroupId);

        expect(people).toHaveLength(2);
        expect(people).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              ownerId: owner.id,
              personGroupId: person.personGroupId,
            }),
            expect.objectContaining({
              ownerId: sharedWith.id,
              personGroupId: person.personGroupId,
              name: 'Alice (mine)',
              isFavorite: true,
              // the updatedAt trigger rewrites updateId on any update, so an unchanged
              // updateId proves the row was skipped rather than overwritten
              updateId: existing.updateId,
            }),
          ]),
        );
      });

      it('should not create a person when only the role changes', async () => {
        const { ctx, sut } = setup();
        const [{ user: owner }, { user: sharedWith }] = [await ctx.newUser(), await ctx.newUser()];
        const { result: person } = await ctx.newPerson({ ownerId: owner.id, name: 'Alice' });
        const share = {
          personGroupId: person.personGroupId,
          sharedById: owner.id,
          sharedWithId: sharedWith.id,
          role: PersonUserRole.Read,
        };

        await sut.createAll([share]);
        const [, created] = await getPeopleByGroupId(ctx, person.personGroupId);

        await sut.createAll([{ ...share, role: PersonUserRole.Write }]);

        const people = await getPeopleByGroupId(ctx, person.personGroupId);

        expect(people).toHaveLength(2);
        expect(people).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              ownerId: sharedWith.id,
              personGroupId: person.personGroupId,
              updateId: created.updateId,
            }),
          ]),
        );
        await expect(sut.searchPeopleUsers(owner.id, {})).resolves.toEqual([
          expect.objectContaining({ sharedWithId: sharedWith.id, role: PersonUserRole.Write }),
        ]);
      });
    });
  });

  describe('searchPeopleUsers', () => {
    it('should return shares in both directions by default', async () => {
      const { sut, owner, reader, writer } = await newShares();

      const results = await sut.searchPeopleUsers(owner.id, {});

      expect(results).toHaveLength(3);
      expect(results).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ sharedWithId: reader.id, role: PersonUserRole.Read }),
          expect.objectContaining({ sharedWithId: writer.id, role: PersonUserRole.Write }),
          expect.objectContaining({ sharedWithId: owner.id, role: PersonUserRole.Admin }),
        ]),
      );
    });

    it('should filter by role', async () => {
      const { sut, owner, writer } = await newShares();

      await expect(sut.searchPeopleUsers(owner.id, { role: PersonUserRole.Write })).resolves.toEqual([
        expect.objectContaining({ sharedWithId: writer.id, role: PersonUserRole.Write }),
      ]);
    });

    it('should filter by sharedWithId', async () => {
      const { sut, owner, reader } = await newShares();

      await expect(sut.searchPeopleUsers(owner.id, { sharedWithId: reader.id })).resolves.toEqual([
        expect.objectContaining({ sharedWithId: reader.id, role: PersonUserRole.Read }),
      ]);
    });

    it('should filter by sharedById', async () => {
      const { sut, owner, stranger } = await newShares();

      await expect(sut.searchPeopleUsers(owner.id, { sharedById: stranger.id })).resolves.toEqual([
        expect.objectContaining({ sharedById: stranger.id, sharedWithId: owner.id }),
      ]);
    });

    it('should filter by personId', async () => {
      const { sut, owner, bob } = await newShares();

      await expect(sut.searchPeopleUsers(owner.id, { personId: bob.personGroupId })).resolves.toEqual([
        expect.objectContaining({ personId: bob.personGroupId, sharedWithId: owner.id }),
      ]);
    });

    it('should only return shares the owner created for the shared-by direction', async () => {
      const { sut, owner, reader, writer } = await newShares();

      const results = await sut.searchPeopleUsers(owner.id, { direction: SharingDirection.SharedBy });

      expect(results).toHaveLength(2);
      expect(results).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ sharedWithId: reader.id }),
          expect.objectContaining({ sharedWithId: writer.id }),
        ]),
      );
    });

    it('should only return shares pointed at the owner for the shared-with direction', async () => {
      const { sut, owner, stranger } = await newShares();

      await expect(sut.searchPeopleUsers(owner.id, { direction: SharingDirection.SharedWith })).resolves.toEqual([
        expect.objectContaining({ sharedById: stranger.id, sharedWithId: owner.id }),
      ]);
    });

    it('should combine role and direction filters', async () => {
      const { sut, owner } = await newShares();

      await expect(
        sut.searchPeopleUsers(owner.id, { direction: SharingDirection.SharedBy, role: PersonUserRole.Admin }),
      ).resolves.toEqual([]);
    });
  });
  describe(person_delete_shares.name, () => {
    it('should delete shares pointing at a user when their person is deleted', async () => {
      const { ctx, sut } = setup();
      const [{ user: owner }, { user: sharedWith }] = [await ctx.newUser(), await ctx.newUser()];
      const { result: person } = await ctx.newPerson({ ownerId: owner.id, name: 'Alice' });

      await sut.createAll([
        {
          personGroupId: person.personGroupId,
          sharedById: owner.id,
          sharedWithId: sharedWith.id,
          role: PersonUserRole.Read,
        },
      ]);
      await expect(sut.searchPeopleUsers(owner.id, {})).resolves.toHaveLength(1);

      // the recipient deletes their own copy, as PersonService.deleteAll does
      await ctx.get(PersonRepository).delete([person.personGroupId], sharedWith.id);

      await expect(sut.searchPeopleUsers(owner.id, {})).resolves.toEqual([]);
      expect(await getPeopleByGroupId(ctx, person.personGroupId)).toEqual([
        expect.objectContaining({ ownerId: owner.id }),
      ]);
    });

    it('should leave shares with other users intact', async () => {
      const { ctx, sut } = setup();
      const [{ user: owner }, { user: sharedWith1 }, { user: sharedWith2 }] = [
        await ctx.newUser(),
        await ctx.newUser(),
        await ctx.newUser(),
      ];
      const { result: person } = await ctx.newPerson({ ownerId: owner.id, name: 'Alice' });

      await sut.createAll([
        {
          personGroupId: person.personGroupId,
          sharedById: owner.id,
          sharedWithId: sharedWith1.id,
          role: PersonUserRole.Read,
        },
        {
          personGroupId: person.personGroupId,
          sharedById: owner.id,
          sharedWithId: sharedWith2.id,
          role: PersonUserRole.Read,
        },
      ]);

      await ctx.get(PersonRepository).delete([person.personGroupId], sharedWith1.id);

      await expect(sut.searchPeopleUsers(owner.id, {})).resolves.toEqual([
        expect.objectContaining({ sharedWithId: sharedWith2.id }),
      ]);
    });
  });
});
