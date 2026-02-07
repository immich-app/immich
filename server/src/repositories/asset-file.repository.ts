import { Injectable } from '@nestjs/common';
import { Kysely } from 'kysely';
import { InjectKysely } from 'nestjs-kysely';
import { AssetFileSearchDto } from 'src/dtos/asset-file.dto';
import { DB } from 'src/schema';

@Injectable()
export class AssetFileRepository {
  constructor(@InjectKysely() private db: Kysely<DB>) {}

  get(id: string) {
    return this.db.selectFrom('asset_file').where('id', '=', id).selectAll().executeTakeFirst();
  }

  getByAssetId(dto: AssetFileSearchDto) {
    return this.db
      .selectFrom('asset_file')
      .where('assetId', '=', dto.assetId)
      .$if(dto.type !== undefined, (qb) => qb.where('type', '=', dto.type!))
      .$if(dto.isEdited !== undefined, (qb) => qb.where('isEdited', '=', dto.isEdited!))
      .$if(dto.isProgressive !== undefined, (qb) => qb.where('isProgressive', '=', dto.isProgressive!))
      .selectAll()
      .execute();
  }

  async delete(id: string): Promise<boolean> {
    const { numDeletedRows } = await this.db.deleteFrom('asset_file').where('id', '=', id).executeTakeFirst();
    return Number(numDeletedRows) === 1;
  }
}
