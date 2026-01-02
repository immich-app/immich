import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthDto, Auth } from 'src/middleware/auth.guard';
import {
  GooglePhotosImportFromDriveDto,
  GooglePhotosImportJobDto,
  GooglePhotosImportProgressDto,
  GoogleDriveFilesResponseDto,
} from 'src/dtos/google-photos-import.dto';
import { GooglePhotosImportService } from 'src/services/google-photos-import.service';

@ApiTags('Google Photos Import')
@Controller('google-photos')
export class GooglePhotosImportController {
  constructor(private readonly importService: GooglePhotosImportService) {}

  @Post('import')
  @UseInterceptors(FilesInterceptor('files'))
  @ApiOperation({ summary: 'Import Google Photos Takeout ZIP files' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Google Takeout ZIP files',
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
        },
      },
    },
  })
  @ApiResponse({ status: 201, type: GooglePhotosImportJobDto })
  async importFromFiles(
    @Auth() auth: AuthDto,
    @UploadedFiles() files: Express.Multer.File[],
  ): Promise<GooglePhotosImportJobDto> {
    return this.importService.createImportJob(auth.user.id, files);
  }

  @Post('import-from-drive')
  @ApiOperation({ summary: 'Import Google Photos Takeout from Google Drive' })
  @ApiResponse({ status: 201, type: GooglePhotosImportJobDto })
  async importFromDrive(
    @Auth() auth: AuthDto,
    @Body() dto: GooglePhotosImportFromDriveDto,
  ): Promise<GooglePhotosImportJobDto> {
    return this.importService.createImportJobFromDrive(auth.user.id, dto.fileIds);
  }

  @Get('import/:id/progress')
  @ApiOperation({ summary: 'Get import job progress' })
  @ApiResponse({ status: 200, type: GooglePhotosImportProgressDto })
  getProgress(
    @Auth() auth: AuthDto,
    @Param('id') jobId: string,
  ): GooglePhotosImportProgressDto | null {
    return this.importService.getJobProgress(jobId);
  }

  @Delete('import/:id')
  @ApiOperation({ summary: 'Cancel import job' })
  async cancelImport(
    @Auth() auth: AuthDto,
    @Param('id') jobId: string,
  ): Promise<void> {
    return this.importService.cancelJob(jobId);
  }

  // Google Drive OAuth endpoints
  @Post('google-drive/auth')
  @ApiOperation({ summary: 'Initiate Google Drive OAuth flow' })
  async initiateGoogleDriveAuth(@Auth() auth: AuthDto): Promise<{ authUrl: string }> {
    // This would generate the OAuth URL for Google Drive
    // In production, you would use @googleapis/oauth2client

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI;

    if (!clientId || !redirectUri) {
      throw new Error('Google OAuth not configured');
    }

    const scopes = [
      'https://www.googleapis.com/auth/drive.readonly',
    ];

    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    authUrl.searchParams.set('client_id', clientId);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', scopes.join(' '));
    authUrl.searchParams.set('access_type', 'offline');
    authUrl.searchParams.set('state', auth.user.id);

    return { authUrl: authUrl.toString() };
  }

  @Delete('google-drive/auth')
  @ApiOperation({ summary: 'Disconnect Google Drive' })
  async disconnectGoogleDrive(@Auth() auth: AuthDto): Promise<void> {
    // Remove stored Google OAuth tokens for this user
    // This would be implemented with a user preferences store
  }

  @Get('google-drive/files')
  @ApiOperation({ summary: 'List Takeout files in Google Drive' })
  @ApiResponse({ status: 200, type: GoogleDriveFilesResponseDto })
  async listDriveFiles(
    @Auth() auth: AuthDto,
    @Query('query') query?: string,
  ): Promise<GoogleDriveFilesResponseDto> {
    // This would fetch files using stored OAuth token
    // For now, return empty array
    return { files: [] };
  }
}
