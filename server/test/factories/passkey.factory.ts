import { Selectable } from 'kysely';
import { PasskeyTable } from 'src/schema/tables/passkey.table.js';
import { PasskeyLike } from 'test/factories/types.js';
import { newDate, newUuid, newUuidV7 } from 'test/small.factory.js';

export class PasskeyFactory {
  private constructor(private value: Selectable<PasskeyTable>) {}

  static create(dto: PasskeyLike = {}) {
    return PasskeyFactory.from(dto).build();
  }

  static from(dto: PasskeyLike = {}) {
    return new PasskeyFactory({
      id: newUuid(),
      name: 'Passkey',
      credentialId: 'credential-id',
      publicKey: Buffer.from('public-key'),
      counter: 0,
      transports: ['internal'],
      backedUp: false,
      deviceType: 'singleDevice',
      userId: newUuid(),
      createdAt: newDate(),
      updatedAt: newDate(),
      usedAt: null,
      updateId: newUuidV7(),
      ...dto,
    });
  }

  build() {
    return { ...this.value };
  }
}
