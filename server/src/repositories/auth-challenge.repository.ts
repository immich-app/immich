import { Injectable } from '@nestjs/common';
import { InjectKysely } from 'nestjs-kysely';
import type { Insertable, Kysely } from 'kysely';
import { DummyValue, GenerateSql } from 'src/decorators.js';
import { AuthChallengeType } from 'src/enum.js';
import { DB } from 'src/schema/index.js';
import { AuthChallengeTable } from 'src/schema/tables/auth-challenge.table.js';

@Injectable()
export class AuthChallengeRepository {
  constructor(@InjectKysely() private db: Kysely<DB>) {}

  create(dto: Insertable<AuthChallengeTable>) {
    return this.db.insertInto('auth_challenge').values(dto).executeTakeFirstOrThrow();
  }

  @GenerateSql({ params: [{ type: AuthChallengeType.PasskeyRegistration, challenge: DummyValue.STRING }] })
  consume({ type, challenge }: { type: AuthChallengeType; challenge: string }) {
    return this.db
      .deleteFrom('auth_challenge')
      .where('challenge', '=', challenge)
      .where('type', '=', type)
      .where('expiresAt', '>', new Date())
      .returning(['id', 'userId'])
      .executeTakeFirst();
  }

  @GenerateSql()
  async deleteExpired() {
    const result = await this.db.deleteFrom('auth_challenge').where('expiresAt', '<=', new Date()).executeTakeFirst();
    return Number(result.numDeletedRows);
  }
}
