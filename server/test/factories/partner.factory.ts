import { Selectable } from 'kysely';
import { PartnerTable } from 'src/schema/tables/partner.table';
import { build } from 'test/factories/builder.factory';
import { FactoryBuilder, PartnerLike, UserLike } from 'test/factories/types';
import { UserFactory } from 'test/factories/user.factory';
import { newDate, newUuid, newUuidV7 } from 'test/small.factory';

export class PartnerFactory {
  #sharedWith!: UserFactory;
  #sharedBy!: UserFactory;

  private constructor(private value: Selectable<PartnerTable>) {}

  static create(dto: PartnerLike = {}) {
    return PartnerFactory.from(dto).build();
  }

  static from(dto: PartnerLike = {}) {
    const sharedById = dto.sharedById ?? newUuid();
    const sharedWithId = dto.sharedWithId ?? newUuid();
    return new PartnerFactory({
      createdAt: newDate(),
      createId: newUuidV7(),
      inTimeline: true,
      sharedById,
      sharedWithId,
      updatedAt: newDate(),
      updateId: newUuidV7(),
      ...dto,
    })
      .sharedBy({ id: sharedById })
      .sharedWith({ id: sharedWithId });
  }

  sharedWith(dto: UserLike = {}, builder?: FactoryBuilder<UserFactory>) {
    this.#sharedWith = build(UserFactory.from(dto), builder);
    this.value.sharedWithId = this.#sharedWith.build().id;
    return this;
  }

  sharedBy(dto: UserLike = {}, builder?: FactoryBuilder<UserFactory>) {
    this.#sharedBy = build(UserFactory.from(dto), builder);
    this.value.sharedById = this.#sharedBy.build().id;
    return this;
  }

  build() {
    return { ...this.value, sharedWith: this.#sharedWith.build(), sharedBy: this.#sharedBy.build() };
  }
}
