import { AssetMediaResponseDto, LoginResponseDto, PersonResponseDto, SharedSpaceRole } from '@immich/sdk';
import { createUserDto } from 'src/fixtures';
import { app, utils } from 'src/utils';
import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

type GlobalFaceIdentityFixture = {
  faceIdentityId: string;
  userA: LoginResponseDto;
  userB: LoginResponseDto;
  userC: LoginResponseDto;
  userD: LoginResponseDto;
  userE: LoginResponseDto;
  userF: LoginResponseDto;
  space1PersonId: string;
  space2PersonId: string;
};

const setupGlobalFaceIdentityE2E = async (): Promise<GlobalFaceIdentityFixture> => {
  const db = await utils.connectDatabase();
  const userA = await utils.adminSetup();
  const [userB, userC, userD, userE, userF] = await Promise.all([
    utils.userSetup(userA.accessToken, createUserDto.create('global-face-user-b')),
    utils.userSetup(userA.accessToken, createUserDto.create('global-face-user-c')),
    utils.userSetup(userA.accessToken, createUserDto.create('global-face-user-d')),
    utils.userSetup(userA.accessToken, createUserDto.create('global-face-user-e')),
    utils.userSetup(userA.accessToken, createUserDto.create('global-face-user-f')),
  ]);

  const [space1, space2] = await Promise.all([
    utils.createSpace(userA.accessToken, { name: 'Space 1' }),
    utils.createSpace(userB.accessToken, { name: 'Space 2' }),
  ]);
  await Promise.all([
    utils.addSpaceMember(userA.accessToken, space1.id, { userId: userC.userId, role: SharedSpaceRole.Viewer }),
    utils.addSpaceMember(userA.accessToken, space1.id, { userId: userE.userId, role: SharedSpaceRole.Viewer }),
    utils.addSpaceMember(userB.accessToken, space2.id, { userId: userD.userId, role: SharedSpaceRole.Viewer }),
    utils.addSpaceMember(userB.accessToken, space2.id, { userId: userE.userId, role: SharedSpaceRole.Viewer }),
  ]);
  await db.query(
    `UPDATE "shared_space_member" SET "sharePersonMetadata" = false WHERE "spaceId" = $1 AND "userId" = $2`,
    [space2.id, userB.userId],
  );

  const [personA, personB] = await Promise.all([
    utils.createPerson(userA.accessToken, { name: 'Alice Source', birthDate: '1990-01-01' }),
    utils.createPerson(userB.accessToken, { name: 'Space 2 Private Name', birthDate: '1985-05-05' }),
  ]);
  const [assetsA, assetsB] = (await Promise.all([
    Promise.all(Array.from({ length: 3 }, () => utils.createAsset(userA.accessToken))),
    Promise.all(Array.from({ length: 3 }, () => utils.createAsset(userB.accessToken))),
  ])) as [AssetMediaResponseDto[], AssetMediaResponseDto[]];
  await Promise.all([
    utils.addSpaceAssets(
      userA.accessToken,
      space1.id,
      assetsA.map((asset) => asset.id),
    ),
    utils.addSpaceAssets(
      userB.accessToken,
      space2.id,
      assetsB.map((asset) => asset.id),
    ),
  ]);

  const [facesA, facesB] = await Promise.all([
    Promise.all(assetsA.map((asset) => utils.createFace({ assetId: asset.id, personId: personA.id }))),
    Promise.all(assetsB.map((asset) => utils.createFace({ assetId: asset.id, personId: personB.id }))),
  ]);
  const [faceA] = facesA;
  const [faceB] = facesB;

  await db.query('BEGIN');
  try {
    const identityResult = await db.query(
      `INSERT INTO "face_identity" ("type", "representativeFaceId") VALUES ('person', $1) RETURNING id`,
      [faceA],
    );
    const faceIdentityId = identityResult.rows[0].id as string;
    await db.query(`UPDATE "person" SET "identityId" = $1 WHERE id IN ($2, $3)`, [
      faceIdentityId,
      personA.id,
      personB.id,
    ]);
    await db.query(
      `INSERT INTO "face_identity_face" ("assetFaceId", "identityId", "source")
       SELECT unnest($1::uuid[]), $2, 'manual'
       ON CONFLICT ("assetFaceId") DO UPDATE SET
         "identityId" = EXCLUDED."identityId",
         "source" = EXCLUDED."source"`,
      [[...facesA, ...facesB], faceIdentityId],
    );
    const space1Person = await db.query(
      `INSERT INTO "shared_space_person"
         ("spaceId", name, "birthDate", "isHidden", "faceCount", "assetCount", "representativeFaceId", "identityId", "type")
       VALUES ($1, 'Alice Source', '1990-01-01', false, 3, 3, $2, $3, 'person')
       RETURNING id`,
      [space1.id, faceA, faceIdentityId],
    );
    const space2Person = await db.query(
      `INSERT INTO "shared_space_person"
         ("spaceId", name, "birthDate", "isHidden", "faceCount", "assetCount", "representativeFaceId", "identityId", "type")
       VALUES ($1, 'Space 2 Private Name', '1985-05-05', false, 3, 3, $2, $3, 'person')
       RETURNING id`,
      [space2.id, faceB, faceIdentityId],
    );
    await db.query(
      `INSERT INTO "shared_space_person_face" ("personId", "assetFaceId")
       SELECT $1::uuid, unnest($2::uuid[])
       UNION ALL
       SELECT $3::uuid, unnest($4::uuid[])`,
      [space1Person.rows[0].id, facesA, space2Person.rows[0].id, facesB],
    );
    await db.query('COMMIT');

    return {
      faceIdentityId,
      userA,
      userB,
      userC,
      userD,
      userE,
      userF,
      space1PersonId: space1Person.rows[0].id,
      space2PersonId: space2Person.rows[0].id,
    };
  } catch (error) {
    await db.query('ROLLBACK').catch(() => {});
    throw error;
  }
};

