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

  getByToken(token: Buffer) {
    return this.db
      .selectFrom('oauth_link_token')
      .selectAll()
      .where('token', '=', token)
      .where('expiresAt', '>', DateTime.now().toJSDate())
      .executeTakeFirst();
  }

  consumeToken(token: Buffer, kind: 'callback' | 'admin' | 'any' = 'any') {
    let query = this.db
      .deleteFrom('oauth_link_token')
      .where('token', '=', token)
      .where('expiresAt', '>', DateTime.now().toJSDate());
    if (kind === 'callback') {
      query = query.where('oauthSub', 'is not', null);
    } else if (kind === 'admin') {
      query = query.where('oauthSub', 'is', null);
    }
    return query.returningAll().executeTakeFirst();
  }

  async cleanup() {
    const result = await this.db
      .deleteFrom('oauth_link_token')
      .where('expiresAt', '<=', DateTime.now().toJSDate())
      .execute();
    return Number(result[0]?.numDeletedRows ?? 0);
  }
}
