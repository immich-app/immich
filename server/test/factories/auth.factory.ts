import { AuthDto } from 'src/dtos/auth.dto';
import { build } from 'test/factories/builder.factory';
import { SharedLinkFactory } from 'test/factories/shared-link.factory';
import { FactoryBuilder, SharedLinkLike, UserLike } from 'test/factories/types';
import { UserFactory } from 'test/factories/user.factory';

export class AuthFactory {
  #user: UserFactory;
  #sharedLink?: SharedLinkFactory;

  private constructor(user: UserFactory) {
    this.#user = user;
  }

  static create(dto: UserLike = {}) {
    return AuthFactory.from(dto).build();
  }

  static from(dto: UserLike = {}) {
    return new AuthFactory(UserFactory.from(dto));
  }

  apiKey() {
    // TODO
    return this;
  }

  sharedLink(dto: SharedLinkLike = {}, builder?: FactoryBuilder<SharedLinkFactory>) {
    this.#sharedLink = build(SharedLinkFactory.from(dto), builder);
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
    };
  }
}
