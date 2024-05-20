import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import sanitize from 'sanitize-filename';
import { AccessCore } from 'src/cores/access.core';
import { StorageCore, StorageFolder } from 'src/cores/storage.core';
import { AuthDto } from 'src/dtos/auth.dto';
import { IAccessRepository } from 'src/interfaces/access.interface';
import { IAssetRepository } from 'src/interfaces/asset.interface';
import { ICryptoRepository } from 'src/interfaces/crypto.interface';
import { IJobRepository } from 'src/interfaces/job.interface';
import { ILoggerRepository } from 'src/interfaces/logger.interface';
import { IMoveRepository } from 'src/interfaces/move.interface';
import { IPersonRepository } from 'src/interfaces/person.interface';
import { IStorageRepository } from 'src/interfaces/storage.interface';
import { ISystemMetadataRepository } from 'src/interfaces/system-metadata.interface';

@Injectable()
export class MigrateService {
  private access: AccessCore;
  private storage: StorageCore;

  constructor(
    @Inject(IAssetRepository) private assetRepository: IAssetRepository,
    @Inject(IAccessRepository) accessRepository: IAccessRepository,
    @Inject(IJobRepository) private jobRepository: IJobRepository,
    @Inject(IStorageRepository) private storageRepository: IStorageRepository,
    @Inject(ILoggerRepository) private logger: ILoggerRepository,
    @Inject(ICryptoRepository) private cryptoRepository: ICryptoRepository,
    @Inject(IMoveRepository) private moveRepository: IMoveRepository,
    @Inject(IPersonRepository) private personRepository: IPersonRepository,
    @Inject(ISystemMetadataRepository) private systemMetadataRepository: ISystemMetadataRepository,
  ) {
    this.access = AccessCore.create(accessRepository);
    this.storage = StorageCore.create(
      this.assetRepository, // Asset repository not needed for this service
      this.cryptoRepository,
      this.moveRepository,
      this.personRepository,
      this.storageRepository,
      this.systemMetadataRepository,
      this.logger,
    );
    this.logger.setContext(MigrateService.name);
  }

  public async uploadFile(auth: AuthDto, file: Express.Multer.File): Promise<void> {
    this.access.requireUploadAccess(auth);

    const originalExtension = path.extname(file.originalname).toLowerCase();
    if (originalExtension !== '.zip') {
      throw new BadRequestException('Only .zip files are allowed');
    }

    const sanitizedFilename = sanitize(file.originalname);
    const uploadFolder = this.getUploadFolder();
    const uploadPath = path.join(uploadFolder, sanitizedFilename);
    console.log(uploadPath);

    try {
      // Ensure the uploads directory exists
      await fs.mkdir(path.dirname(uploadPath), { recursive: true });

      // Write the file to disk
      await fs.writeFile(uploadPath, file.buffer);

      this.logger.log(`File ${sanitizedFilename} uploaded successfully.`);
    } catch (error) {
      this.logger.error('Failed to upload file', error);
      throw error;
    }
  }

  private getUploadFolder(): string {
    const folder = StorageCore.getBaseFolder(StorageFolder.MIGRATE);
    this.storageRepository.mkdirSync(folder);
    return folder;
  }
}
