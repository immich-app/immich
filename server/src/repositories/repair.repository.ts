import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { RepairEntity } from 'src/entities/repair.entity';
import { PaginationMode } from 'src/enum';
import { IRepairRepository } from 'src/interfaces/repair.interface';
import { Instrumentation } from 'src/utils/instrumentation';
import { Paginated, paginatedBuilder, PaginationOptions } from 'src/utils/pagination';
import { Repository } from 'typeorm';

@Instrumentation()
@Injectable()
export class RepairRepository implements IRepairRepository {
  constructor(@InjectRepository(RepairEntity) private repository: Repository<RepairEntity>) {}

  create(repair: Partial<RepairEntity>): Promise<RepairEntity> {
    return this.repository.save(repair);
  }

  getAll(pagination: PaginationOptions): Paginated<RepairEntity> {
    const builder = this.repository.createQueryBuilder('repair');
    return paginatedBuilder<RepairEntity>(builder, {
      mode: PaginationMode.SKIP_TAKE,
      skip: pagination.skip,
      take: pagination.take,
    });
  }
}
