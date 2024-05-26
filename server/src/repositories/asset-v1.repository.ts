import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AssetEntity } from 'src/entities/asset.entity';
import { AssetCheck, IAssetRepositoryV1 } from 'src/interfaces/asset-v1.interface';
import { In } from 'typeorm/find-options/operator/In.js';
import { Repository } from 'typeorm/repository/Repository.js';

@Injectable()
export class AssetRepositoryV1 implements IAssetRepositoryV1 {
  constructor(@InjectRepository(AssetEntity) private assetRepository: Repository<AssetEntity>) {}

  get(id: string): Promise<AssetEntity | null> {
    return this.assetRepository.findOne({
      where: { id },
      relations: {
        faces: {
          person: true,
        },
        library: true,
      },
      withDeleted: true,
    });
  }

  /**
   * Get assets by checksums on the database
   * @param ownerId
   * @param checksums
   *
   */
  getAssetsByChecksums(ownerId: string, checksums: Buffer[]): Promise<AssetCheck[]> {
    return this.assetRepository.find({
      select: {
        id: true,
        checksum: true,
      },
      where: {
        ownerId,
        checksum: In(checksums),
      },
      withDeleted: true,
    });
  }
}
