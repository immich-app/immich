import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Chunked, DummyValue, GenerateSql } from 'src/decorators';
import { AssetEntity } from 'src/entities/asset.entity';
import { StackEntity } from 'src/entities/stack.entity';
import { IStackRepository } from 'src/interfaces/stack.interface';
import { Instrumentation } from 'src/utils/instrumentation';
import { In, Repository } from 'typeorm';

@Instrumentation()
@Injectable()
export class StackRepository implements IStackRepository {
  constructor(
    @InjectRepository(AssetEntity) private assetRepository: Repository<AssetEntity>,
    @InjectRepository(StackEntity) private stackRepository: Repository<StackEntity>,
  ) {}

  create(entity: Partial<StackEntity>) {
    return this.save(entity);
  }

  async delete(id: string): Promise<void> {
    await this.stackRepository.delete(id);
  }

  async deleteAll(ids: string[]): Promise<void> {
    await this.stackRepository.delete(ids);
  }

  async deleteByUserId(userId: string): Promise<void> {
    // TODO add owner to stack entity
    const stacks = await this.stackRepository.find({ where: { primaryAsset: { ownerId: userId } } });
    const stackIds = new Set(stacks.map((stack) => stack.id));
    await this.stackRepository.delete({ id: In([...stackIds]) });
  }

  update(entity: Partial<StackEntity>) {
    return this.save(entity);
  }

  async getById(id: string): Promise<StackEntity | null> {
    return this.stackRepository.findOne({
      where: {
        id,
      },
      relations: {
        primaryAsset: true,
        assets: true,
      },
    });
  }

  @GenerateSql({ params: [DummyValue.UUID, [DummyValue.UUID]] }, { name: 'no assets', params: [DummyValue.UUID] })
  async getAssetIds(stackId: string, assetIds: string[]): Promise<Set<string>> {
    if (assetIds.length === 0) {
      return new Set();
    }

    const results = await this.assetRepository.find({
      select: { id: true },
      where: {
        stackId,
        id: In(assetIds),
      },
    });

    return new Set(results.map(({ id }) => id));
  }

  @GenerateSql({ params: [DummyValue.UUID, [DummyValue.UUID]] })
  async addAssetIds(stackId: string, assetIds: string[]): Promise<void> {
    await this.assetRepository.update({ id: In(assetIds) }, { stackId });
  }

  @GenerateSql({ params: [DummyValue.UUID, [DummyValue.UUID]] })
  @Chunked({ paramIndex: 1 })
  async removeAssetIds(stackId: string, assetIds: string[]): Promise<void> {
    await this.assetRepository.update({ stackId, id: In(assetIds) }, { stackId: null });
  }

  updatePrimaryAssets(): Promise<void> {
    // TODO implement this
    return Promise.resolve();
  }

  private async save(entity: Partial<StackEntity>) {
    const { id } = await this.stackRepository.save(entity);
    return this.stackRepository.findOneOrFail({
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