describe('/people global face identities', () => {
  let fx: GlobalFaceIdentityFixture;

  beforeAll(async () => {
    await utils.resetDatabase([
      'face_identity_face',
      'face_identity',
      'shared_space',
      'person',
      'album',
      'asset',
      'asset_face',
      'activity',
      'api_key',
      'session',
      'user',
      'system_metadata',
      'tag',
      'user_group',
    ]);
    fx = await setupGlobalFaceIdentityE2E();
  }, 60_000);

  it('dedupes accessible people without leaking inaccessible space metadata', async () => {
    const { body: bothSpacesPeople } = await request(app)
      .get('/people')
      .query({ withHidden: true, withSharedSpaces: true })
      .set('Authorization', `Bearer ${fx.userE.accessToken}`)
      .expect(200);
    const { body: space1OnlyPeople } = await request(app)
      .get('/people')
      .query({ withHidden: true, withSharedSpaces: true })
      .set('Authorization', `Bearer ${fx.userC.accessToken}`)
      .expect(200);
    const { body: space2OnlyPeople } = await request(app)
      .get('/people')
      .query({ withHidden: true, withSharedSpaces: true })
      .set('Authorization', `Bearer ${fx.userD.accessToken}`)
      .expect(200);

    expect(bothSpacesPeople.people.filter((person: PersonResponseDto) => person.name === 'Alice Source')).toHaveLength(
      1,
    );
    expect(JSON.stringify(space1OnlyPeople)).not.toContain('Space 2 Private Name');
    expect(JSON.stringify(space2OnlyPeople)).not.toContain('Alice Source');
    expect(JSON.stringify(space1OnlyPeople)).not.toContain(fx.faceIdentityId);
    expect(JSON.stringify(bothSpacesPeople)).not.toContain('identityId');
  });

  it('scopes filter suggestions and people search by accessible identity profiles', async () => {
    const { body: userEFilters } = await request(app)
      .get('/search/suggestions/filters')
      .query({ withSharedSpaces: true })
      .set('Authorization', `Bearer ${fx.userE.accessToken}`)
      .expect(200);
    const { body: userCFilters } = await request(app)
      .get('/search/suggestions/filters')
      .query({ withSharedSpaces: true })
      .set('Authorization', `Bearer ${fx.userC.accessToken}`)
      .expect(200);
    const { body: userESearch } = await request(app)
      .get('/search/person')
      .query({ name: 'Alice', withSharedSpaces: true })
      .set('Authorization', `Bearer ${fx.userE.accessToken}`)
      .expect(200);
    const { body: userCPrivateSearch } = await request(app)
      .get('/search/person')
      .query({ name: 'Private', withSharedSpaces: true })
      .set('Authorization', `Bearer ${fx.userC.accessToken}`)
      .expect(200);
    const { body: userFPeople } = await request(app)
      .get('/people')
      .query({ withHidden: true, withSharedSpaces: true })
      .set('Authorization', `Bearer ${fx.userF.accessToken}`)
      .expect(200);

    expect(userEFilters.people).toHaveLength(1);
    expect(userEFilters.people[0].id).toMatch(/^(person|space-person):/);
    expect(JSON.stringify(userCFilters)).not.toContain('Space 2 Private Name');
    expect(userESearch.filter((person: PersonResponseDto) => person.name === 'Alice Source')).toHaveLength(1);
    expect(userCPrivateSearch).toEqual([]);
    expect(userFPeople.people).toEqual([]);
  });
});
