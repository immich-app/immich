import { Injectable } from '@nestjs/common';
import { Insertable, Kysely } from 'kysely';
import { InjectKysely } from 'nestjs-kysely';
import { Readable } from 'node:stream';
import {
  MaintenanceGetIntegrityReportDto,
  MaintenanceIntegrityReportResponseDto,
  MaintenanceIntegrityReportSummaryResponseDto,
} from 'src/dtos/maintenance.dto';
import { IntegrityReportType } from 'src/enum';
import { DB } from 'src/schema';
import { IntegrityReportTable } from 'src/schema/tables/integrity-report.table';

@Injectable()
export class IntegrityReportRepository {
  constructor(@InjectKysely() private db: Kysely<DB>) {}

  create(dto: Insertable<IntegrityReportTable> | Insertable<IntegrityReportTable>[]) {
    return this.db
      .insertInto('integrity_report')
      .values(dto)
      .onConflict((oc) =>
        oc.columns(['path', 'type']).doUpdateSet({
          assetId: (eb) => eb.ref('excluded.assetId'),
          fileAssetId: (eb) => eb.ref('excluded.fileAssetId'),
        }),
      )
      .returningAll()
      .executeTakeFirst();
  }

  getById(id: string) {
    return this.db
      .selectFrom('integrity_report')
      .selectAll('integrity_report')
      .where('id', '=', id)
      .executeTakeFirstOrThrow();
  }

  getIntegrityReportSummary(): Promise<MaintenanceIntegrityReportSummaryResponseDto> {
    return this.db
      .selectFrom('integrity_report')
      .select((eb) =>
        eb.fn
          .countAll<number>()
          .filterWhere('type', '=', IntegrityReportType.ChecksumFail)
          .as(IntegrityReportType.ChecksumFail),
      )
      .select((eb) =>
        eb.fn
          .countAll<number>()
          .filterWhere('type', '=', IntegrityReportType.MissingFile)
          .as(IntegrityReportType.MissingFile),
      )
      .select((eb) =>
        eb.fn
          .countAll<number>()
          .filterWhere('type', '=', IntegrityReportType.OrphanFile)
          .as(IntegrityReportType.OrphanFile),
      )
      .executeTakeFirstOrThrow();
  }

  async getIntegrityReport(dto: MaintenanceGetIntegrityReportDto): Promise<MaintenanceIntegrityReportResponseDto> {
    return {
      items: await this.db
        .selectFrom('integrity_report')
        .select(['id', 'type', 'path', 'assetId', 'fileAssetId'])
        .where('type', '=', dto.type)
        .orderBy('createdAt', 'desc')
        .execute(),
    };
  }

  getIntegrityReportCsv(type: IntegrityReportType): Readable {
    const items = this.db
      .selectFrom('integrity_report')
      .select(['id', 'type', 'path', 'assetId', 'fileAssetId'])
      .where('type', '=', type)
      .orderBy('createdAt', 'desc')
      .stream();

    // very rudimentary csv serialiser
    async function* generator() {
      yield 'id,type,assetId,fileAssetId,path\n';

      for await (const item of items) {
        // no expectation of particularly bad filenames
        // but they could potentially have a newline or quote character
        yield `${item.id},${item.type},${item.assetId},${item.fileAssetId},"${item.path.replace(/"/g, '\\"')}"\n`;
      }
    }

    return Readable.from(generator());
  }

  deleteById(id: string) {
    return this.db.deleteFrom('integrity_report').where('id', '=', id).execute();
  }

  deleteByIds(ids: string[]) {
    return this.db.deleteFrom('integrity_report').where('id', 'in', ids).execute();
  }
}
