import { Injectable } from '@nestjs/common';
import { Kysely, Updateable } from 'kysely';
import { isEmpty, isUndefined, omitBy } from 'lodash';
import { InjectKysely } from 'nestjs-kysely';
import { AssetFileSearchDto } from 'src/dtos/asset-file.dto';
import { DB } from 'src/schema';
import { AssetFileTable } from 'src/schema/tables/asset-file.table';
import { asUuid } from 'src/utils/database';

@Injectable()
export class AssetFileRepository {
  constructor(@InjectKysely() private db: Kysely<DB>) {}

  get(id: string) {
    return this.db.selectFrom('asset_file').where('id', '=', id).selectAll().executeTakeFirst();
  }

  search(dto: AssetFileSearchDto) {
    return this.db
      .selectFrom('asset_file')
      .where('assetId', '=', dto.assetId)
      .$if(dto.type !== undefined, (qb) => qb.where('type', '=', dto.type!))
      .$if(dto.isEdited !== undefined, (qb) => qb.where('isEdited', '=', dto.isEdited!))
      .$if(dto.isProgressive !== undefined, (qb) => qb.where('isProgressive', '=', dto.isProgressive!))
      .$if(dto.isTransparent !== undefined, (qb) => qb.where('isTransparent', '=', dto.isTransparent!))
      .selectAll()
      .execute();
  }

  async delete(id: string): Promise<boolean> {
    const { numDeletedRows } = await this.db.deleteFrom('asset_file').where('id', '=', id).executeTakeFirst();
    return Number(numDeletedRows) === 1;
  }

  async update(assetFile: Updateable<AssetFileTable> & { id: string }) {
    const value = omitBy(assetFile, isUndefined);
    delete value.id;

    if (!isEmpty(value)) {
      await this.db.updateTable('asset_file').set(assetFile).where('id', '=', asUuid(assetFile.id)).execute();
      return;
    }
  }
}
