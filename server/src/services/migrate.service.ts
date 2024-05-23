import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { ExifTool } from 'exiftool-vendored';
import { MediaMigrationError, NoPhotosDirError, migrateDirFullGen } from 'google-photos-migrate';
import { createReadStream } from 'node:fs';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import sanitize from 'sanitize-filename';
import { AccessCore } from 'src/cores/access.core';
import { StorageCore, StorageFolder } from 'src/cores/storage.core';
import { AuthDto } from 'src/dtos/auth.dto';
import { MigrationBegin, MigrationStatus } from 'src/dtos/migrate.dto';
import { IAccessRepository } from 'src/interfaces/access.interface';
import { IAssetRepository } from 'src/interfaces/asset.interface';
import { ICryptoRepository } from 'src/interfaces/crypto.interface';
import { IJobRepository } from 'src/interfaces/job.interface';
import { ILoggerRepository } from 'src/interfaces/logger.interface';
import { IMoveRepository } from 'src/interfaces/move.interface';
import { IPersonRepository } from 'src/interfaces/person.interface';
import { IStorageRepository } from 'src/interfaces/storage.interface';
import { ISystemMetadataRepository } from 'src/interfaces/system-metadata.interface';
import unzipper from 'unzipper';

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

  public async getMigrationStatus(): Promise<MigrationStatus> {
    const folder = this.getUploadFolder();
    try {
      const files = await fs.readdir(folder);
      const zipFiles = files.filter((file) => path.extname(file) === '.zip');
      const status = new MigrationStatus();
      status.res = zipFiles;
      return status;
    } catch (error) {
      this.logger.error('Failed to read migration folder', error);
      throw error;
    }
  }

  public async beginMigration(): Promise<MigrationBegin> {
    const migration = new MigrationBegin();
    try {
      // 1: Unzip folder
      const folder = this.getUploadFolder();
      await this.unzipFiles(folder, folder);

      // 2: Run google photos migrate on it
      console.log('Started migration.');
      const migGen = migrateDirFullGen({
        inputDir: path.join(folder, 'Takeout'),
        errorDir: path.join(folder, 'error'),
        outputDir: path.join(folder, 'output'),
        log: console.log,
        warnLog: console.error,
        verboseLog: console.log,
        exiftool: new ExifTool(),
        endExifTool: true,
      });
      const counts = { err: 0, suc: 0 };
      for await (const result of migGen) {
        if (result instanceof NoPhotosDirError) {
          throw result;
        }

        if (result instanceof MediaMigrationError) {
          console.error(`Error: ${result}`);
          counts.err++;
          continue;
        }

        counts.suc++;
      }

      console.log(`Done! Processed ${counts.suc + counts.err} files.`);
      console.log(`Files migrated: ${counts.suc}`);
      console.log(`Files failed: ${counts.err}`);

      // 3: Import those files

      migration.success = true;
      return migration;
    } catch (error) {
      console.log(error);
      migration.success = false;
      return migration;
    }
  }

  private async unzipFiles(sourceDir: string, outputDir: string) {
    try {
      // Read all files from the source directory
      const files = await fs.readdir(sourceDir);

      // Filter out only .zip files
      const zipFiles = files.filter((file) => path.extname(file) === '.zip');

      for (const zipFile of zipFiles) {
        const zipFilePath = path.join(sourceDir, zipFile);

        // Ensure the output directory exists
        await fs.mkdir(outputDir, { recursive: true });

        // Unzip the file using unzipper
        await new Promise((resolve, reject) => {
          createReadStream(zipFilePath)
            .pipe(unzipper.Extract({ path: outputDir }))
            .on('close', resolve)
            .on('error', reject);
        });
      }

      console.log('All zip files have been successfully extracted.');
    } catch (error) {
      console.error('An error occurred while extracting zip files:', error);
    }
  }
}
