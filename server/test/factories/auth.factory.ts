import { isUndefined, omitBy } from 'lodash';
import { AuthDto } from 'src/dtos/auth.dto';
import { build } from 'test/factories/builder.factory';
import { SharedLinkFactory } from 'test/factories/shared-link.factory';
import { AuthStub, FactoryBuilder, RelationKeysPath, SharedLinkLike, UserLike } from 'test/factories/types';
import { UserFactory } from 'test/factories/user.factory';

export class AuthFactory<T extends RelationKeysPath<'auth'> = never> {
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

  sharedLink<K extends RelationKeysPath<'sharedLink', 'auth'> = never>(
    dto: SharedLinkLike = {},
    builder?: FactoryBuilder<SharedLinkFactory<'owner'>, SharedLinkFactory<'owner' | K>>,
  ) {
    this.#sharedLink = build(SharedLinkFactory.from(dto), builder);
    return this as AuthFactory<T | 'sharedLink' | 'sharedLink.owner' | K extends never ? never : `sharedLink.${K}`>;
  }

  build(): AuthDto {
    const { id, isAdmin, name, email, quotaUsageInBytes, quotaSizeInBytes } = this.#user.build();

    return omitBy(
      {
        user: {
          id,
          isAdmin,
          name,
          email,
          quotaUsageInBytes,
          quotaSizeInBytes,
        },
        sharedLink: this.#sharedLink?.build(),
      },
      isUndefined,
    ) as AuthStub<T>;
  }
}
