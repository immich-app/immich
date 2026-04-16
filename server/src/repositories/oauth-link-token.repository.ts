import { Injectable } from '@nestjs/common';
import { Insertable, Kysely } from 'kysely';
import { DateTime } from 'luxon';
import { InjectKysely } from 'nestjs-kysely';
import { DB } from 'src/schema';
import { OAuthLinkTokenTable } from 'src/schema/tables/oauth-link-token.table';

@Injectable()
export class OAuthLinkTokenRepository {
  constructor(@InjectKysely() private db: Kysely<DB>) {}

  create(dto: Insertable<OAuthLinkTokenTable>) {
    return this.db.insertInto('oauth_link_token').values(dto).returningAll().executeTakeFirstOrThrow();
  }

  consumeToken(token: Buffer) {
    return this.db
      .deleteFrom('oauth_link_token')
      .where('token', '=', token)
      .where('expiresAt', '>', DateTime.now().toJSDate())
      .returningAll()
      .executeTakeFirst();
  }

  async deleteByEmail(userEmail: string) {
    await this.db.deleteFrom('oauth_link_token').where('userEmail', '=', userEmail).execute();
  }

  async cleanup() {
    const result = await this.db
      .deleteFrom('oauth_link_token')
      .where('expiresAt', '<=', DateTime.now().toJSDate())
      .execute();
    return Number(result[0]?.numDeletedRows ?? 0);
  }
}
