import { Injectable } from '@nestjs/common';
import {
  generateAuthenticationOptions,
  generateRegistrationOptions,
  verifyAuthenticationResponse,
  verifyRegistrationResponse,
  type GenerateAuthenticationOptionsOpts,
  type GenerateRegistrationOptionsOpts,
  type VerifyAuthenticationResponseOpts,
  type VerifyRegistrationResponseOpts,
} from '@simplewebauthn/server';

@Injectable()
export class WebAuthnRepository {
  generateRegistrationOptions(options: GenerateRegistrationOptionsOpts) {
    return generateRegistrationOptions(options);
  }

  verifyRegistrationResponse(options: VerifyRegistrationResponseOpts) {
    return verifyRegistrationResponse(options);
  }

  generateAuthenticationOptions(options: GenerateAuthenticationOptionsOpts) {
    return generateAuthenticationOptions(options);
  }

  verifyAuthenticationResponse(options: VerifyAuthenticationResponseOpts) {
    return verifyAuthenticationResponse(options);
  }
}
