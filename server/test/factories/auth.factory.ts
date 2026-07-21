import { AuthDto } from 'src/dtos/auth.dto';
import { ApiKeyFactory } from 'test/factories/api-key.factory';
import { build } from 'test/factories/builder.factory';
import { SharedLinkFactory } from 'test/factories/shared-link.factory';
import { ApiKeyLike, FactoryBuilder, SharedLinkLike, UserLike } from 'test/factories/types';
import { UserFactory } from 'test/factories/user.factory';
import { newUuid } from 'test/small.factory';

export class AuthFactory {
  #user: UserFactory;
  #sharedLink?: SharedLinkFactory;
  #apiKey?: ApiKeyFactory;
  #session?: AuthDto['session'];

  private constructor(user: UserFactory) {
    this.#user = user;
  }

  static create(dto: UserLike = {}) {
    return AuthFactory.from(dto).build();
  }

  static from(dto: UserLike = {}) {
    return new AuthFactory(UserFactory.from(dto));
  }

  apiKey(dto: ApiKeyLike = {}, builder?: FactoryBuilder<ApiKeyFactory>) {
    this.#apiKey = build(ApiKeyFactory.from(dto), builder);
    return this;
  }

  sharedLink(dto: SharedLinkLike = {}, builder?: FactoryBuilder<SharedLinkFactory>) {
    this.#sharedLink = build(SharedLinkFactory.from(dto), builder);
    return this;
  }

  session(dto: Partial<AuthDto['session']> = {}) {
    this.#session = { id: newUuid(), hasElevatedPermission: false, ...dto };
    return this;
  }

  build(): AuthDto {
    const { id, isAdmin, name, email, quotaUsageInBytes, quotaSizeInBytes } = this.#user.build();

    return {
      user: {
        id,
        isAdmin,
        name,
        email,
        quotaUsageInBytes,
        quotaSizeInBytes,
      },
      sharedLink: this.#sharedLink?.build(),
      apiKey: this.#apiKey?.build(),
      session: this.#session,
    };
  }
}
