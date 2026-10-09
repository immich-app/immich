import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { DateTime, Duration } from 'luxon';
import { IncomingHttpHeaders } from 'node:http';
import type { AuthenticationResponseJSON, RegistrationResponseJSON } from '@simplewebauthn/server';
import type { LoginDetails } from 'src/services/auth.service.js';
import { OnJob } from 'src/decorators.js';
import { AuthDto, LoginResponseDto } from 'src/dtos/auth.dto.js';
import { SystemConfig } from 'src/dtos/config.dto.js';
import {
  PasskeyAuthenticationFinishDto,
  PasskeyAuthenticationOptionsDto,
  PasskeyRegistrationFinishDto,
  PasskeyRegistrationOptionsDto,
  PasskeyResponseDto,
  PasskeySearchDto,
  PasskeyUpdateDto,
  mapPasskey,
} from 'src/dtos/passkey.dto.js';
import { AuthChallengeType, JobName, JobStatus, Permission, QueueName } from 'src/enum.js';
import { BaseService } from 'src/services/base.service.js';
import { findOrFail } from 'src/utils/misc.js';
import { getPasskeyName } from 'src/utils/passkey.js';

const RP_NAME = 'Immich';

const CHALLENGE_TTL = Duration.fromObject({ minutes: 5 });

const MOBILE_RP_ID = 'my.immich.app';

// keep in sync with https://my.immich.app/.well-known/assetlinks.json
const ANDROID_CERTIFICATE_FINGERPRINTS = [
  '86:C5:C4:55:DF:AF:49:85:92:3A:8F:35:AD:B3:1D:0C:9E:0B:95:7D:7F:94:C2:D2:AF:6A:24:38:AA:96:00:20',
  '5A:22:C1:83:47:54:05:F5:49:C4:EB:9F:B2:6C:2E:93:A3:EF:9C:57:66:15:0A:7A:F3:8C:8D:3F:E5:15:CC:D6',
];

const ANDROID_ORIGINS = ANDROID_CERTIFICATE_FINGERPRINTS.map(
  (fingerprint) => `android:apk-key-hash:${Buffer.from(fingerprint.replaceAll(':', ''), 'hex').toString('base64url')}`,
);

@Injectable()
export class PasskeyService extends BaseService {
  async startRegistration(auth: AuthDto, headers: IncomingHttpHeaders): Promise<PasskeyRegistrationOptionsDto> {
    this.requireSession(auth);
    const config = await this.requireEnabled();

    const { rpId } = this.getRelyingParty(config, headers);
    const passkeys = await this.passkeyRepository.search({ userId: auth.user.id });

    const options = await this.webAuthnRepository.generateRegistrationOptions({
      rpName: RP_NAME,
      rpID: rpId,
      userID: new TextEncoder().encode(auth.user.id),
      userName: auth.user.email,
      userDisplayName: auth.user.name,
      attestationType: 'none',
      excludeCredentials: passkeys.map(({ credentialId, transports }) => ({ id: credentialId, transports })),
      authenticatorSelection: { residentKey: 'required', userVerification: 'required' },
    });

    await this.authChallengeRepository.create({
      type: AuthChallengeType.PasskeyRegistration,
      challenge: options.challenge,
      userId: auth.user.id,
      expiresAt: DateTime.now().plus(CHALLENGE_TTL).toJSDate(),
    });

    return options;
  }

  async finishRegistration(
    auth: AuthDto,
    dto: PasskeyRegistrationFinishDto,
    headers: IncomingHttpHeaders,
    loginDetails: LoginDetails,
  ): Promise<PasskeyResponseDto> {
    this.requireSession(auth);
    const config = await this.requireEnabled();

    const { rpId, origin } = this.getRelyingParty(config, headers);

    const result = await this.webAuthnRepository
      .verifyRegistrationResponse({
        response: dto.response as RegistrationResponseJSON,
        expectedChallenge: async (challenge) => {
          const record = await this.authChallengeRepository.consume({
            type: AuthChallengeType.PasskeyRegistration,
            challenge,
          });
          return record?.userId === auth.user.id;
        },
        expectedOrigin: origin,
        expectedRPID: rpId,
      })
      .catch((error: Error) => {
        this.logger.warn(`Passkey registration failed for user ${auth.user.id}: ${error.message}`);
        throw new BadRequestException('Passkey registration failed');
      });

    if (!result.verified) {
      throw new BadRequestException('Passkey registration failed');
    }

    const { aaguid, credential, credentialBackedUp, credentialDeviceType } = result.registrationInfo;

    const duplicate = await this.passkeyRepository.getByCredentialId(credential.id);
    if (duplicate) {
      throw new BadRequestException('Passkey is already registered');
    }

    const passkey = await this.passkeyRepository.create({
      userId: auth.user.id,
      name: dto.name || getPasskeyName(aaguid, loginDetails),
      credentialId: credential.id,
      publicKey: Buffer.from(credential.publicKey),
      counter: credential.counter,
      transports: credential.transports ?? [],
      backedUp: credentialBackedUp,
      deviceType: credentialDeviceType,
    });

    return mapPasskey(passkey);
  }

