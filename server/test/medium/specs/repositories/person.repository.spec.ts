import { Kysely } from 'kysely';
import { AssetFileType } from 'src/enum';
import { LoggingRepository } from 'src/repositories/logging.repository';
import { PersonRepository } from 'src/repositories/person.repository';
import { DB } from 'src/schema';
import { BaseService } from 'src/services/base.service';
import { newMediumService } from 'test/medium.factory';
import { getKyselyDB } from 'test/utils';

let defaultDatabase: Kysely<DB>;

const setup = (db?: Kysely<DB>) => {
  const { ctx } = newMediumService(BaseService, {
    database: db || defaultDatabase,
    real: [],
    mock: [LoggingRepository],
  });
  return { ctx, sut: ctx.get(PersonRepository) };
};

beforeAll(async () => {
  defaultDatabase = await getKyselyDB();
});

describe(PersonRepository.name, () => {
  describe('getDataForThumbnailGenerationJob', () => {
    it('should not return the edited preview path', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();

      const { asset } = await ctx.newAsset({ ownerId: user.id });
      const { person } = await ctx.newPerson({ ownerId: user.id });

      const { assetFace } = await ctx.newAssetFace({
        assetId: asset.id,
        personId: person.id,
        boundingBoxX1: 10,
        boundingBoxY1: 10,
        boundingBoxX2: 90,
        boundingBoxY2: 90,
      });

      // there's a circular dependency between assetFace and person, so we need to update the person after creating the assetFace
      await ctx.database.updateTable('person').set({ faceAssetId: assetFace.id }).where('id', '=', person.id).execute();

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

      const result = await sut.getDataForThumbnailGenerationJob(person.id);

      expect(result).toEqual(
        expect.objectContaining({
          previewPath: 'preview_unedited.jpg',
        }),
      );
    });
  });

  describe('getPeopleWithBirthday', () => {
    const target = { year: 2025, month: 6, day: 13 };

    it('should return people with a birthday on the given day', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();
      const { person } = await ctx.newPerson({ ownerId: user.id, name: 'Alice', birthDate: '1990-06-13' });
      await ctx.newPerson({ ownerId: user.id, name: 'Bob', birthDate: '1990-06-14' });

      const people = await sut.getPeopleWithBirthday(user.id, target);

      expect(people).toEqual([{ id: person.id, name: 'Alice', birthYear: 1990, birthMonth: 6, birthDay: 13 }]);
    });

    it('should not return hidden people, unnamed people, or people without a birth date', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();
      await ctx.newPerson({ ownerId: user.id, name: 'Alice', birthDate: '1990-06-13', isHidden: true });
      await ctx.newPerson({ ownerId: user.id, name: '', birthDate: '1990-06-13' });
      await ctx.newPerson({ ownerId: user.id, name: 'Carol', birthDate: null });

      const people = await sut.getPeopleWithBirthday(user.id, target);

      expect(people).toEqual([]);
    });

    it('should not return people belonging to another user', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();
      const { user: otherUser } = await ctx.newUser();
      await ctx.newPerson({ ownerId: otherUser.id, name: 'Alice', birthDate: '1990-06-13' });

      const people = await sut.getPeopleWithBirthday(user.id, target);

      expect(people).toEqual([]);
    });

    it('should not return people born in the target year', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();
      await ctx.newPerson({ ownerId: user.id, name: 'Alice', birthDate: '2025-06-13' });

      const people = await sut.getPeopleWithBirthday(user.id, target);

      expect(people).toEqual([]);
    });

    it('should include leap-day birthdays on february 28th of non-leap years', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();
      const { person } = await ctx.newPerson({ ownerId: user.id, name: 'Alice', birthDate: '1992-02-29' });

      const people = await sut.getPeopleWithBirthday(user.id, { year: 2025, month: 2, day: 28 });

      expect(people.map(({ id }) => id)).toEqual([person.id]);
    });

    it('should not include leap-day birthdays on february 28th of leap years', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();
      await ctx.newPerson({ ownerId: user.id, name: 'Alice', birthDate: '1992-02-29' });

      const people = await sut.getPeopleWithBirthday(user.id, { year: 2024, month: 2, day: 28 });

      expect(people).toEqual([]);
    });

    it('should include leap-day birthdays on february 29th of leap years', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();
      const { person } = await ctx.newPerson({ ownerId: user.id, name: 'Alice', birthDate: '1992-02-29' });

      const people = await sut.getPeopleWithBirthday(user.id, { year: 2024, month: 2, day: 29 });

      expect(people.map(({ id }) => id)).toEqual([person.id]);
    });
  });
});
