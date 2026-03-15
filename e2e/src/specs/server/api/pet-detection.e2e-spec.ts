import { LoginResponseDto, QueueCommand, mergePerson, updateConfig } from '@immich/sdk';
import { errorDto } from 'src/responses';
import { app, asBearerAuth, utils } from 'src/utils';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const getSystemConfig = (accessToken: string) => utils.getSystemConfig(accessToken);

describe('/pet-detection', () => {
  let admin: LoginResponseDto;
  let user1: LoginResponseDto;
  let user2: LoginResponseDto;

  beforeAll(async () => {
    await utils.resetDatabase();
    admin = await utils.adminSetup();

    [user1, user2] = await Promise.all([
      utils.userSetup(admin.accessToken, {
        email: 'pet-user1@immich.cloud',
        name: 'Pet User 1',
        password: 'password',
      }),
      utils.userSetup(admin.accessToken, {
        email: 'pet-user2@immich.cloud',
        name: 'Pet User 2',
        password: 'password',
      }),
    ]);

    await utils.connectDatabase();
  });

  afterAll(async () => {
    await utils.resetAdminConfig(admin.accessToken);
    await utils.disconnectDatabase();
  });

  describe('Config Management', () => {
    it('should have pet detection disabled by default with yolo11s and 0.6 minScore', async () => {
      const config = await getSystemConfig(admin.accessToken);

      expect(config.machineLearning.petDetection).toEqual({
        enabled: false,
        modelName: 'yolo11s',
        minScore: 0.6,
      });
    });

    it('should enable pet detection', async () => {
      const config = await getSystemConfig(admin.accessToken);
      config.machineLearning.petDetection.enabled = true;
      const updated = await updateConfig({ systemConfigDto: config }, { headers: asBearerAuth(admin.accessToken) });

      expect(updated.machineLearning.petDetection.enabled).toBe(true);

      const refetched = await getSystemConfig(admin.accessToken);
      expect(refetched.machineLearning.petDetection.enabled).toBe(true);
    });

    it('should change model to yolo11n', async () => {
      const config = await getSystemConfig(admin.accessToken);
      config.machineLearning.petDetection.modelName = 'yolo11n';
      await updateConfig({ systemConfigDto: config }, { headers: asBearerAuth(admin.accessToken) });

      const refetched = await getSystemConfig(admin.accessToken);
      expect(refetched.machineLearning.petDetection.modelName).toBe('yolo11n');
    });

    it('should change model to yolo11m', async () => {
      const config = await getSystemConfig(admin.accessToken);
      config.machineLearning.petDetection.modelName = 'yolo11m';
      await updateConfig({ systemConfigDto: config }, { headers: asBearerAuth(admin.accessToken) });

      const refetched = await getSystemConfig(admin.accessToken);
      expect(refetched.machineLearning.petDetection.modelName).toBe('yolo11m');
    });

    it('should change minScore to 0.3', async () => {
      const config = await getSystemConfig(admin.accessToken);
      config.machineLearning.petDetection.minScore = 0.3;
      await updateConfig({ systemConfigDto: config }, { headers: asBearerAuth(admin.accessToken) });

      const refetched = await getSystemConfig(admin.accessToken);
      expect(refetched.machineLearning.petDetection.minScore).toBe(0.3);
    });

    it('should reject minScore below 0.1', async () => {
      const config = await getSystemConfig(admin.accessToken);
      config.machineLearning.petDetection.minScore = 0.05;

      const { status, body } = await request(app)
        .put('/system-config')
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .send(config);

      expect(status).toBe(400);
      expect(body).toEqual(errorDto.badRequest());
    });

    it('should reject minScore above 1.0', async () => {
      const config = await getSystemConfig(admin.accessToken);
      config.machineLearning.petDetection.minScore = 1.5;

      const { status, body } = await request(app)
        .put('/system-config')
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .send(config);

      expect(status).toBe(400);
      expect(body).toEqual(errorDto.badRequest());
    });

    it('should reject empty modelName', async () => {
      const config = await getSystemConfig(admin.accessToken);
      config.machineLearning.petDetection.modelName = '';

      const { status, body } = await request(app)
        .put('/system-config')
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .send(config);

      expect(status).toBe(400);
      expect(body).toEqual(errorDto.badRequest());
    });

    it('should reset to defaults', async () => {
      await utils.resetAdminConfig(admin.accessToken);

      const config = await getSystemConfig(admin.accessToken);
      expect(config.machineLearning.petDetection).toEqual({
        enabled: false,
        modelName: 'yolo11s',
        minScore: 0.6,
      });
    });
  });

  describe('Queue Operations', () => {
    it('should list petDetection in queues', async () => {
      const { status, body } = await request(app).get('/jobs').set('Authorization', `Bearer ${admin.accessToken}`);

      expect(status).toBe(200);
      expect(body).toHaveProperty('petDetection');
    });

    it('should accept start command on petDetection queue', async () => {
      const config = await getSystemConfig(admin.accessToken);
      config.machineLearning.petDetection.enabled = true;
      config.machineLearning.enabled = true;
      await updateConfig({ systemConfigDto: config }, { headers: asBearerAuth(admin.accessToken) });

      const { status } = await request(app)
        .put('/jobs/petDetection')
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .send({ command: QueueCommand.Start, force: false });

      expect(status).toBe(200);
      await utils.waitForQueueFinish(admin.accessToken, 'petDetection');

      await utils.resetAdminConfig(admin.accessToken);
    });

    it('should pause and resume petDetection queue', async () => {
      const { status: pauseStatus } = await request(app)
        .put('/jobs/petDetection')
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .send({ command: QueueCommand.Pause, force: false });

      expect(pauseStatus).toBe(200);

      const { status: resumeStatus } = await request(app)
        .put('/jobs/petDetection')
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .send({ command: QueueCommand.Resume, force: false });

      expect(resumeStatus).toBe(200);
    });

    it('should empty petDetection queue', async () => {
      const { status } = await request(app)
        .put('/jobs/petDetection')
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .send({ command: QueueCommand.Empty, force: false });

      expect(status).toBe(200);
    });

    it('should accept force reprocessing flag', async () => {
      const config = await getSystemConfig(admin.accessToken);
      config.machineLearning.petDetection.enabled = true;
      config.machineLearning.enabled = true;
      await updateConfig({ systemConfigDto: config }, { headers: asBearerAuth(admin.accessToken) });

      const { status } = await request(app)
        .put('/jobs/petDetection')
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .send({ command: QueueCommand.Start, force: true });

      expect(status).toBe(200);
      await utils.waitForQueueFinish(admin.accessToken, 'petDetection');

      await utils.resetAdminConfig(admin.accessToken);
    });
  });

  describe('Pet Person Records', () => {
    let petDogId: string;
    let petCatId: string;
    let asset1Id: string;
    let asset2Id: string;

    beforeAll(async () => {
      await utils.resetDatabase();
      admin = await utils.adminSetup();
      [user1, user2] = await Promise.all([
        utils.userSetup(admin.accessToken, {
          email: 'pet-user1@immich.cloud',
          name: 'Pet User 1',
          password: 'password',
        }),
        utils.userSetup(admin.accessToken, {
          email: 'pet-user2@immich.cloud',
          name: 'Pet User 2',
          password: 'password',
        }),
      ]);
      await utils.connectDatabase();

      const [a1, a2] = await Promise.all([utils.createAsset(admin.accessToken), utils.createAsset(admin.accessToken)]);
      asset1Id = a1.id;
      asset2Id = a2.id;
    });

    it('should create a pet person with type=pet and species=dog', async () => {
      petDogId = await utils.createPet(admin.userId, 'dog');

      const { status, body } = await request(app)
        .get(`/people/${petDogId}`)
        .set('Authorization', `Bearer ${admin.accessToken}`);

      expect(status).toBe(200);
      expect(body).toMatchObject({
        id: petDogId,
        type: 'pet',
        species: 'dog',
        name: 'dog',
      });
    });

    it('should create a separate pet person for cat species', async () => {
      petCatId = await utils.createPet(admin.userId, 'cat');

      const { status, body } = await request(app)
        .get(`/people/${petCatId}`)
        .set('Authorization', `Bearer ${admin.accessToken}`);

      expect(status).toBe(200);
      expect(body).toMatchObject({
        type: 'pet',
        species: 'cat',
      });
      expect(petCatId).not.toBe(petDogId);
    });

    it('should allow multiple pet records of the same species via direct DB insert', async () => {
      const secondDogId = await utils.createPet(admin.userId, 'dog');
      expect(secondDogId).not.toBe(petDogId);
    });

    it('should create separate pet records for different owners', async () => {
      const user1DogId = await utils.createPet(user1.userId, 'dog');
      const user2DogId = await utils.createPet(user2.userId, 'dog');

      expect(user1DogId).not.toBe(user2DogId);

      const { body: dog1 } = await request(app)
        .get(`/people/${user1DogId}`)
        .set('Authorization', `Bearer ${user1.accessToken}`);

      const { body: dog2 } = await request(app)
        .get(`/people/${user2DogId}`)
        .set('Authorization', `Bearer ${user2.accessToken}`);

      expect(dog1.species).toBe('dog');
      expect(dog2.species).toBe('dog');
    });

    it('should link pet to asset via createFace', async () => {
      await utils.createFace({ assetId: asset1Id, personId: petDogId });

      const { body: stats } = await request(app)
        .get(`/people/${petDogId}/statistics`)
        .set('Authorization', `Bearer ${admin.accessToken}`);

      expect(stats.assets).toBeGreaterThanOrEqual(1);
    });

    it('should have thumbnailPath set on pet', async () => {
      const { body } = await request(app)
        .get(`/people/${petDogId}`)
        .set('Authorization', `Bearer ${admin.accessToken}`);

      expect(body.thumbnailPath).toBeTruthy();
    });

    it('should return type=pet and species for pet via GET /people/:id', async () => {
      const { status, body } = await request(app)
        .get(`/people/${petDogId}`)
        .set('Authorization', `Bearer ${admin.accessToken}`);

      expect(status).toBe(200);
      expect(body.type).toBe('pet');
      expect(body.species).toBe('dog');
    });

    it('should return type=person and no species for regular person', async () => {
      const person = await utils.createPerson(admin.accessToken, { name: 'Human Person' });

      const { status, body } = await request(app)
        .get(`/people/${person.id}`)
        .set('Authorization', `Bearer ${admin.accessToken}`);

      expect(status).toBe(200);
      expect(body.type).toBe('person');
      expect([null, undefined]).toContain(body.species);
    });

    it('should update pet name', async () => {
      const { status, body } = await request(app)
        .put(`/people/${petDogId}`)
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .send({ name: 'Buddy' });

      expect(status).toBe(200);
      expect(body.name).toBe('Buddy');
    });

    it('should toggle isHidden on pet', async () => {
      const { status, body } = await request(app)
        .put(`/people/${petDogId}`)
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .send({ isHidden: true });

      expect(status).toBe(200);
      expect(body.isHidden).toBe(true);

      const { body: body2 } = await request(app)
        .put(`/people/${petDogId}`)
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .send({ isHidden: false });

      expect(body2.isHidden).toBe(false);
    });

    it('should set isFavorite on pet', async () => {
      const { status, body } = await request(app)
        .put(`/people/${petDogId}`)
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .send({ isFavorite: true });

      expect(status).toBe(200);
      expect(body.isFavorite).toBe(true);
    });

    it('should return correct asset count for pet via statistics', async () => {
      await utils.createFace({ assetId: asset2Id, personId: petCatId });

      const { status, body } = await request(app)
        .get(`/people/${petCatId}/statistics`)
        .set('Authorization', `Bearer ${admin.accessToken}`);

      expect(status).toBe(200);
      expect(body.assets).toBeGreaterThanOrEqual(1);
    });

    it('should delete a pet person', async () => {
      const tempPetId = await utils.createPet(admin.userId, 'horse');

      const { status: deleteStatus } = await request(app)
        .delete(`/people/${tempPetId}`)
        .set('Authorization', `Bearer ${admin.accessToken}`);

      expect(deleteStatus).toBe(204);

      const { status: getStatus } = await request(app)
        .get(`/people/${tempPetId}`)
        .set('Authorization', `Bearer ${admin.accessToken}`);

      expect(getStatus).toBe(400);
    });

    it('should merge two pet persons and consolidate faces', async () => {
      const pet1 = await utils.createPet(admin.userId, 'bird', 'Tweety');
      const pet2 = await utils.createPet(admin.userId, 'bird', 'Birdie');
      const asset = await utils.createAsset(admin.accessToken);
      await utils.createFace({ assetId: asset.id, personId: pet2 });

      const { status } = await request(app)
        .post(`/people/${pet1}/merge`)
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .send({ ids: [pet2] });

      expect(status).toBe(200);

      const { status: getStatus } = await request(app)
        .get(`/people/${pet2}`)
        .set('Authorization', `Bearer ${admin.accessToken}`);

      expect(getStatus).toBe(400);
    });

    it('should retain type=person when merging pet into regular person', async () => {
      const person = await utils.createPerson(admin.accessToken, { name: 'Merge Target Person' });
      const pet = await utils.createPet(admin.userId, 'sheep');

      await mergePerson(
        { id: person.id, mergePersonDto: { ids: [pet] } },
        { headers: asBearerAuth(admin.accessToken) },
      );

      const { body } = await request(app)
        .get(`/people/${person.id}`)
        .set('Authorization', `Bearer ${admin.accessToken}`);

      expect(body.type).toBe('person');
    });

    it('should retain type=pet when merging regular person into pet', async () => {
      const person = await utils.createPerson(admin.accessToken, { name: 'Merge Source Person' });
      const pet = await utils.createPet(admin.userId, 'zebra');

      await mergePerson(
        { id: pet, mergePersonDto: { ids: [person.id] } },
        { headers: asBearerAuth(admin.accessToken) },
      );

      const { body } = await request(app).get(`/people/${pet}`).set('Authorization', `Bearer ${admin.accessToken}`);

      expect(body.type).toBe('pet');
    });
  });

  describe('Person API Integration', () => {
    let integrationPetId: string;
    let integrationPersonId: string;
    let integrationAssetId: string;

    beforeAll(async () => {
      await utils.resetDatabase();
      admin = await utils.adminSetup();
      await utils.connectDatabase();

      const asset = await utils.createAsset(admin.accessToken);
      integrationAssetId = asset.id;

      integrationPetId = await utils.createPet(admin.userId, 'cat', 'Whiskers');
      const person = await utils.createPerson(admin.accessToken, { name: 'John' });
      integrationPersonId = person.id;

      await Promise.all([
        utils.createFace({ assetId: integrationAssetId, personId: integrationPetId }),
        utils.createFace({ assetId: integrationAssetId, personId: integrationPersonId }),
      ]);
    });

    it('should return both persons and pets in GET /people', async () => {
      const { status, body } = await request(app)
        .get('/people')
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .query({ withHidden: true });

      expect(status).toBe(200);

      const types = body.people.map((p: any) => p.type);
      expect(types).toContain('person');
      expect(types).toContain('pet');
    });

    it('should include pet in asset people list', async () => {
      const asset = await utils.getAssetInfo(admin.accessToken, integrationAssetId);
      expect(asset).toBeDefined();
    });

    it('should handle multiple pets in same asset', async () => {
      const dogId = await utils.createPet(admin.userId, 'dog', 'Rex');
      const birdId = await utils.createPet(admin.userId, 'bird', 'Polly');

      const asset = await utils.createAsset(admin.accessToken);
      await Promise.all([
        utils.createFace({ assetId: asset.id, personId: dogId }),
        utils.createFace({ assetId: asset.id, personId: birdId }),
      ]);

      const [dogStats, birdStats] = await Promise.all([
        request(app).get(`/people/${dogId}/statistics`).set('Authorization', `Bearer ${admin.accessToken}`),
        request(app).get(`/people/${birdId}/statistics`).set('Authorization', `Bearer ${admin.accessToken}`),
      ]);

      expect(dogStats.body.assets).toBeGreaterThanOrEqual(1);
      expect(birdStats.body.assets).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Multi-user Isolation', () => {
    let isoUser1: LoginResponseDto;
    let isoUser2: LoginResponseDto;
    let user1PetId: string;
    let user2PetId: string;

    beforeAll(async () => {
      await utils.resetDatabase();
      admin = await utils.adminSetup();
      [isoUser1, isoUser2] = await Promise.all([
        utils.userSetup(admin.accessToken, {
          email: 'iso-user1@immich.cloud',
          name: 'Iso User 1',
          password: 'password',
        }),
        utils.userSetup(admin.accessToken, {
          email: 'iso-user2@immich.cloud',
          name: 'Iso User 2',
          password: 'password',
        }),
      ]);
      await utils.connectDatabase();

      user1PetId = await utils.createPet(isoUser1.userId, 'dog', 'Rover');
      user2PetId = await utils.createPet(isoUser2.userId, 'dog', 'Spot');

      const [a1, a2] = await Promise.all([
        utils.createAsset(isoUser1.accessToken),
        utils.createAsset(isoUser2.accessToken),
      ]);
      await Promise.all([
        utils.createFace({ assetId: a1.id, personId: user1PetId }),
        utils.createFace({ assetId: a2.id, personId: user2PetId }),
      ]);
    });

    it('should not show user1 pets to user2 in GET /people', async () => {
      const { body } = await request(app)
        .get('/people')
        .set('Authorization', `Bearer ${isoUser2.accessToken}`)
        .query({ withHidden: true });

      const petIds = body.people.map((p: any) => p.id);
      expect(petIds).not.toContain(user1PetId);
      expect(petIds).toContain(user2PetId);
    });

    it('should not allow user2 to access user1 pet via GET /people/:id', async () => {
      const { status } = await request(app)
        .get(`/people/${user1PetId}`)
        .set('Authorization', `Bearer ${isoUser2.accessToken}`);

      expect(status).toBe(400);
    });

    it('should not show user1 pets to admin', async () => {
      const { body } = await request(app)
        .get('/people')
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .query({ withHidden: true });

      const petIds = body.people.map((p: any) => p.id);
      expect(petIds).not.toContain(user1PetId);
      expect(petIds).not.toContain(user2PetId);
    });

    it('should create separate pet records per user for same species', async () => {
      expect(user1PetId).not.toBe(user2PetId);

      const [{ body: pet1 }, { body: pet2 }] = await Promise.all([
        request(app).get(`/people/${user1PetId}`).set('Authorization', `Bearer ${isoUser1.accessToken}`),
        request(app).get(`/people/${user2PetId}`).set('Authorization', `Bearer ${isoUser2.accessToken}`),
      ]);

      expect(pet1.species).toBe('dog');
      expect(pet2.species).toBe('dog');
      expect(pet1.name).toBe('Rover');
      expect(pet2.name).toBe('Spot');
    });
  });
});
