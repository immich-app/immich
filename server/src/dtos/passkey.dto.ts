import { createZodDto } from '@immich/nestjs-standard-schema/zod';
import z from 'zod';
import { Passkey } from 'src/database.js';
import { isoDatetimeToDate } from 'src/validation.js';

const PasskeyRegistrationOptionsSchema = z
  .looseRecord(z.string(), z.any())
  .describe("Response returned by @simplewebauthn/server's `generateRegistrationOptions`")
  .meta({ id: 'PasskeyRegistrationOptionsDto' });

const PasskeyAuthenticationOptionsSchema = z
  .looseRecord(z.string(), z.any())
  .describe("Response returned by @simplewebauthn/server's `generateAuthenticationOptions`")
  .meta({ id: 'PasskeyAuthenticationOptionsDto' });

export class PasskeyRegistrationOptionsDto extends createZodDto(PasskeyRegistrationOptionsSchema) {}

export class PasskeyAuthenticationOptionsDto extends createZodDto(PasskeyAuthenticationOptionsSchema) {}

export class PasskeyRegistrationFinishDto extends createZodDto({
  name: z.string().optional().describe('Passkey name'),
  response: z.unknown().describe("Response returned by @simplewebauthn/browser's `startAuthentication()`"),
}) {}

export class PasskeyAuthenticationFinishDto extends createZodDto({
  response: z
    .looseObject({
      id: z.base64url().describe('Credential ID'),
      response: z.looseObject({ userHandle: z.base64url().optional().describe('User handle') }),
    })
    .describe("Response returned by @simplewebauthn/browser's `startAuthentication()`"),
}) {}

export class PasskeySearchDto extends createZodDto({
  id: z.uuidv4().optional().describe('Filter by passkey ID'),
}) {}

export class PasskeyUpdateDto extends createZodDto({
  name: z.string().min(1).nullable().describe('Passkey name'),
}) {}

export class PasskeyResponseDto extends createZodDto({
  id: z.uuidv4().describe('Passkey ID'),
  name: z.string().nullable().describe('Passkey name'),
  createdAt: isoDatetimeToDate.describe('Creation date'),
  updatedAt: isoDatetimeToDate.describe('Last update date'),
  usedAt: isoDatetimeToDate.nullable().describe('Last used date'),
}) {}

export const mapPasskey = (passkey: Passkey): PasskeyResponseDto => ({
  id: passkey.id,
  name: passkey.name,
  createdAt: passkey.createdAt,
  updatedAt: passkey.updatedAt,
  usedAt: passkey.usedAt,
});
