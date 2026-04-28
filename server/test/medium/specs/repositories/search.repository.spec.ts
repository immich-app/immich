import { Kysely } from 'kysely';
import { AssetType } from 'src/enum';
import { AssetRepository } from 'src/repositories/asset.repository';
import { LoggingRepository } from 'src/repositories/logging.repository';
import { PersonRepository } from 'src/repositories/person.repository';
import { SearchRepository } from 'src/repositories/search.repository';
import { SharedSpaceRepository } from 'src/repositories/shared-space.repository';
import { TagRepository } from 'src/repositories/tag.repository';
import { DB } from 'src/schema';
import { BaseService } from 'src/services/base.service';
import { upsertTags } from 'src/utils/tag';
import { newMediumService } from 'test/medium.factory';
import { getKyselyDB } from 'test/utils';

let defaultDatabase: Kysely<DB>;

const matchingEmbedding = `[${Array.from({ length: 512 }, () => '0.01').join(',')}]`;
const farEmbedding = `[${Array.from({ length: 512 }, () => '-0.01').join(',')}]`;

const setup = (db?: Kysely<DB>) => {
  const { ctx } = newMediumService(BaseService, {
    database: db || defaultDatabase,
    real: [AssetRepository, SearchRepository, PersonRepository, SharedSpaceRepository, TagRepository],
    mock: [LoggingRepository],
  });
  return { ctx, sut: ctx.get(SearchRepository) };
};

const addEmbedding = async (db: Kysely<DB>, assetId: string, embedding = matchingEmbedding) => {
  await db.insertInto('smart_search').values({ assetId, embedding }).execute();
};

beforeAll(async () => {
  defaultDatabase = await getKyselyDB();
});

