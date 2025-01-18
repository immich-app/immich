import { Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { Kysely } from 'kysely';
import { jsonArrayFrom } from 'kysely/helpers/postgres';
import { InjectKysely } from 'nestjs-kysely';
import { join } from 'node:path';
import { DB } from 'src/db';
import { DummyValue, GenerateSql } from 'src/decorators';
import { AssetEntity } from 'src/entities/asset.entity';
import { StackEntity } from 'src/entities/stack.entity';
import { IStackRepository, StackSearch } from 'src/interfaces/stack.interface';
import { asUuid } from 'src/utils/database';
import { DataSource, In, Repository } from 'typeorm';
import { isBefore } from 'validator';

@Injectable()
export class StackRepository implements IStackRepository {
  constructor(
    @InjectDataSource() private dataSource: DataSource,
    @InjectRepository(StackEntity) private repository: Repository<StackEntity>,
    @InjectKysely() private db: Kysely<DB>,
  ) {}

  @GenerateSql({ params: [{ ownerId: DummyValue.UUID }] })
  search(query: StackSearch): Promise<StackEntity[]> {
    // return this.repository.find({
    //   where: {
    //     ownerId: query.ownerId,
    //     primaryAssetId: query.primaryAssetId,
    //   },
    //   relations: {
    //     assets: {
    //       exifInfo: true,
    //     },
    //   },
    // });
    console.log('query', query);
    return this.db
      .selectFrom('asset_stack')
      .selectAll('asset_stack')
      .leftJoinLateral(
        (eb) =>
          eb
            .selectFrom('assets')
            .selectAll('assets')
            .whereRef('assets.id', '=', 'asset_stack.primaryAssetId')
            .innerJoin('exif', (join) => join.onRef('exif.assetId', '=', 'assets.id'))
            .as('exifInfo'),
        (join) => join.onTrue(),
      )
      .where('asset_stack.ownerId', '=', query.ownerId)
      .execute() as Promise<StackEntity[]>;
  }

  async create(entity: { ownerId: string; assetIds: string[] }): Promise<StackEntity> {
    return this.dataSource.manager.transaction(async (manager) => {
      const stackRepository = manager.getRepository(StackEntity);

      const stacks = await stackRepository.find({
        where: {
          ownerId: entity.ownerId,
          primaryAssetId: In(entity.assetIds),
        },
        select: {
          id: true,
          assets: {
            id: true,
          },
        },
        relations: {
          assets: {
            exifInfo: true,
          },
        },
      });

      const assetIds = new Set<string>(entity.assetIds);

      // children
      for (const stack of stacks) {
        for (const asset of stack.assets) {
          assetIds.add(asset.id);
        }
      }

      if (stacks.length > 0) {
        await stackRepository.delete({ id: In(stacks.map((stack) => stack.id)) });
      }

      const { id } = await stackRepository.save({
        ownerId: entity.ownerId,
        primaryAssetId: entity.assetIds[0],
        assets: [...assetIds].map((id) => ({ id }) as AssetEntity),
      });

      return stackRepository.findOneOrFail({
        where: {
          id,
        },
        relations: {
          assets: {
            exifInfo: true,
          },
        },
      });
    });
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  async delete(id: string): Promise<void> {
    const stack = await this.getById(id);
    if (!stack) {
      return;
    }

    const assetIds = stack.assets.map(({ id }) => id);

    await this.repository.delete(id);

    // Update assets updatedAt
    await this.dataSource.manager.update(AssetEntity, assetIds, {
      updatedAt: new Date(),
    });
  }

  async deleteAll(ids: string[]): Promise<void> {
    const assetIds = [];
    for (const id of ids) {
      const stack = await this.getById(id);
      if (!stack) {
        continue;
      }

      assetIds.push(...stack.assets.map(({ id }) => id));
    }

    await this.repository.delete(ids);

    // Update assets updatedAt
    await this.dataSource.manager.update(AssetEntity, assetIds, {
      updatedAt: new Date(),
    });
  }

  update(entity: Partial<StackEntity>) {
    return this.save(entity);
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  async getById(id: string): Promise<StackEntity | undefined> {
    return this.db
      .selectFrom('asset_stack')
      .where('asset_stack.id', '=', asUuid(id))
      .selectAll('asset_stack')
      .leftJoinLateral(
        (eb) =>
          eb
            .selectFrom((eb) =>
              eb
                .selectFrom('assets')
                .selectAll('assets')
                .innerJoin('exif', 'assets.id', 'exif.assetId')
                .select((eb) => eb.fn.toJson('exif').as('exifInfo'))
                .whereRef('assets.stackId', '=', 'asset_stack.id')
                .as('asset'),
            )
            .select((eb) => eb.fn.jsonAgg('asset').as('assets'))
            .as('asset_lat'),
        (join) => join.onTrue(),
      )
      .select('assets')
      .executeTakeFirst() as Promise<StackEntity | undefined>;
  }

  private async save(entity: Partial<StackEntity>) {
    const { id } = await this.repository.save(entity);
    return this.repository.findOneOrFail({
      where: {
        id,
      },
      relations: {
        assets: {
          exifInfo: true,
        },
      },
      order: {
        assets: {
          fileCreatedAt: 'ASC',
        },
      },
    });
  }
}
