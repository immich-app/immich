import { Injectable } from '@nestjs/common';
import { Insertable, Kysely } from 'kysely';
import { InjectKysely } from 'nestjs-kysely';
import { MaintenanceGetIntegrityReportDto, MaintenanceIntegrityReportResponseDto } from 'src/dtos/maintenance.dto';
import { DB } from 'src/schema';
import { IntegrityReportTable } from 'src/schema/tables/integrity-report.table';

@Injectable()
export class IntegrityReportRepository {
  constructor(@InjectKysely() private db: Kysely<DB>) {}

  create(dto: Insertable<IntegrityReportTable> | Insertable<IntegrityReportTable>[]) {
    return this.db
      .insertInto('integrity_report')
      .values(dto)
      .onConflict((oc) => oc.doNothing())
      .returningAll()
      .executeTakeFirst();
  }

  async getIntegrityReport(_dto: MaintenanceGetIntegrityReportDto): Promise<MaintenanceIntegrityReportResponseDto> {
    return {
      items: await this.db
        .selectFrom('integrity_report')
        .select(['id', 'type', 'path'])
        .orderBy('createdAt', 'desc')
        .execute(),
    };
  }

  deleteById(id: string) {
    return this.db.deleteFrom('integrity_report').where('id', '=', id).execute();
  }

  deleteByIds(ids: string[]) {
    return this.db.deleteFrom('integrity_report').where('id', 'in', ids).execute();
  }
}
