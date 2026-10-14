import { createZodDto } from 'nestjs-zod';
import z from 'zod';
import { Passkey } from 'src/database.js';
import { isoDatetimeToDate } from 'src/validation.js';

const CredentialTypeSchema = z.string().describe('Credential type (public-key)');
const AuthenticatorAttachmentSchema = z.string().describe('Authenticator attachment (platform, cross-platform)');
const UserVerificationSchema = z.string().describe('User verification (discouraged, preferred, required)');
const HintSchema = z.string().describe('Authenticator hint (hybrid, security-key, client-device)');

const PasskeyCredentialDescriptorSchema = z
  .object({
    id: z.string().describe('Credential ID (base64url)'),
    type: z.string().describe('Credential type'),
    transports: z.array(z.string()).optional().describe('Authenticator transports'),
  })
  .meta({ id: 'PasskeyCredentialDescriptorDto' });

const PasskeyExtensionsSchema = z
  .object({
    appid: z.string().optional().describe('App ID extension'),
    credProps: z.boolean().optional().describe('Credential properties extension'),
    hmacCreateSecret: z.boolean().optional().describe('HMAC create secret extension'),
    minPinLength: z.boolean().optional().describe('Minimum PIN length extension'),
  })
  .meta({ id: 'PasskeyExtensionsDto' });

const PasskeyExtensionResultsSchema = z
  .object({
    appid: z.boolean().optional().describe('App ID extension result'),
    credProps: z
      .object({ rk: z.boolean().optional().describe('Resident key') })
      .optional()
      .describe('Credential properties extension result'),
    hmacCreateSecret: z.boolean().optional().describe('HMAC create secret extension result'),
  })
  .meta({ id: 'PasskeyExtensionResultsDto' });

const PasskeyRegistrationOptionsSchema = z
  .object({
    rp: z
      .object({
        id: z.string().optional().describe('Relying party ID'),
        name: z.string().describe('Relying party name'),
      })
      .meta({ id: 'PasskeyRelyingPartyDto' }),
    user: z
      .object({
        id: z.string().describe('User handle (base64url)'),
        name: z.string().describe('User name'),
        displayName: z.string().describe('User display name'),
      })
      .meta({ id: 'PasskeyUserDto' }),
    challenge: z.string().describe('Challenge (base64url)'),
    pubKeyCredParams: z
      .array(
        z
          .object({
            alg: z.int().describe('COSE algorithm identifier'),
            type: CredentialTypeSchema,
          })
          .meta({ id: 'PasskeyCredentialParametersDto' }),
      )
      .describe('Supported public key algorithms'),
    timeout: z.int().optional().describe('Timeout in milliseconds'),
    excludeCredentials: z.array(PasskeyCredentialDescriptorSchema).optional().describe('Credentials to exclude'),
    authenticatorSelection: z
      .object({
        authenticatorAttachment: AuthenticatorAttachmentSchema.optional(),
        requireResidentKey: z.boolean().optional().describe('Require resident key'),
        residentKey: z.string().optional().describe('Resident key requirement (discouraged, preferred, required)'),
        userVerification: UserVerificationSchema.optional(),
      })
      .meta({ id: 'PasskeyAuthenticatorSelectionDto' })
      .optional(),
    hints: z.array(HintSchema).optional().describe('Authenticator hints'),
    attestation: z.string().optional().describe('Attestation preference (none, direct, enterprise, indirect)'),
    attestationFormats: z.array(z.string()).optional().describe('Attestation formats'),
    extensions: PasskeyExtensionsSchema.optional(),
  })
  .meta({ id: 'PasskeyRegistrationOptionsDto' });

const PasskeyAuthenticationOptionsSchema = z
  .object({
    challenge: z.string().describe('Challenge (base64url)'),
    timeout: z.int().optional().describe('Timeout in milliseconds'),
    rpId: z.string().optional().describe('Relying party ID'),
    allowCredentials: z.array(PasskeyCredentialDescriptorSchema).optional().describe('Allowed credentials'),
    userVerification: UserVerificationSchema.optional(),
    hints: z.array(HintSchema).optional().describe('Authenticator hints'),
    extensions: PasskeyExtensionsSchema.optional(),
  })
  .meta({ id: 'PasskeyAuthenticationOptionsDto' });