  async startAuthentication(headers: IncomingHttpHeaders): Promise<PasskeyAuthenticationOptionsDto> {
    const config = await this.requireEnabled();

    const { rpId } = this.getRelyingParty(config, headers);

    const options = await this.webAuthnRepository.generateAuthenticationOptions({
      rpID: rpId,
      userVerification: 'required',
    });

    await this.authChallengeRepository.create({
      type: AuthChallengeType.PasskeyAuthentication,
      challenge: options.challenge,
      userId: null,
      expiresAt: DateTime.now().plus(CHALLENGE_TTL).toJSDate(),
    });

    return options;
  }

  async finishAuthentication(
    dto: PasskeyAuthenticationFinishDto,
    headers: IncomingHttpHeaders,
    loginDetails: LoginDetails,
  ): Promise<LoginResponseDto> {
    const config = await this.requireEnabled();

    const { rpId, origin } = this.getRelyingParty(config, headers);

    const passkey = await this.passkeyRepository.getByCredentialId(dto.response.id);
    const userHandle = dto.response.response.userHandle;
    const userId = userHandle ? Buffer.from(userHandle, 'base64url').toString() : undefined;
    if (!passkey || (userId && userId !== passkey.userId)) {
      this.logger.warn(`Failed passkey login attempt from ip address ${loginDetails.clientIp}`);
      throw new UnauthorizedException('Invalid passkey');
    }

    const result = await this.webAuthnRepository
      .verifyAuthenticationResponse({
        response: dto.response as AuthenticationResponseJSON,
        expectedChallenge: async (challenge) => {
          const record = await this.authChallengeRepository.consume({
            type: AuthChallengeType.PasskeyAuthentication,
            challenge,
          });
          return !!record;
        },
        expectedOrigin: origin,
        expectedRPID: rpId,
        credential: {
          id: passkey.credentialId,
          publicKey: new Uint8Array(passkey.publicKey),
          counter: passkey.counter,
          transports: passkey.transports,
        },
      })
      .catch((error: Error) => {
        this.logger.warn(`Failed passkey login attempt from ip address ${loginDetails.clientIp}: ${error.message}`);
        throw new UnauthorizedException('Invalid passkey');
      });

    if (!result.verified) {
      throw new UnauthorizedException('Invalid passkey');
    }

    const user = await this.userRepository.get(passkey.userId, {});
    if (!user) {
      throw new UnauthorizedException('Invalid passkey');
    }

    await this.passkeyRepository.update(passkey.id, {
      counter: result.authenticationInfo.newCounter,
      usedAt: new Date(),
    });

    return this.createLoginResponse(user, loginDetails);
  }

  async search(auth: AuthDto, dto: PasskeySearchDto): Promise<PasskeyResponseDto[]> {
    const passkeys = await this.passkeyRepository.search({ id: dto.id, userId: auth.user.id });
    return passkeys.map((passkey) => mapPasskey(passkey));
  }

  async get(auth: AuthDto, id: string): Promise<PasskeyResponseDto> {
    await this.requireAccess({ auth, permission: Permission.PasskeyRead, ids: [id] });
    const passkey = await findOrFail(() => this.passkeyRepository.get(id), 'Passkey');
    return mapPasskey(passkey);
  }

  async update(auth: AuthDto, id: string, dto: PasskeyUpdateDto): Promise<PasskeyResponseDto> {
    await this.requireAccess({ auth, permission: Permission.PasskeyUpdate, ids: [id] });
    const passkey = await this.passkeyRepository.update(id, { name: dto.name });
    return mapPasskey(passkey);
  }

  async delete(auth: AuthDto, id: string): Promise<void> {
    await this.requireAccess({ auth, permission: Permission.PasskeyDelete, ids: [id] });
    await this.passkeyRepository.delete(id);
  }

  private requireSession(auth: AuthDto) {
    if (!auth.session) {
      throw new BadRequestException('This endpoint can only be used with a session token');
    }
  }

  async getWellKnown(): Promise<{ origins: string[] }> {
    const { passkey } = await this.getConfig({ withCache: true });
    if (!passkey.enabled || !passkey.domain) {
      throw new NotFoundException();
    }

    return {
      origins: [passkey.domain, ...passkey.additionalDomains].map((value) => new URL(value).origin),
    };
  }

  @OnJob({ name: JobName.AuthChallengeCleanup, queue: QueueName.BackgroundTask })
  async handleCleanup(): Promise<JobStatus> {
    const count = await this.authChallengeRepository.deleteExpired();
    if (count > 0) {
      this.logger.log(`Deleted ${count} expired auth challenges`);
    }
    return JobStatus.Success;
  }

  private async requireEnabled() {
    const { passkey } = await this.getConfig({ withCache: false });
    if (!passkey.enabled) {
      throw new BadRequestException('Passkeys are disabled');
    }

    return passkey;
  }

  private getRelyingParty(
    config: SystemConfig['passkey'],
    headers: IncomingHttpHeaders,
  ): { origin: string | string[]; rpId: string } {
    const origin = headers.origin;
    // no origin implies a mobile app
    if (!origin) {
      return { origin: ANDROID_ORIGINS, rpId: MOBILE_RP_ID };
    }

    let hostname: string;
    try {
      hostname = new URL(origin).hostname;
    } catch {
      throw new BadRequestException('Origin header is invalid');
    }

    if (!config.domain) {
      return { origin, rpId: hostname };
    }

    const rpId = new URL(config.domain).hostname;
    if (hostname !== rpId && config.additionalDomains.every((value) => new URL(value).origin !== origin)) {
      throw new BadRequestException('Origin is not trusted');
    }

    return { origin, rpId };
  }
}