describe(SearchRepository.name, () => {
  describe('getSmartSearchFacets', () => {
    it('aggregates exact facets from all smart-search candidates and ignores nonmatching embeddings', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();
      const { user: otherUser } = await ctx.newUser();
      const { asset: january } = await ctx.newAsset({
        ownerId: user.id,
        fileCreatedAt: new Date('2024-01-15T10:00:00.000Z'),
        localDateTime: new Date('2024-01-15T10:00:00.000Z'),
      });
      const { asset: february } = await ctx.newAsset({
        ownerId: user.id,
        type: AssetType.Video,
        isFavorite: true,
        fileCreatedAt: new Date('2024-02-20T10:00:00.000Z'),
        localDateTime: new Date('2024-02-20T10:00:00.000Z'),
      });
      const { asset: farAway } = await ctx.newAsset({ ownerId: user.id });
      const { asset: inaccessible } = await ctx.newAsset({ ownerId: otherUser.id });

      await ctx.newExif({
        assetId: january.id,
        country: 'Germany',
        city: 'Berlin',
        make: 'Sony',
        model: 'A7',
        rating: 4,
      });
      await ctx.newExif({
        assetId: february.id,
        country: 'France',
        city: 'Paris',
        make: 'Canon',
        model: 'R5',
        rating: 5,
      });
      await ctx.newExif({
        assetId: farAway.id,
        country: 'Norway',
        city: 'Bergen',
        make: 'Nikon',
        model: 'Z8',
        rating: 5,
      });
      await ctx.newExif({
        assetId: inaccessible.id,
        country: 'Spain',
        city: 'Madrid',
        make: 'Leica',
        model: 'Q3',
        rating: 5,
      });
      await addEmbedding(ctx.database, january.id);
      await addEmbedding(ctx.database, february.id);
      await addEmbedding(ctx.database, farAway.id, farEmbedding);
      await addEmbedding(ctx.database, inaccessible.id);

      const [travel] = await upsertTags(ctx.get(TagRepository), { userId: user.id, tags: ['Travel'] });
      await ctx.newTagAsset({ tagIds: [travel.id], assetIds: [january.id, february.id] });

      const { person } = await ctx.newPerson({ ownerId: user.id, name: 'Ada' });
      await ctx.newAssetFace({ assetId: january.id, personId: person.id });

      const result = await sut.getSmartSearchFacets({
        embedding: matchingEmbedding,
        userIds: [user.id],
        maxDistance: 0.01,
      });

      expect(result.total).toBe(2);
      expect(result.timeBuckets).toEqual([
        { timeBucket: '2024-02-01', count: 1 },
        { timeBucket: '2024-01-01', count: 1 },
      ]);
      expect(result.countries).toEqual(['France', 'Germany']);
      expect(result.cities).toEqual(['Berlin', 'Paris']);
      expect(result.cameraMakes).toEqual(['Canon', 'Sony']);
      expect(result.cameraModels).toEqual(['A7', 'R5']);
      expect(result.tags).toEqual([{ id: travel.id, value: 'Travel' }]);
      expect(result.people).toEqual([{ id: person.id, name: 'Ada' }]);
      expect(result.ratings).toEqual([4, 5]);
      expect(result.mediaTypes).toEqual(['IMAGE', 'VIDEO']);
      expect(result.hasUnnamedPeople).toBe(false);
    });

    it('applies date filters to total while timeBuckets exclude the date filter group', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();
      const { asset: january } = await ctx.newAsset({
        ownerId: user.id,
        fileCreatedAt: new Date('2024-01-15T10:00:00.000Z'),
        localDateTime: new Date('2024-01-15T10:00:00.000Z'),
      });
      const { asset: february } = await ctx.newAsset({
        ownerId: user.id,
        fileCreatedAt: new Date('2024-02-20T10:00:00.000Z'),
        localDateTime: new Date('2024-02-20T10:00:00.000Z'),
      });
      await addEmbedding(ctx.database, january.id);
      await addEmbedding(ctx.database, february.id);

      const result = await sut.getSmartSearchFacets({
        embedding: matchingEmbedding,
        userIds: [user.id],
        maxDistance: 0.01,
        takenAfter: new Date('2024-02-01T00:00:00.000Z'),
        takenBefore: new Date('2024-03-01T00:00:00.000Z'),
      });

      expect(result.total).toBe(1);
      expect(result.timeBuckets).toEqual([
        { timeBucket: '2024-02-01', count: 1 },
        { timeBucket: '2024-01-01', count: 1 },
      ]);
    });

    it('uses localDateTime for smart facet time buckets to match timeline buckets', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();
      const { asset } = await ctx.newAsset({
        ownerId: user.id,
        fileCreatedAt: new Date('2024-03-01T00:30:00.000Z'),
        localDateTime: new Date('2024-02-29T23:30:00.000Z'),
      });
      await addEmbedding(ctx.database, asset.id);

      const result = await sut.getSmartSearchFacets({
        embedding: matchingEmbedding,
        userIds: [user.id],
        maxDistance: 0,
      });

      expect(result.timeBuckets).toEqual([{ timeBucket: '2024-02-01', count: 1 }]);
    });

    it('uses all embedded accessible assets when maxDistance is disabled', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();

      for (let index = 0; index < 125; index++) {
        const { asset } = await ctx.newAsset({ ownerId: user.id });
        await ctx.newExif({ assetId: asset.id, country: 'Germany' });
        await addEmbedding(ctx.database, asset.id, index % 2 === 0 ? matchingEmbedding : farEmbedding);
      }

      const result = await sut.getSmartSearchFacets({
        embedding: matchingEmbedding,
        userIds: [user.id],
        maxDistance: 0,
      });

      expect(result.total).toBe(125);
      expect(result.countries).toEqual(['Germany']);
    });

    it('treats rating null as an unrated filter and numeric rating as an inclusive minimum', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();
      const { asset: unrated } = await ctx.newAsset({ ownerId: user.id });
      const { asset: ratedThree } = await ctx.newAsset({ ownerId: user.id });
      const { asset: ratedFive } = await ctx.newAsset({ ownerId: user.id });
      await ctx.newExif({ assetId: unrated.id, rating: null });
      await ctx.newExif({ assetId: ratedThree.id, rating: 3 });
      await ctx.newExif({ assetId: ratedFive.id, rating: 5 });
      await addEmbedding(ctx.database, unrated.id);
      await addEmbedding(ctx.database, ratedThree.id);
      await addEmbedding(ctx.database, ratedFive.id);

      await expect(
        sut.getSmartSearchFacets({ embedding: matchingEmbedding, userIds: [user.id], maxDistance: 0, rating: null }),
      ).resolves.toMatchObject({ total: 1 });
      await expect(
        sut.getSmartSearchFacets({ embedding: matchingEmbedding, userIds: [user.id], maxDistance: 0, rating: 4 }),
      ).resolves.toMatchObject({ total: 1, ratings: [3, 5] });
    });

    it('applies null country filters to total and dependent city facets', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();
      const { asset: withoutCountry } = await ctx.newAsset({ ownerId: user.id });
      const { asset: withCountry } = await ctx.newAsset({ ownerId: user.id });
      await ctx.newExif({ assetId: withoutCountry.id, country: null, city: 'Unplaced' });
      await ctx.newExif({ assetId: withCountry.id, country: 'Germany', city: 'Berlin' });
      await addEmbedding(ctx.database, withoutCountry.id);
      await addEmbedding(ctx.database, withCountry.id);

      const result = await sut.getSmartSearchFacets({
        embedding: matchingEmbedding,
        userIds: [user.id],
        maxDistance: 0,
        country: null,
      });

      expect(result.total).toBe(1);
      expect(result.cities).toEqual(['Unplaced']);
    });

    it('applies tagIds null as an untagged filter outside the tag facet group', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();
      const { asset: untagged } = await ctx.newAsset({ ownerId: user.id });
      const { asset: tagged } = await ctx.newAsset({ ownerId: user.id });
      await ctx.newExif({ assetId: untagged.id, country: 'Germany' });
      await ctx.newExif({ assetId: tagged.id, country: 'France' });
      await addEmbedding(ctx.database, untagged.id);
      await addEmbedding(ctx.database, tagged.id);
      const [travel] = await upsertTags(ctx.get(TagRepository), { userId: user.id, tags: ['Travel'] });
      await ctx.newTagAsset({ tagIds: [travel.id], assetIds: [tagged.id] });

      const result = await sut.getSmartSearchFacets({
        embedding: matchingEmbedding,
        userIds: [user.id],
        maxDistance: 0,
        tagIds: null,
      });

      expect(result.total).toBe(1);
      expect(result.countries).toEqual(['Germany']);
      expect(result.tags).toEqual([{ id: travel.id, value: 'Travel' }]);
    });

    it('keeps country/city and make/model dependent facet semantics', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();
      const fixtures = [
        { country: 'Germany', city: 'Berlin', make: 'Sony', model: 'A7' },
        { country: 'Germany', city: 'Munich', make: 'Sony', model: 'A9' },
        { country: 'France', city: 'Paris', make: 'Canon', model: 'R5' },
      ];

      for (const fixture of fixtures) {
        const { asset } = await ctx.newAsset({ ownerId: user.id });
        await ctx.newExif({ assetId: asset.id, ...fixture });
        await addEmbedding(ctx.database, asset.id);
      }

      const locationResult = await sut.getSmartSearchFacets({
        embedding: matchingEmbedding,
        userIds: [user.id],
        maxDistance: 0,
        country: 'Germany',
        city: 'Berlin',
      });

      const cameraResult = await sut.getSmartSearchFacets({
        embedding: matchingEmbedding,
        userIds: [user.id],
        maxDistance: 0,
        make: 'Sony',
        model: 'A7',
      });

      expect(locationResult.total).toBe(1);
      expect(locationResult.countries).toEqual(['France', 'Germany']);
      expect(locationResult.cities).toEqual(['Berlin', 'Munich']);
      expect(cameraResult.total).toBe(1);
      expect(cameraResult.cameraMakes).toEqual(['Canon', 'Sony']);
      expect(cameraResult.cameraModels).toEqual(['A7', 'A9']);
    });

    it('returns empty facets and total 0 when no candidates match', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();

      const result = await sut.getSmartSearchFacets({
        embedding: matchingEmbedding,
        userIds: [user.id],
        maxDistance: 0.01,
      });

      expect(result).toEqual({
        total: 0,
        timeBuckets: [],
        countries: [],
        cities: [],
        cameraMakes: [],
        cameraModels: [],
        tags: [],
        people: [],
        ratings: [],
        mediaTypes: [],
        hasUnnamedPeople: false,
      });
    });

    it('excludes hidden and deleted asset faces from global people facets', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();
      const { asset: visibleAsset } = await ctx.newAsset({ ownerId: user.id });
      const { asset: hiddenFaceAsset } = await ctx.newAsset({ ownerId: user.id });
      const { asset: deletedFaceAsset } = await ctx.newAsset({ ownerId: user.id });
      const { asset: hiddenUnnamedAsset } = await ctx.newAsset({ ownerId: user.id });
      await addEmbedding(ctx.database, visibleAsset.id);
      await addEmbedding(ctx.database, hiddenFaceAsset.id);
      await addEmbedding(ctx.database, deletedFaceAsset.id);
      await addEmbedding(ctx.database, hiddenUnnamedAsset.id);

      const { person: visiblePerson } = await ctx.newPerson({ ownerId: user.id, name: 'Visible Ada' });
      const { person: hiddenFacePerson } = await ctx.newPerson({ ownerId: user.id, name: 'Hidden Face' });
      const { person: deletedFacePerson } = await ctx.newPerson({ ownerId: user.id, name: 'Deleted Face' });
      const { person: hiddenUnnamedPerson } = await ctx.newPerson({
        ownerId: user.id,
        name: 'Temporary',
        isHidden: true,
      });
      await ctx.database.updateTable('person').set({ name: '' }).where('id', '=', hiddenUnnamedPerson.id).execute();

      await ctx.newAssetFace({ assetId: visibleAsset.id, personId: visiblePerson.id });
      await ctx.newAssetFace({ assetId: hiddenFaceAsset.id, personId: hiddenFacePerson.id, isVisible: false });
      await ctx.newAssetFace({
        assetId: deletedFaceAsset.id,
        personId: deletedFacePerson.id,
        deletedAt: new Date('2024-01-01T00:00:00.000Z'),
      });
      await ctx.newAssetFace({ assetId: hiddenUnnamedAsset.id, personId: hiddenUnnamedPerson.id });

      const result = await sut.getSmartSearchFacets({
        embedding: matchingEmbedding,
        userIds: [user.id],
        maxDistance: 0,
      });

      expect(result.people).toEqual([{ id: visiblePerson.id, name: 'Visible Ada' }]);
      expect(result.hasUnnamedPeople).toBe(false);
    });

    it('returns shared-space person ids when spaceId is set', async () => {
      const { ctx, sut } = setup();
      const { user: owner } = await ctx.newUser();
      const { user: member } = await ctx.newUser();
      const { asset } = await ctx.newAsset({ ownerId: owner.id });
      await addEmbedding(ctx.database, asset.id);

      const { space } = await ctx.newSharedSpace({ createdById: owner.id });
      await ctx.newSharedSpaceMember({ spaceId: space.id, userId: owner.id, role: 'owner' });
      await ctx.newSharedSpaceMember({ spaceId: space.id, userId: member.id, role: 'viewer' });
      await ctx.newSharedSpaceAsset({ spaceId: space.id, assetId: asset.id, addedById: owner.id });

      const { person } = await ctx.newPerson({ ownerId: owner.id, name: 'Personal Ada' });
      const { assetFace } = await ctx.newAssetFace({ assetId: asset.id, personId: person.id });
      const sharedPerson = await ctx.database
        .insertInto('shared_space_person')
        .values({
          spaceId: space.id,
          name: 'Space Ada',
          representativeFaceId: assetFace.id,
          isHidden: false,
        })
        .returningAll()
        .executeTakeFirstOrThrow();
      await ctx.database
        .insertInto('shared_space_person_face')
        .values({ personId: sharedPerson.id, assetFaceId: assetFace.id })
        .execute();

      const result = await sut.getSmartSearchFacets({
        embedding: matchingEmbedding,
        userIds: [member.id],
        maxDistance: 0.01,
        spaceId: space.id,
      });

      expect(result.people).toEqual([{ id: sharedPerson.id, name: 'Space Ada' }]);
    });

    it('excludes hidden and deleted asset faces from shared-space people facets', async () => {
      const { ctx, sut } = setup();
      const { user: owner } = await ctx.newUser();
      const { user: member } = await ctx.newUser();
      const { space } = await ctx.newSharedSpace({ createdById: owner.id });
      await ctx.newSharedSpaceMember({ spaceId: space.id, userId: owner.id, role: 'owner' });
      await ctx.newSharedSpaceMember({ spaceId: space.id, userId: member.id, role: 'viewer' });

      const makeSharedPerson = async (name: string, isVisible = true, deletedAt: Date | null = null) => {
        const { asset } = await ctx.newAsset({ ownerId: owner.id });
        await addEmbedding(ctx.database, asset.id);
        await ctx.newSharedSpaceAsset({ spaceId: space.id, assetId: asset.id, addedById: owner.id });
        const { assetFace } = await ctx.newAssetFace({ assetId: asset.id, isVisible, deletedAt });
        const sharedPerson = await ctx.database
          .insertInto('shared_space_person')
          .values({ spaceId: space.id, name, representativeFaceId: assetFace.id, isHidden: false })
          .returningAll()
          .executeTakeFirstOrThrow();
        await ctx.database
          .insertInto('shared_space_person_face')
          .values({ personId: sharedPerson.id, assetFaceId: assetFace.id })
          .execute();
        return sharedPerson;
      };

      const visiblePerson = await makeSharedPerson('Visible Space Ada');
      await makeSharedPerson('Hidden Space Face', false);
      await makeSharedPerson('Deleted Space Face', true, new Date('2024-01-01T00:00:00.000Z'));

      const result = await sut.getSmartSearchFacets({
        embedding: matchingEmbedding,
        userIds: [member.id],
        maxDistance: 0,
        spaceId: space.id,
      });

      expect(result.people).toEqual([{ id: visiblePerson.id, name: 'Visible Space Ada' }]);
      expect(result.hasUnnamedPeople).toBe(false);
    });
  });
});
