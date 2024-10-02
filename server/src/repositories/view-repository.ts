import { InjectRepository } from '@nestjs/typeorm';
import { DummyValue, GenerateSql } from 'src/decorators';
import { AssetEntity } from 'src/entities/asset.entity';
import { IViewRepository } from 'src/interfaces/view.interface';
import { Brackets, Repository } from 'typeorm';

export class ViewRepository implements IViewRepository {
  constructor(@InjectRepository(AssetEntity) private assetRepository: Repository<AssetEntity>) {}

  async getUniqueOriginalPaths(userId: string): Promise<string[]> {
    const results = await this.assetRepository
      .createQueryBuilder('asset')
      .where({
        isVisible: true,
        isArchived: false,
        ownerId: userId,
      })
      .select("DISTINCT substring(asset.originalPath FROM '^(.*/)[^/]*$')", 'directoryPath')
      .getRawMany();

    return results.map((row: { directoryPath: string }) => row.directoryPath.replaceAll(/^\/|\/$/g, ''));
  }

  @GenerateSql({ params: [DummyValue.UUID, DummyValue.STRING] })
  async getAssetsByOriginalPath(userId: string, partialPath: string): Promise<AssetEntity[]> {
    const normalizedPath = partialPath.replaceAll(/^\/|\/$/g, '');
    const assets = await this.assetRepository
      .createQueryBuilder('asset')
      .where({
        isVisible: true,
        isArchived: false,
        ownerId: userId,
      })
      .leftJoinAndSelect('asset.exifInfo', 'exifInfo')
      .andWhere(
        new Brackets((qb) => {
          qb.where('asset.originalPath LIKE :likePath', { likePath: `%${normalizedPath}/%` }).andWhere(
            'asset.originalPath NOT LIKE :notLikePath',
            { notLikePath: `%${normalizedPath}/%/%` },
          );
        }),
      )
      .orderBy(String.raw`regexp_replace(asset.originalPath, '.*/(.+)', '\1')`, 'ASC')
      .getMany();

    return assets;
  }
}
