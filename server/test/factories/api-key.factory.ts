import { Selectable } from 'kysely';
import { Permission } from 'src/enum.js';
import { ApiKeyTable } from 'src/schema/tables/api-key.table.js';
import { build } from 'test/factories/builder.factory.js';
import { ApiKeyLike, FactoryBuilder, UserLike } from 'test/factories/types.js';
import { UserFactory } from 'test/factories/user.factory.js';
import { newDate, newUuid, newUuidV7 } from 'test/small.factory.js';

export class ApiKeyFactory {
  #user!: UserFactory;

  private constructor(private value: Selectable<ApiKeyTable>) {}

  static create(dto: ApiKeyLike = {}) {
    return ApiKeyFactory.from(dto).build();
  }

  static from(dto: ApiKeyLike = {}) {
    const userId = dto.userId ?? newUuid();
    return new ApiKeyFactory({
      createdAt: newDate(),
      id: newUuid(),
      key: Buffer.from('api-key-buffer'),
      name: 'API Key',
      permissions: [Permission.All],
      updatedAt: newDate(),
      updateId: newUuidV7(),
      userId,
      ...dto,
    }).user({ id: userId });
  }

  user(dto: UserLike = {}, builder?: FactoryBuilder<UserFactory>) {
    this.#user = build(UserFactory.from(dto), builder);
    this.value.userId = this.#user.build().id;
    return this;
  }

  build() {
    return { ...this.value, user: this.#user.build() };
  }
}
