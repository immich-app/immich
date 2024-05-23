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
import { MigrateService } from 'src/services/migrate.service';

@ApiTags('Migrate')
@Controller('migrate')
export class MigrateController {
  constructor(
    private service: MigrateService,
    @Inject(ILoggerRepository) private logger: ILoggerRepository,
  ) {}

  @Post('upload')
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
      await this.service.uploadFile(auth, file);
      res.status(HttpStatus.OK).send({ message: 'File uploaded successfully' });
    } catch (error) {
      this.logger.error('Error uploading file', error);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).send({ message: 'Failed to upload file' });
    }
  }

  @Get('status')
  @Authenticated({ sharedLink: true })
  getMigrationStatus(): Promise<MigrationStatus> {
    return this.service.getMigrationStatus();
  }

  @Post('begin')
  @Authenticated({ sharedLink: true })
  async beginMigration(): Promise<MigrationBegin> {
    return await this.service.beginMigration();
  }
}
