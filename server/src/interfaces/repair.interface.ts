import { RepairEntity } from 'src/entities/repair.entity';
import { Paginated, PaginationOptions } from 'src/utils/pagination';

export const IRepairRepository = 'IRepairRepository';

export interface IRepairRepository {
  create(repair: Partial<RepairEntity>): Promise<RepairEntity>;
  getAll(pagination: PaginationOptions): Paginated<RepairEntity>;
}
