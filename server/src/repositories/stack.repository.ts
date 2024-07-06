import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { StackEntity } from 'src/entities/stack.entity';
import { IStackRepository } from 'src/interfaces/stack.interface';
import { Instrumentation } from 'src/utils/instrumentation';
import { Repository } from 'typeorm';

@Instrumentation()
@Injectable()
export class StackRepository implements IStackRepository {
  constructor(@InjectRepository(StackEntity) private repository: Repository<StackEntity>) {}

  create(entity: Partial<StackEntity>) {
    return this.save(entity);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }

  update(entity: Partial<StackEntity>) {
    return this.save(entity);
  }

  async getById(id: string): Promise<StackEntity | null> {
    return this.repository.findOne({
      where: {
        id,
      },
      relations: {
        primaryAsset: true,
        assets: true,
      },
    });
  }

  private async save(entity: Partial<StackEntity>) {
    const { id } = await this.repository.save(entity);
    return this.repository.findOneOrFail({
      where: {
        id,
      },
      relations: {
        primaryAsset: true,
        assets: true,
      },
    });
  }
}
