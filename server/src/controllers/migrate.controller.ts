import {
  Controller,
  Get,
  HttpStatus,
  Inject,
  ParseFilePipe,
  Post,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { AuthDto } from 'src/dtos/auth.dto';
import { MigrationBegin, MigrationStatus } from 'src/dtos/migrate.dto';
import { ILoggerRepository } from 'src/interfaces/logger.interface';
import { Auth, Authenticated } from 'src/middleware/auth.guard';
import { AssetServiceV1 } from 'src/services/asset-v1.service';
import { MigrateService } from 'src/services/migrate.service';

@ApiTags('Migrate')
@Controller('migrate')
export class MigrateController {
  constructor(
    private service: MigrateService,
    private assetServiceV1: AssetServiceV1,
    @Inject(ILoggerRepository) private logger: ILoggerRepository,
  ) {}

  @Post('google/upload')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Upload ZIP file',
    schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } },
  })
  @Authenticated({ sharedLink: true })
  async uploadFile(
    @Auth() auth: AuthDto,
    @UploadedFile(new ParseFilePipe()) file: Express.Multer.File,
    @Res() res: Response,
  ): Promise<void> {
    try {
      await this.service.uploadZipFile(auth, file);
      res.status(HttpStatus.OK).send({ message: 'File uploaded successfully' });
    } catch (error) {
      this.logger.error('Error uploading file', error);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).send({ message: 'Failed to upload file' });
    }
  }

  @Get('google/status')
  @Authenticated({ sharedLink: true })
  getMigrationStatus(): Promise<MigrationStatus> {
    return this.service.getMigrationStatus();
  }

  @Post('google/begin')
  @Authenticated({ sharedLink: true })
  async beginMigration(@Auth() auth: AuthDto): Promise<MigrationBegin> {
    try {
      return await this.service.beginMigration(auth, this.assetServiceV1);
    } catch (error) {
      this.logger.error('Error beginning migration', error);
      throw new Error('Failed to begin migration');
    }
  }
}