const PasskeyRegistrationResponseSchema = z
  .object({
    id: z.string().describe('Credential ID (base64url)'),
    rawId: z.string().describe('Raw credential ID (base64url)'),
    type: CredentialTypeSchema,
    authenticatorAttachment: AuthenticatorAttachmentSchema.optional(),
    clientExtensionResults: PasskeyExtensionResultsSchema,
    response: z
      .object({
        clientDataJSON: z.string().describe('Client data JSON (base64url)'),
        attestationObject: z.string().describe('Attestation object (base64url)'),
        authenticatorData: z.string().optional().describe('Authenticator data (base64url)'),
        transports: z.array(z.string()).optional().describe('Authenticator transports'),
        publicKeyAlgorithm: z.int().optional().describe('COSE algorithm identifier'),
        publicKey: z.string().optional().describe('Public key (base64url)'),
      })
      .meta({ id: 'PasskeyAttestationResponseDto' }),
  })
  .meta({ id: 'PasskeyRegistrationResponseDto' });

const PasskeyAuthenticationResponseSchema = z
  .object({
    id: z.string().describe('Credential ID (base64url)'),
    rawId: z.string().describe('Raw credential ID (base64url)'),
    type: CredentialTypeSchema,
    authenticatorAttachment: AuthenticatorAttachmentSchema.optional(),
    clientExtensionResults: PasskeyExtensionResultsSchema,
    response: z
      .object({
        clientDataJSON: z.string().describe('Client data JSON (base64url)'),
        authenticatorData: z.string().describe('Authenticator data (base64url)'),
        signature: z.string().describe('Signature (base64url)'),
        userHandle: z.string().optional().describe('User handle (base64url)'),
      })
      .meta({ id: 'PasskeyAssertionResponseDto' }),
  })
  .meta({ id: 'PasskeyAuthenticationResponseDto' });

const PasskeyRegistrationFinishSchema = z
  .object({
    name: z.string().optional().describe('Passkey name'),
    response: PasskeyRegistrationResponseSchema,
  })
  .meta({ id: 'PasskeyRegistrationFinishDto' });

const PasskeyAuthenticationFinishSchema = z
  .object({
    response: PasskeyAuthenticationResponseSchema,
  })
  .meta({ id: 'PasskeyAuthenticationFinishDto' });

const PasskeySearchSchema = z
  .object({
    id: z.uuidv4().optional().describe('Filter by passkey ID'),
  })
  .meta({ id: 'PasskeySearchDto' });

const PasskeyUpdateSchema = z
  .object({
    name: z.string().min(1).nullable().describe('Passkey name'),
  })
  .meta({ id: 'PasskeyUpdateDto' });

const PasskeyResponseSchema = z
  .object({
    id: z.uuidv4().describe('Passkey ID'),
    name: z.string().nullable().describe('Passkey name'),
    createdAt: isoDatetimeToDate.describe('Creation date'),
    updatedAt: isoDatetimeToDate.describe('Last update date'),
    usedAt: isoDatetimeToDate.nullable().describe('Last used date'),
  })
  .meta({ id: 'PasskeyResponseDto' });

export class PasskeyRegistrationOptionsDto extends createZodDto(PasskeyRegistrationOptionsSchema) {}
export class PasskeyAuthenticationOptionsDto extends createZodDto(PasskeyAuthenticationOptionsSchema) {}
export class PasskeyRegistrationFinishDto extends createZodDto(PasskeyRegistrationFinishSchema) {}
export class PasskeyAuthenticationFinishDto extends createZodDto(PasskeyAuthenticationFinishSchema) {}
export class PasskeySearchDto extends createZodDto(PasskeySearchSchema) {}
export class PasskeyUpdateDto extends createZodDto(PasskeyUpdateSchema) {}
export class PasskeyResponseDto extends createZodDto(PasskeyResponseSchema) {}

export const mapPasskey = (passkey: Passkey): PasskeyResponseDto => ({
  id: passkey.id,
  name: passkey.name,
  createdAt: passkey.createdAt,
  updatedAt: passkey.updatedAt,
  usedAt: passkey.usedAt,
});
