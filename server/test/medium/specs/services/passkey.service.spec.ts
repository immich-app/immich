import { Kysely } from 'kysely';
import { AuthChallengeType, SystemMetadataKey } from 'src/enum.js';
import { AccessRepository } from 'src/repositories/access.repository.js';
import { AuthChallengeRepository } from 'src/repositories/auth-challenge.repository.js';
import { ClusterGroupRepository } from 'src/repositories/cluster-group.repository.js';
import { ConfigRepository } from 'src/repositories/config.repository.js';
import { CryptoRepository } from 'src/repositories/crypto.repository.js';
import { DatabaseRepository } from 'src/repositories/database.repository.js';
import { EventRepository } from 'src/repositories/event.repository.js';
import { LoggingRepository } from 'src/repositories/logging.repository.js';
import { PasskeyRepository } from 'src/repositories/passkey.repository.js';
import { SessionRepository } from 'src/repositories/session.repository.js';
import { StorageRepository } from 'src/repositories/storage.repository.js';
import { SystemMetadataRepository } from 'src/repositories/system-metadata.repository.js';
import { TelemetryRepository } from 'src/repositories/telemetry.repository.js';
import { UserRepository } from 'src/repositories/user.repository.js';
import { WebAuthnRepository } from 'src/repositories/webauthn.repository.js';
import { DB } from 'src/schema/index.js';
import { PasskeyService } from 'src/services/passkey.service.js';
import { mediumFactory, newMediumService } from 'test/medium.factory.js';
import { factory } from 'test/small.factory.js';
import { getKyselyDB } from 'test/utils.js';

let defaultDatabase: Kysely<DB>;

const origin = 'https://immich.example';
const headers = { origin };

const registrationResponse = {
  id: 'credential-id',
  rawId: 'credential-id',
  type: 'public-key',
  clientExtensionResults: {},
  response: {
    clientDataJSON: 'client-data',
    attestationObject: 'attestation-object',
  },
};

const authenticationResponse = {
  id: 'credential-id',
  rawId: 'credential-id',
  type: 'public-key',
  clientExtensionResults: {},
  response: {
    clientDataJSON: 'client-data',
    authenticatorData: 'authenticator-data',
    signature: 'signature',
  },
};

const setup = (db?: Kysely<DB>) => {
  return newMediumService(PasskeyService, {
    database: db || defaultDatabase,
    real: [
      AccessRepository,
      AuthChallengeRepository,
      ClusterGroupRepository,
      ConfigRepository,
      CryptoRepository,
      DatabaseRepository,
      PasskeyRepository,
      SessionRepository,
      SystemMetadataRepository,
      UserRepository,
      WebAuthnRepository,
    ],
    mock: [LoggingRepository, StorageRepository, EventRepository, TelemetryRepository],
  });
};

beforeAll(async () => {
  defaultDatabase = await getKyselyDB();
  const { ctx } = setup();
  await ctx.get(SystemMetadataRepository).set(SystemMetadataKey.SystemConfig, {
    passkey: { enabled: true, domain: 'https://immich.example', additionalDomains: [] },
  });
});

