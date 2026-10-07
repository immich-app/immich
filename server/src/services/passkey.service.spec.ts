import { BadRequestException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { VerifiedAuthenticationResponse, VerifiedRegistrationResponse } from '@simplewebauthn/server';
import { InsertResult } from 'kysely';
import { AuthChallengeType, JobStatus } from 'src/enum.js';
import { PasskeyService } from 'src/services/passkey.service.js';
import { AuthFactory } from 'test/factories/auth.factory.js';
import { PasskeyFactory } from 'test/factories/passkey.factory.js';
import { SessionFactory } from 'test/factories/session.factory.js';
import { UserFactory } from 'test/factories/user.factory.js';
import { newUuid } from 'test/small.factory.js';
import { ServiceMocks, newTestService } from 'test/utils.js';

const loginDetails = {
  isSecure: true,
  clientIp: '127.0.0.1',
  deviceOS: '',
  deviceType: '',
  appVersion: null,
};

const headers = { origin: 'https://immich.example' };

const registrationOptions = {
  rp: { id: 'immich.example', name: 'Immich' },
  user: { id: 'user-handle', name: 'user@immich.cloud', displayName: 'User' },
  challenge: 'challenge',
  pubKeyCredParams: [{ alg: -7, type: 'public-key' as const }],
};

const authenticationOptions = {
  challenge: 'challenge',
  rpId: 'immich.example',
};

const registrationResponse = {
  id: 'credential-id',
  rawId: 'credential-id',
  type: 'public-key' as const,
  clientExtensionResults: {},
  response: {
    clientDataJSON: 'client-data',
    attestationObject: 'attestation-object',
    transports: ['internal'],
  },
};

const registrationResult: VerifiedRegistrationResponse = {
  verified: true,
  registrationInfo: {
    fmt: 'none',
    aaguid: '00000000-0000-0000-0000-000000000000',
    credential: {
      id: 'credential-id',
      publicKey: new Uint8Array([1, 2, 3]),
      counter: 0,
      transports: ['internal'],
    },
    credentialType: 'public-key',
    attestationObject: new Uint8Array(),
    userVerified: true,
    credentialDeviceType: 'multiDevice',
    credentialBackedUp: true,
    origin: 'https://immich.example',
  },
};

const authenticationResult: VerifiedAuthenticationResponse = {
  verified: true,
  authenticationInfo: {
    credentialID: 'credential-id',
    newCounter: 5,
    userVerified: true,
    credentialDeviceType: 'multiDevice',
    credentialBackedUp: true,
    origin: 'https://immich.example',
    rpID: 'immich.example',
  },
};

const newAuthenticationResponse = (userId?: string) => ({
  id: 'credential-id',
  rawId: 'credential-id',
  type: 'public-key' as const,
  clientExtensionResults: {},
  response: {
    clientDataJSON: 'client-data',
    authenticatorData: 'authenticator-data',
    signature: 'signature',
    userHandle: userId ? Buffer.from(userId).toString('base64url') : undefined,
  },
});

describe(PasskeyService.name, () => {
  let sut: PasskeyService;
  let mocks: ServiceMocks;

  beforeEach(() => {
    ({ sut, mocks } = newTestService(PasskeyService));
    mocks.systemMetadata.get.mockResolvedValue({
      passkey: { enabled: true, domain: 'https://immich.example', additionalDomains: [] },
    });
    mocks.authChallenge.create.mockResolvedValue(new InsertResult(void 0, 1n));
    mocks.authChallenge.consume.mockResolvedValue({ id: newUuid(), userId: null });
  });

  describe('handleCleanup', () => {
    it('should delete expired challenges', async () => {
      mocks.authChallenge.deleteExpired.mockResolvedValue(3);

      await expect(sut.handleCleanup()).resolves.toBe(JobStatus.Success);

      expect(mocks.authChallenge.deleteExpired).toHaveBeenCalled();
    });
  });

  describe('startRegistration', () => {
    it('should require a session', async () => {
      await expect(sut.startRegistration(AuthFactory.create(), headers)).rejects.toBeInstanceOf(BadRequestException);

      expect(mocks.webAuthn.generateRegistrationOptions).not.toHaveBeenCalled();
    });

    it('should throw an error if passkeys are disabled', async () => {
      mocks.systemMetadata.get.mockResolvedValue({ passkey: { enabled: false } });

      await expect(sut.startRegistration(AuthFactory.from().session().build(), headers)).rejects.toBeInstanceOf(
        BadRequestException,
      );

      expect(mocks.webAuthn.generateRegistrationOptions).not.toHaveBeenCalled();
    });

    it('should use the android origins when the origin header is missing', async () => {
      mocks.passkey.search.mockResolvedValue([]);
      mocks.webAuthn.generateRegistrationOptions.mockResolvedValue(registrationOptions);

      await expect(sut.startRegistration(AuthFactory.from().session().build(), {})).resolves.toEqual(
        registrationOptions,
      );

      expect(mocks.webAuthn.generateRegistrationOptions).toHaveBeenCalledWith(
        expect.objectContaining({ rpID: 'my.immich.app' }),
      );
    });

    it('should use the origin hostname when no relying party ID is configured', async () => {
      mocks.systemMetadata.get.mockResolvedValue({ passkey: { enabled: true, domain: null, additionalDomains: [] } });
      mocks.authChallenge.create.mockResolvedValue(new InsertResult(void 0, 1n));
      mocks.authChallenge.consume.mockResolvedValue({ id: newUuid(), userId: null });
      mocks.passkey.search.mockResolvedValue([]);
      mocks.webAuthn.generateRegistrationOptions.mockResolvedValue(registrationOptions);

      await expect(
        sut.startRegistration(AuthFactory.from().session().build(), { origin: 'https://photos.immich.example' }),
      ).resolves.toEqual(registrationOptions);

      expect(mocks.webAuthn.generateRegistrationOptions).toHaveBeenCalledWith(
        expect.objectContaining({ rpID: 'photos.immich.example' }),
      );
    });

    it('should reject an invalid origin header', async () => {
      await expect(
        sut.startRegistration(AuthFactory.from().session().build(), { origin: 'not a url' }),
      ).rejects.toThrow('Origin header is invalid');

      expect(mocks.webAuthn.generateRegistrationOptions).not.toHaveBeenCalled();
    });

    it('should reject an origin that is not trusted', async () => {
      await expect(
        sut.startRegistration(AuthFactory.from().session().build(), { origin: 'https://evil.example' }),
      ).rejects.toThrow('Origin is not trusted');

      expect(mocks.webAuthn.generateRegistrationOptions).not.toHaveBeenCalled();
    });

    it('should reject a subdomain of the relying party that is not listed', async () => {
      await expect(
        sut.startRegistration(AuthFactory.from().session().build(), { origin: 'https://photos.immich.example' }),
      ).rejects.toThrow('Origin is not trusted');

      expect(mocks.webAuthn.generateRegistrationOptions).not.toHaveBeenCalled();
    });

    it('should accept the relying party on any port', async () => {
      mocks.passkey.search.mockResolvedValue([]);
      mocks.webAuthn.generateRegistrationOptions.mockResolvedValue(registrationOptions);

      await expect(
        sut.startRegistration(AuthFactory.from().session().build(), { origin: 'https://immich.example:2283' }),
      ).resolves.toEqual(registrationOptions);
    });

    it('should accept a trusted origin', async () => {
      mocks.systemMetadata.get.mockResolvedValue({
        passkey: {
          enabled: true,
          domain: 'https://immich.example',
          additionalDomains: ['https://immich.tailnet.example/'],
        },
      });
      mocks.passkey.search.mockResolvedValue([]);
      mocks.webAuthn.generateRegistrationOptions.mockResolvedValue(registrationOptions);

      await expect(
        sut.startRegistration(AuthFactory.from().session().build(), { origin: 'https://immich.tailnet.example' }),
      ).resolves.toEqual(registrationOptions);

      expect(mocks.webAuthn.generateRegistrationOptions).toHaveBeenCalledWith(
        expect.objectContaining({ rpID: 'immich.example' }),
      );
    });

    it('should generate registration options', async () => {
      const auth = AuthFactory.from().session().build();
      const passkey = PasskeyFactory.create({ userId: auth.user.id });

      mocks.passkey.search.mockResolvedValue([passkey]);
      mocks.webAuthn.generateRegistrationOptions.mockResolvedValue(registrationOptions);

      await expect(sut.startRegistration(auth, headers)).resolves.toEqual(registrationOptions);

      expect(mocks.passkey.search).toHaveBeenCalledWith({ userId: auth.user.id });
      expect(mocks.authChallenge.create).toHaveBeenCalledWith({
        type: AuthChallengeType.PasskeyRegistration,
        challenge: registrationOptions.challenge,
        userId: auth.user.id,
        expiresAt: expect.any(Date),
      });
      expect(mocks.webAuthn.generateRegistrationOptions).toHaveBeenCalledWith(
        expect.objectContaining({
          rpID: 'immich.example',
          userName: auth.user.email,
          userDisplayName: auth.user.name,
          excludeCredentials: [{ id: passkey.credentialId, transports: passkey.transports }],
          authenticatorSelection: { residentKey: 'required', userVerification: 'required' },
        }),
      );
    });
  });

  describe('finishRegistration', () => {
    it('should require a session', async () => {
      await expect(
        sut.finishRegistration(AuthFactory.create(), { response: registrationResponse }, headers, loginDetails),
      ).rejects.toBeInstanceOf(BadRequestException);

      expect(mocks.webAuthn.verifyRegistrationResponse).not.toHaveBeenCalled();
    });

    it('should throw an error if passkeys are disabled', async () => {
      mocks.systemMetadata.get.mockResolvedValue({ passkey: { enabled: false } });

      await expect(
        sut.finishRegistration(
          AuthFactory.from().session().build(),
          { response: registrationResponse },
          headers,
          loginDetails,
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('should reject an invalid response', async () => {
      mocks.webAuthn.verifyRegistrationResponse.mockRejectedValue(new Error('Invalid signature'));

      await expect(
        sut.finishRegistration(
          AuthFactory.from().session().build(),
          { response: registrationResponse },
          headers,
          loginDetails,
        ),
      ).rejects.toBeInstanceOf(BadRequestException);

      expect(mocks.passkey.create).not.toHaveBeenCalled();
    });

    it('should reject an unverified response', async () => {
      mocks.webAuthn.verifyRegistrationResponse.mockResolvedValue({ verified: false });

      await expect(
        sut.finishRegistration(
          AuthFactory.from().session().build(),
          { response: registrationResponse },
          headers,
          loginDetails,
        ),
      ).rejects.toBeInstanceOf(BadRequestException);

      expect(mocks.passkey.create).not.toHaveBeenCalled();
    });

    it('should reject a credential that is already registered', async () => {
      mocks.webAuthn.verifyRegistrationResponse.mockResolvedValue(registrationResult);
      mocks.passkey.getByCredentialId.mockResolvedValue(PasskeyFactory.create());

      await expect(
        sut.finishRegistration(
          AuthFactory.from().session().build(),
          { response: registrationResponse },
          headers,
          loginDetails,
        ),
      ).rejects.toBeInstanceOf(BadRequestException);

      expect(mocks.passkey.create).not.toHaveBeenCalled();
    });

    it('should verify against the android app origins when the origin header is missing', async () => {
      const auth = AuthFactory.from().session().build();
      const passkey = PasskeyFactory.create({ userId: auth.user.id });

      mocks.webAuthn.verifyRegistrationResponse.mockResolvedValue(registrationResult);
      mocks.passkey.getByCredentialId.mockResolvedValue(void 0);
      mocks.passkey.create.mockResolvedValue(passkey);

      await expect(sut.finishRegistration(auth, { response: registrationResponse }, {}, loginDetails)).resolves.toEqual(
        expect.objectContaining({ id: passkey.id }),
      );

      expect(mocks.webAuthn.verifyRegistrationResponse).toHaveBeenCalledWith(
        expect.objectContaining({
          expectedOrigin: [
            'android:apk-key-hash:hsXEVd-vSYWSOo81rbMdDJ4LlX1_lMLSr2okOKqWACA',
            'android:apk-key-hash:WiLBg0dUBfVJxOufsmwuk6PvnFdmFQp684yNP-UVzNY',
          ],
          expectedRPID: 'my.immich.app',
        }),
      );
    });

    it('should consume a challenge issued to the user', async () => {
      const auth = AuthFactory.from().session().build();
      mocks.webAuthn.verifyRegistrationResponse.mockResolvedValue(registrationResult);
      mocks.passkey.getByCredentialId.mockResolvedValue(void 0);
      mocks.passkey.create.mockResolvedValue(PasskeyFactory.create({ userId: auth.user.id }));
      mocks.authChallenge.consume.mockResolvedValue({ id: newUuid(), userId: auth.user.id });

      await sut.finishRegistration(auth, { response: registrationResponse }, headers, loginDetails);

      const { expectedChallenge } = mocks.webAuthn.verifyRegistrationResponse.mock.calls[0][0];
      await expect((expectedChallenge as (challenge: string) => Promise<boolean>)('challenge')).resolves.toBe(true);
      expect(mocks.authChallenge.consume).toHaveBeenCalledWith({
        type: AuthChallengeType.PasskeyRegistration,
        challenge: 'challenge',
      });
    });

    it('should reject a challenge issued to another user', async () => {
      const auth = AuthFactory.from().session().build();
      mocks.webAuthn.verifyRegistrationResponse.mockResolvedValue(registrationResult);
      mocks.passkey.getByCredentialId.mockResolvedValue(void 0);
      mocks.passkey.create.mockResolvedValue(PasskeyFactory.create({ userId: auth.user.id }));
      mocks.authChallenge.consume.mockResolvedValue({ id: newUuid(), userId: newUuid() });

      await sut.finishRegistration(auth, { response: registrationResponse }, headers, loginDetails);

      const { expectedChallenge } = mocks.webAuthn.verifyRegistrationResponse.mock.calls[0][0];
      await expect((expectedChallenge as (challenge: string) => Promise<boolean>)('challenge')).resolves.toBe(false);
    });

    it('should reject an unknown challenge', async () => {
      const auth = AuthFactory.from().session().build();
      mocks.webAuthn.verifyRegistrationResponse.mockResolvedValue(registrationResult);
      mocks.passkey.getByCredentialId.mockResolvedValue(void 0);
      mocks.passkey.create.mockResolvedValue(PasskeyFactory.create({ userId: auth.user.id }));
      mocks.authChallenge.consume.mockResolvedValue(void 0);

      await sut.finishRegistration(auth, { response: registrationResponse }, headers, loginDetails);

      const { expectedChallenge } = mocks.webAuthn.verifyRegistrationResponse.mock.calls[0][0];
      await expect((expectedChallenge as (challenge: string) => Promise<boolean>)('challenge')).resolves.toBe(false);
    });

    it('should create a passkey', async () => {
      const auth = AuthFactory.from().session().build();
      const passkey = PasskeyFactory.create({ userId: auth.user.id, name: 'My passkey' });

      mocks.webAuthn.verifyRegistrationResponse.mockResolvedValue(registrationResult);
      mocks.passkey.getByCredentialId.mockResolvedValue(void 0);
      mocks.passkey.create.mockResolvedValue(passkey);

      await expect(
        sut.finishRegistration(auth, { name: 'My passkey', response: registrationResponse }, headers, loginDetails),
      ).resolves.toEqual({
        id: passkey.id,
        name: passkey.name,
        createdAt: passkey.createdAt,
        updatedAt: passkey.updatedAt,
        usedAt: passkey.usedAt,
      });

      expect(mocks.webAuthn.verifyRegistrationResponse).toHaveBeenCalledWith({
        response: registrationResponse,
        expectedChallenge: expect.any(Function),
        expectedOrigin: 'https://immich.example',
        expectedRPID: 'immich.example',
      });
      expect(mocks.passkey.create).toHaveBeenCalledWith({
        userId: auth.user.id,
        name: 'My passkey',
        credentialId: 'credential-id',
        publicKey: Buffer.from([1, 2, 3]),
        counter: 0,
        transports: ['internal'],
        backedUp: true,
        deviceType: 'multiDevice',
      });
    });

    it('should use a default name', async () => {
      const auth = AuthFactory.from().session().build();

      mocks.webAuthn.verifyRegistrationResponse.mockResolvedValue(registrationResult);
      mocks.passkey.getByCredentialId.mockResolvedValue(void 0);
      mocks.passkey.create.mockResolvedValue(PasskeyFactory.create({ userId: auth.user.id }));

      await sut.finishRegistration(auth, { response: registrationResponse }, headers, loginDetails);

      expect(mocks.passkey.create).toHaveBeenCalledWith(expect.objectContaining({ name: 'Passkey' }));
    });

    it('should name the passkey after a known authenticator', async () => {
      const auth = AuthFactory.from().session().build();

      mocks.webAuthn.verifyRegistrationResponse.mockResolvedValue({
        ...registrationResult,
        registrationInfo: { ...registrationResult.registrationInfo, aaguid: 'fbfc3007-154e-4ecc-8c0b-6e020557d7bd' },
      });
      mocks.passkey.getByCredentialId.mockResolvedValue(void 0);
      mocks.passkey.create.mockResolvedValue(PasskeyFactory.create({ userId: auth.user.id }));

      await sut.finishRegistration(auth, { response: registrationResponse }, headers, loginDetails);

      expect(mocks.passkey.create).toHaveBeenCalledWith(expect.objectContaining({ name: 'Apple Passwords' }));
    });

    it('should name the passkey after the device for an unknown authenticator', async () => {
      const auth = AuthFactory.from().session().build();

      mocks.webAuthn.verifyRegistrationResponse.mockResolvedValue(registrationResult);
      mocks.passkey.getByCredentialId.mockResolvedValue(void 0);
      mocks.passkey.create.mockResolvedValue(PasskeyFactory.create({ userId: auth.user.id }));

      await sut.finishRegistration(auth, { response: registrationResponse }, headers, {
        ...loginDetails,
        deviceType: 'Chrome',
        deviceOS: 'Linux',
      });

      expect(mocks.passkey.create).toHaveBeenCalledWith(expect.objectContaining({ name: 'Chrome on Linux' }));
    });
  });

  describe('startAuthentication', () => {
    it('should throw an error if passkeys are disabled', async () => {
      mocks.systemMetadata.get.mockResolvedValue({ passkey: { enabled: false } });

      await expect(sut.startAuthentication(headers)).rejects.toBeInstanceOf(BadRequestException);
    });

    it('should generate authentication options', async () => {
      mocks.webAuthn.generateAuthenticationOptions.mockResolvedValue(authenticationOptions);

      await expect(sut.startAuthentication(headers)).resolves.toEqual(authenticationOptions);

      expect(mocks.authChallenge.create).toHaveBeenCalledWith({
        type: AuthChallengeType.PasskeyAuthentication,
        challenge: authenticationOptions.challenge,
        userId: null,
        expiresAt: expect.any(Date),
      });

      expect(mocks.webAuthn.generateAuthenticationOptions).toHaveBeenCalledWith({
        rpID: 'immich.example',
        userVerification: 'required',
      });
    });
  });

  describe('finishAuthentication', () => {
    it('should throw an error if passkeys are disabled', async () => {
      mocks.systemMetadata.get.mockResolvedValue({ passkey: { enabled: false } });

      await expect(
        sut.finishAuthentication({ response: newAuthenticationResponse() }, headers, loginDetails),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('should reject an unknown credential', async () => {
      mocks.passkey.getByCredentialId.mockResolvedValue(void 0);

      await expect(
        sut.finishAuthentication({ response: newAuthenticationResponse() }, headers, loginDetails),
      ).rejects.toBeInstanceOf(UnauthorizedException);

      expect(mocks.webAuthn.verifyAuthenticationResponse).not.toHaveBeenCalled();
    });

    it('should reject a user handle that does not match the credential', async () => {
      mocks.passkey.getByCredentialId.mockResolvedValue(PasskeyFactory.create());

      await expect(
        sut.finishAuthentication({ response: newAuthenticationResponse(newUuid()) }, headers, loginDetails),
      ).rejects.toBeInstanceOf(UnauthorizedException);

      expect(mocks.webAuthn.verifyAuthenticationResponse).not.toHaveBeenCalled();
    });

    it('should reject an invalid response', async () => {
      mocks.passkey.getByCredentialId.mockResolvedValue(PasskeyFactory.create());
      mocks.webAuthn.verifyAuthenticationResponse.mockRejectedValue(new Error('Invalid signature'));

      await expect(
        sut.finishAuthentication({ response: newAuthenticationResponse() }, headers, loginDetails),
      ).rejects.toBeInstanceOf(UnauthorizedException);

      expect(mocks.session.create).not.toHaveBeenCalled();
    });

    it('should reject an unverified response', async () => {
      mocks.passkey.getByCredentialId.mockResolvedValue(PasskeyFactory.create());
      mocks.webAuthn.verifyAuthenticationResponse.mockResolvedValue({ ...authenticationResult, verified: false });

      await expect(
        sut.finishAuthentication({ response: newAuthenticationResponse() }, headers, loginDetails),
      ).rejects.toBeInstanceOf(UnauthorizedException);

      expect(mocks.session.create).not.toHaveBeenCalled();
    });

    it('should reject a passkey of a deleted user', async () => {
      mocks.passkey.getByCredentialId.mockResolvedValue(PasskeyFactory.create());
      mocks.webAuthn.verifyAuthenticationResponse.mockResolvedValue(authenticationResult);
      mocks.user.get.mockResolvedValue(void 0);

      await expect(
        sut.finishAuthentication({ response: newAuthenticationResponse() }, headers, loginDetails),
      ).rejects.toBeInstanceOf(UnauthorizedException);

      expect(mocks.session.create).not.toHaveBeenCalled();
    });

    it('should log the user in', async () => {
      const user = UserFactory.create();
      const passkey = PasskeyFactory.create({ userId: user.id, counter: 4 });

      mocks.passkey.getByCredentialId.mockResolvedValue(passkey);
      mocks.webAuthn.verifyAuthenticationResponse.mockResolvedValue(authenticationResult);
      mocks.user.get.mockResolvedValue(user);
      mocks.passkey.update.mockResolvedValue(passkey);
      mocks.session.create.mockResolvedValue(SessionFactory.create({ userId: user.id }));

      await expect(
        sut.finishAuthentication({ response: newAuthenticationResponse(user.id) }, headers, loginDetails),
      ).resolves.toEqual({
        accessToken: 'cmFuZG9tLWJ5dGVz',
        userId: user.id,
        userEmail: user.email,
        name: user.name,
        profileImagePath: user.profileImagePath,
        isAdmin: user.isAdmin,
        isOnboarded: false,
        shouldChangePassword: user.shouldChangePassword,
      });

      expect(mocks.webAuthn.verifyAuthenticationResponse).toHaveBeenCalledWith({
        response: newAuthenticationResponse(user.id),
        expectedChallenge: expect.any(Function),
        expectedOrigin: 'https://immich.example',
        expectedRPID: 'immich.example',
        credential: {
          id: passkey.credentialId,
          publicKey: new Uint8Array(passkey.publicKey),
          counter: 4,
          transports: passkey.transports,
        },
      });
      expect(mocks.passkey.update).toHaveBeenCalledWith(passkey.id, { counter: 5, usedAt: expect.any(Date) });
      expect(mocks.session.create).toHaveBeenCalledWith(expect.objectContaining({ userId: user.id }));
    });
  });

  describe('getWellKnown', () => {
    it('should throw an error if passkeys are disabled', async () => {
      mocks.systemMetadata.get.mockResolvedValue({ passkey: { enabled: false } });

      await expect(sut.getWellKnown()).rejects.toBeInstanceOf(NotFoundException);
    });

    it('should return the relying party and trusted origins', async () => {
      mocks.systemMetadata.get.mockResolvedValue({
        passkey: {
          enabled: true,
          domain: 'https://immich.example/',
          additionalDomains: ['https://immich.tailnet.example/', 'https://photos.immich.example'],
        },
      });

      await expect(sut.getWellKnown()).resolves.toEqual({
        origins: ['https://immich.example', 'https://immich.tailnet.example', 'https://photos.immich.example'],
      });
    });
  });

  describe('search', () => {
    it('should search the passkeys of the current user', async () => {
      const auth = AuthFactory.create();
      const passkey = PasskeyFactory.create({ userId: auth.user.id });

      mocks.passkey.search.mockResolvedValue([passkey]);

      await expect(sut.search(auth, { id: passkey.id })).resolves.toEqual([
        {
          id: passkey.id,
          name: passkey.name,
          createdAt: passkey.createdAt,
          updatedAt: passkey.updatedAt,
          usedAt: passkey.usedAt,
        },
      ]);

      expect(mocks.passkey.search).toHaveBeenCalledWith({ id: passkey.id, userId: auth.user.id });
    });
  });

  describe('get', () => {
    it('should require access', async () => {
      await expect(sut.get(AuthFactory.create(), newUuid())).rejects.toBeInstanceOf(BadRequestException);

      expect(mocks.passkey.get).not.toHaveBeenCalled();
    });

    it('should get a passkey', async () => {
      const auth = AuthFactory.create();
      const passkey = PasskeyFactory.create({ userId: auth.user.id });

      mocks.access.passkey.checkOwnerAccess.mockResolvedValue(new Set([passkey.id]));
      mocks.passkey.get.mockResolvedValue(passkey);

      await expect(sut.get(auth, passkey.id)).resolves.toEqual(expect.objectContaining({ id: passkey.id }));

      expect(mocks.access.passkey.checkOwnerAccess).toHaveBeenCalledWith(auth.user.id, new Set([passkey.id]));
      expect(mocks.passkey.get).toHaveBeenCalledWith(passkey.id);
    });
  });

  describe('update', () => {
    it('should require access', async () => {
      await expect(sut.update(AuthFactory.create(), newUuid(), { name: 'New name' })).rejects.toBeInstanceOf(
        BadRequestException,
      );

      expect(mocks.passkey.update).not.toHaveBeenCalled();
    });

    it('should update a passkey', async () => {
      const auth = AuthFactory.create();
      const passkey = PasskeyFactory.create({ userId: auth.user.id });

      mocks.access.passkey.checkOwnerAccess.mockResolvedValue(new Set([passkey.id]));
      mocks.passkey.update.mockResolvedValue({ ...passkey, name: 'New name' });

      await expect(sut.update(auth, passkey.id, { name: 'New name' })).resolves.toEqual(
        expect.objectContaining({ id: passkey.id, name: 'New name' }),
      );

      expect(mocks.passkey.update).toHaveBeenCalledWith(passkey.id, { name: 'New name' });
    });
  });

  describe('delete', () => {
    it('should require access', async () => {
      await expect(sut.delete(AuthFactory.create(), newUuid())).rejects.toBeInstanceOf(BadRequestException);

      expect(mocks.passkey.delete).not.toHaveBeenCalled();
    });

    it('should delete a passkey', async () => {
      const auth = AuthFactory.create();
      const passkey = PasskeyFactory.create({ userId: auth.user.id });

      mocks.access.passkey.checkOwnerAccess.mockResolvedValue(new Set([passkey.id]));
      mocks.passkey.delete.mockResolvedValue();

      await sut.delete(auth, passkey.id);

      expect(mocks.passkey.delete).toHaveBeenCalledWith(passkey.id);
    });
  });
});
