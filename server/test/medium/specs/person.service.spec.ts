import { Kysely } from 'kysely';
import { JobStatus, SourceType } from 'src/enum';
import { PersonService } from 'src/services/person.service';
import { TestContext, TestFactory } from 'test/factory';
import { newEmbedding } from 'test/small.factory';
import { getKyselyDB, newTestService } from 'test/utils';

const setup = async (db: Kysely<any>) => {
  const context = await TestContext.from(db).create();
  const { sut, mocks } = newTestService(PersonService, context);

  return { sut, mocks, context };
};

describe.concurrent(PersonService.name, () => {
  let sut: PersonService;
  let context: TestContext;

  beforeAll(async () => {
    ({ sut, context } = await setup(await getKyselyDB()));
  });

  describe('handleRecognizeFaces', () => {
    it('should skip if face source type is not MACHINE_LEARNING', async () => {
      const user = TestFactory.user();
      const asset = TestFactory.asset({ ownerId: user.id });
      const assetFace = TestFactory.assetFace({ assetId: asset.id, sourceType: SourceType.MANUAL });
      const face = TestFactory.face({ faceId: assetFace.id });
      await context.getFactory().withUser(user).withAsset(asset).withAssetFace(assetFace).withFaces(face).create();

      const result = await sut.handleRecognizeFaces({ id: assetFace.id, deferred: false });

      expect(result).toBe(JobStatus.SKIPPED);
      const newPersonId = await context.db
        .selectFrom('asset_faces')
        .select('asset_faces.personId')
        .where('asset_faces.id', '=', assetFace.id)
        .executeTakeFirst();
      expect(newPersonId?.personId).toBeNull();
    });

    it('should fail if face does not have an embedding', async () => {
      const user = TestFactory.user();
      const asset = TestFactory.asset({ ownerId: user.id });
      const assetFace = TestFactory.assetFace({ assetId: asset.id, sourceType: SourceType.MACHINE_LEARNING });
      await context.getFactory().withUser(user).withAsset(asset).withAssetFace(assetFace).create();

      const result = await sut.handleRecognizeFaces({ id: assetFace.id, deferred: false });

      expect(result).toBe(JobStatus.FAILED);
      const newPersonId = await context.db
        .selectFrom('asset_faces')
        .select('asset_faces.personId')
        .where('asset_faces.id', '=', assetFace.id)
        .executeTakeFirst();
      expect(newPersonId?.personId).toBeNull();
    });

    it('should skip if face already has a person assigned', async () => {
      const user = TestFactory.user();
      const asset = TestFactory.asset({ ownerId: user.id });
      const person = TestFactory.person({ ownerId: user.id });
      const assetFace = TestFactory.assetFace({
        assetId: asset.id,
        sourceType: SourceType.MACHINE_LEARNING,
        personId: person.id,
      });
      const face = TestFactory.face({ faceId: assetFace.id });
      await context
        .getFactory()
        .withUser(user)
        .withAsset(asset)
        .withPerson(person)
        .withAssetFace(assetFace)
        .withFaces(face)
        .create();

      const result = await sut.handleRecognizeFaces({ id: assetFace.id, deferred: false });

      expect(result).toBe(JobStatus.SKIPPED);
      const newPersonId = await context.db
        .selectFrom('asset_faces')
        .select('asset_faces.personId')
        .where('asset_faces.id', '=', assetFace.id)
        .executeTakeFirst();
      expect(newPersonId?.personId).toEqual(person.id);
    });

    it('should create a new person if no matches are found', async () => {
      const user = TestFactory.user();
      const embedding = newEmbedding();

      let factory = context.getFactory().withUser(user);

      for (let i = 0; i < 3; i++) {
        const existingAsset = TestFactory.asset({ ownerId: user.id });
        const existingAssetFace = TestFactory.assetFace({
          assetId: existingAsset.id,
          sourceType: SourceType.MACHINE_LEARNING,
        });
        const existingFace = TestFactory.face({ faceId: existingAssetFace.id, embedding });
        factory = factory.withAsset(existingAsset).withAssetFace(existingAssetFace).withFaces(existingFace);
      }

      const newAsset = TestFactory.asset({ ownerId: user.id });
      const newAssetFace = TestFactory.assetFace({ assetId: newAsset.id, sourceType: SourceType.MACHINE_LEARNING });
      const newFace = TestFactory.face({ faceId: newAssetFace.id, embedding });

      await factory.withAsset(newAsset).withAssetFace(newAssetFace).withFaces(newFace).create();

      const result = await sut.handleRecognizeFaces({ id: newAssetFace.id, deferred: false });

      expect(result).toBe(JobStatus.SUCCESS);

      const newPersonId = await context.db
        .selectFrom('asset_faces')
        .select('asset_faces.personId')
        .where('asset_faces.id', '=', newAssetFace.id)
        .executeTakeFirstOrThrow();
      expect(newPersonId.personId).toBeDefined();
    });

    it('should assign face to an existing person if matches are found', async () => {
      const user = TestFactory.user();
      const existingPerson = TestFactory.person({ ownerId: user.id });
      const embedding = newEmbedding();

      let factory = context.getFactory().withUser(user).withPerson(existingPerson);

      const assetFaces: string[] = [];

      for (let i = 0; i < 3; i++) {
        const existingAsset = TestFactory.asset({ ownerId: user.id });
        const existingAssetFace = TestFactory.assetFace({
          assetId: existingAsset.id,
          sourceType: SourceType.MACHINE_LEARNING,
        });
        assetFaces.push(existingAssetFace.id);
        const existingFace = TestFactory.face({ faceId: existingAssetFace.id, embedding });
        factory = factory.withAsset(existingAsset).withAssetFace(existingAssetFace).withFaces(existingFace);
      }

      const newAsset = TestFactory.asset({ ownerId: user.id });
      const newAssetFace = TestFactory.assetFace({ assetId: newAsset.id, sourceType: SourceType.MACHINE_LEARNING });
      const newFace = TestFactory.face({ faceId: newAssetFace.id, embedding });
      await factory.withAsset(newAsset).withAssetFace(newAssetFace).withFaces(newFace).create();
      await context.person.reassignFaces({ newPersonId: existingPerson.id, faceIds: assetFaces });

      const result = await sut.handleRecognizeFaces({ id: newAssetFace.id, deferred: false });

      expect(result).toBe(JobStatus.SUCCESS);

      const after = await context.db
        .selectFrom('asset_faces')
        .select('asset_faces.personId')
        .where('asset_faces.id', '=', newAssetFace.id)
        .executeTakeFirstOrThrow();
      expect(after.personId).toEqual(existingPerson.id);
    });

    it('should not assign face to an existing person if asset is older than person', async () => {
      const user = TestFactory.user();
      const assetCreatedAt = new Date('2020-02-23T05:06:29.716Z');
      const birthDate = new Date(assetCreatedAt.getTime() + 3600 * 1000 * 365);
      const existingPerson = TestFactory.person({ ownerId: user.id, birthDate });
      const embedding = newEmbedding();

      let factory = context.getFactory().withUser(user).withPerson(existingPerson);

      const assetFaces: string[] = [];

      for (let i = 0; i < 3; i++) {
        const existingAsset = TestFactory.asset({ ownerId: user.id });
        const existingAssetFace = TestFactory.assetFace({
          assetId: existingAsset.id,
          sourceType: SourceType.MACHINE_LEARNING,
        });
        assetFaces.push(existingAssetFace.id);
        const existingFace = TestFactory.face({ faceId: existingAssetFace.id, embedding });
        factory = factory.withAsset(existingAsset).withAssetFace(existingAssetFace).withFaces(existingFace);
      }

      const newAsset = TestFactory.asset({ ownerId: user.id, fileCreatedAt: assetCreatedAt });
      const newAssetFace = TestFactory.assetFace({ assetId: newAsset.id, sourceType: SourceType.MACHINE_LEARNING });
      const newFace = TestFactory.face({ faceId: newAssetFace.id, embedding });
      await factory.withAsset(newAsset).withAssetFace(newAssetFace).withFaces(newFace).create();
      await context.person.reassignFaces({ newPersonId: existingPerson.id, faceIds: assetFaces });

      const result = await sut.handleRecognizeFaces({ id: newAssetFace.id, deferred: false });

      expect(result).toBe(JobStatus.SKIPPED);

      const after = await context.db
        .selectFrom('asset_faces')
        .select('asset_faces.personId')
        .where('asset_faces.id', '=', newAssetFace.id)
        .executeTakeFirstOrThrow();
      expect(after.personId).toBeNull();
    });
  });
});
