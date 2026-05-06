import { OAuthProfile } from 'src/repositories/oauth.repository';
import { OAuthProfileLike } from 'test/factories/types';
import { newUuid } from 'test/small.factory';

export class OAuthProfileFactory {
  private constructor(private value: OAuthProfile) {}

  static create(dto: OAuthProfileLike = {}) {
    return OAuthProfileFactory.from(dto).build();
  }

  static from(dto: OAuthProfileLike = {}) {
    const sub = newUuid();
    return new OAuthProfileFactory({
      sub,
      name: 'Name',
      given_name: 'Given',
      family_name: 'Family',
      email: `oauth-${sub}@immich.cloud`,
      email_verified: true,
      ...dto,
    });
  }

  build() {
    return { ...this.value };
  }
}