describe(PasskeyService.name, () => {
  describe('startRegistration', () => {
    it('should generate registration options', async () => {
      const { sut, ctx } = setup();
      const { user } = await ctx.newUser();

      await expect(sut.startRegistration(factory.auth({ user, session: {} }), headers)).resolves.toEqual(
        expect.objectContaining({
          challenge: expect.any(String),
          rp: { id: 'immich.example', name: 'Immich' },
          user: expect.objectContaining({ name: user.email, displayName: user.name }),
          excludeCredentials: [],
          authenticatorSelection: expect.objectContaining({ residentKey: 'required', userVerification: 'required' }),
        }),
      );
    });

    it('should store a single-use challenge for the user', async () => {
      const { sut, ctx } = setup();
      const { user } = await ctx.newUser();

      const { challenge } = await sut.startRegistration(factory.auth({ user, session: {} }), headers);
      const repository = ctx.get(AuthChallengeRepository);

      await expect(
        repository.consume({ type: AuthChallengeType.PasskeyAuthentication, challenge }),
      ).resolves.toBeUndefined();
      await expect(repository.consume({ type: AuthChallengeType.PasskeyRegistration, challenge })).resolves.toEqual({
        id: expect.any(String),
        userId: user.id,
      });
      await expect(
        repository.consume({ type: AuthChallengeType.PasskeyRegistration, challenge }),
      ).resolves.toBeUndefined();
    });

    it('should exclude the existing passkeys of the user', async () => {
      const { sut, ctx } = setup();
      const { user } = await ctx.newUser();
      const { passkey } = await ctx.newPasskey({ userId: user.id });

      await expect(sut.startRegistration(factory.auth({ user, session: {} }), headers)).resolves.toEqual(
        expect.objectContaining({
          excludeCredentials: [{ id: passkey.credentialId, type: 'public-key', transports: passkey.transports }],
        }),
      );
    });
  });

  describe('finishRegistration', () => {
    it('should reject an invalid response', async () => {
      const { sut, ctx } = setup();
      const { user } = await ctx.newUser();

      await expect(
        sut.finishRegistration(
          factory.auth({ user, session: {} }),
          { response: registrationResponse },
          headers,
          mediumFactory.loginDetails(),
        ),
      ).rejects.toThrow('Passkey registration failed');

      await expect(ctx.get(PasskeyRepository).search({ userId: user.id })).resolves.toEqual([]);
    });
  });

  describe('startAuthentication', () => {
    it('should store a single-use challenge without a user', async () => {
      const { sut, ctx } = setup();

      const { challenge } = await sut.startAuthentication(headers);
      const repository = ctx.get(AuthChallengeRepository);

      await expect(repository.consume({ type: AuthChallengeType.PasskeyAuthentication, challenge })).resolves.toEqual({
        id: expect.any(String),
        userId: null,
      });
      await expect(
        repository.consume({ type: AuthChallengeType.PasskeyAuthentication, challenge }),
      ).resolves.toBeUndefined();
    });
    it('should generate authentication options', async () => {
      const { sut } = setup();

      await expect(sut.startAuthentication(headers)).resolves.toEqual(
        expect.objectContaining({
          challenge: expect.any(String),
          rpId: 'immich.example',
          userVerification: 'required',
        }),
      );
    });
  });

  describe('finishAuthentication', () => {
    it('should reject an unknown credential', async () => {
      const { sut } = setup();

      await expect(
        sut.finishAuthentication({ response: authenticationResponse }, headers, mediumFactory.loginDetails()),
      ).rejects.toThrow('Invalid passkey');
    });

    it('should reject an invalid response for a known credential', async () => {
      const { sut, ctx } = setup();
      const { user } = await ctx.newUser();
      const { passkey } = await ctx.newPasskey({ userId: user.id, credentialId: authenticationResponse.id });

      await expect(
        sut.finishAuthentication({ response: authenticationResponse }, headers, mediumFactory.loginDetails()),
      ).rejects.toThrow('Invalid passkey');

      await expect(ctx.get(PasskeyRepository).get(passkey.id)).resolves.toEqual(
        expect.objectContaining({ usedAt: null }),
      );
      await expect(ctx.get(SessionRepository).getByUserId(user.id)).resolves.toEqual([]);
    });
  });

  describe('search', () => {
    it('should return an empty list', async () => {
      const { sut, ctx } = setup();
      const { user } = await ctx.newUser();

      await expect(sut.search(factory.auth({ user }), {})).resolves.toEqual([]);
    });

    it('should only return the passkeys of the current user', async () => {
      const { sut, ctx } = setup();
      const { user } = await ctx.newUser();
      const { user: otherUser } = await ctx.newUser();
      const { passkey } = await ctx.newPasskey({ userId: user.id });
      await ctx.newPasskey({ userId: otherUser.id });

      await expect(sut.search(factory.auth({ user }), {})).resolves.toEqual([
        expect.objectContaining({ id: passkey.id, name: passkey.name, usedAt: null }),
      ]);
    });

    it('should filter by id', async () => {
      const { sut, ctx } = setup();
      const { user } = await ctx.newUser();
      const { passkey } = await ctx.newPasskey({ userId: user.id });
      await ctx.newPasskey({ userId: user.id });

      await expect(sut.search(factory.auth({ user }), { id: passkey.id })).resolves.toEqual([
        expect.objectContaining({ id: passkey.id }),
      ]);
    });
  });

  describe('get', () => {
    it('should reject the passkey of another user', async () => {
      const { sut, ctx } = setup();
      const { user } = await ctx.newUser();
      const { user: otherUser } = await ctx.newUser();
      const { passkey } = await ctx.newPasskey({ userId: otherUser.id });

      await expect(sut.get(factory.auth({ user }), passkey.id)).rejects.toThrow('Not found or no passkey.read access');
    });

    it('should get a passkey', async () => {
      const { sut, ctx } = setup();
      const { user } = await ctx.newUser();
      const { passkey } = await ctx.newPasskey({ userId: user.id });

      await expect(sut.get(factory.auth({ user }), passkey.id)).resolves.toEqual({
        id: passkey.id,
        name: passkey.name,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
        usedAt: null,
      });
    });
  });

  describe('update', () => {
    it('should reject the passkey of another user', async () => {
      const { sut, ctx } = setup();
      const { user } = await ctx.newUser();
      const { user: otherUser } = await ctx.newUser();
      const { passkey } = await ctx.newPasskey({ userId: otherUser.id });

      await expect(sut.update(factory.auth({ user }), passkey.id, { name: 'Renamed' })).rejects.toThrow(
        'Not found or no passkey.update access',
      );
    });

    it('should rename a passkey', async () => {
      const { sut, ctx } = setup();
      const { user } = await ctx.newUser();
      const { passkey } = await ctx.newPasskey({ userId: user.id });

      await expect(sut.update(factory.auth({ user }), passkey.id, { name: 'Renamed' })).resolves.toEqual(
        expect.objectContaining({ id: passkey.id, name: 'Renamed' }),
      );
      await expect(ctx.get(PasskeyRepository).get(passkey.id)).resolves.toEqual(
        expect.objectContaining({ name: 'Renamed' }),
      );
    });
  });

  describe('delete', () => {
    it('should reject the passkey of another user', async () => {
      const { sut, ctx } = setup();
      const { user } = await ctx.newUser();
      const { user: otherUser } = await ctx.newUser();
      const { passkey } = await ctx.newPasskey({ userId: otherUser.id });

      await expect(sut.delete(factory.auth({ user }), passkey.id)).rejects.toThrow(
        'Not found or no passkey.delete access',
      );
      await expect(ctx.get(PasskeyRepository).get(passkey.id)).resolves.toEqual(
        expect.objectContaining({ id: passkey.id }),
      );
    });

    it('should delete a passkey', async () => {
      const { sut, ctx } = setup();
      const { user } = await ctx.newUser();
      const { passkey } = await ctx.newPasskey({ userId: user.id });

      await sut.delete(factory.auth({ user }), passkey.id);

      await expect(ctx.get(PasskeyRepository).get(passkey.id)).resolves.toBeUndefined();
    });
  });
});
