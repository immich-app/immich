import { Body, Controller, Delete, Get, Param, Post, Query, Res, UploadedFiles, UseInterceptors } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { AuthDto } from 'src/dtos/auth.dto';
import {
  GoogleDriveFilesResponseDto,
  GooglePhotosImportFromDriveDto,
  GooglePhotosImportJobDto,
  GooglePhotosImportProgressDto,
} from 'src/dtos/google-photos-import.dto';
import { Auth } from 'src/middleware/auth.guard';
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
  importFromDrive(@Auth() auth: AuthDto, @Body() dto: GooglePhotosImportFromDriveDto): GooglePhotosImportJobDto {
    return this.importService.createImportJobFromDrive(auth.user.id, dto.fileIds);
  }

  @Get('import/:id/progress')
  @ApiOperation({ summary: 'Get import job progress' })
  @ApiResponse({ status: 200, type: GooglePhotosImportProgressDto })
  getProgress(@Auth() auth: AuthDto, @Param('id') jobId: string): GooglePhotosImportProgressDto | null {
    return this.importService.getJobProgress(jobId);
  }

  @Delete('import/:id')
  @ApiOperation({ summary: 'Cancel import job' })
  async cancelImport(@Auth() auth: AuthDto, @Param('id') jobId: string): Promise<void> {
    return this.importService.cancelJob(jobId);
  }

  // Google Drive OAuth endpoints
  @Post('google-drive/auth')
  @ApiOperation({ summary: 'Initiate Google Drive OAuth flow' })
  initiateGoogleDriveAuth(@Auth() auth: AuthDto): { authUrl: string } {
    // This would generate the OAuth URL for Google Drive
    // In production, you would use @googleapis/oauth2client

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI;

    if (!clientId || !redirectUri) {
      throw new Error('Google OAuth not configured');
    }

    const scopes = ['https://www.googleapis.com/auth/drive.readonly'];

    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    authUrl.searchParams.set('client_id', clientId);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', scopes.join(' '));
    authUrl.searchParams.set('access_type', 'offline');
    authUrl.searchParams.set('state', auth.user.id);

    return { authUrl: authUrl.toString() };
  }

  @Get('google-drive/callback')
  @ApiOperation({ summary: 'Google Drive OAuth callback' })
  async handleGoogleDriveCallback(
    @Query('code') code: string,
    @Query('state') userId: string,
    @Query('error') error: string,
    @Res() res: Response,
  ): Promise<void> {
    if (error) {
      res.redirect('/utilities/google-photos-import?error=' + encodeURIComponent(error));
      return;
    }

    try {
      // Exchange code for tokens
      const clientId = process.env.GOOGLE_CLIENT_ID;
      const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
      const redirectUri = process.env.GOOGLE_REDIRECT_URI;

      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code,
          client_id: clientId!,
          client_secret: clientSecret!,
          redirect_uri: redirectUri!,
          grant_type: 'authorization_code',
        }),
      });

      if (!tokenResponse.ok) {
        throw new Error('Failed to exchange code for tokens');
      }

      await tokenResponse.json();

      // TODO: Store tokens securely for this user
      // For now, we'll pass success back to the frontend
      // In production, store in database associated with userId

      res.redirect('/utilities/google-photos-import?connected=true');
    } catch {
      res.redirect('/utilities/google-photos-import?error=' + encodeURIComponent('Failed to connect'));
    }
  }

  @Delete('google-drive/auth')
  @ApiOperation({ summary: 'Disconnect Google Drive' })
  disconnectGoogleDrive(@Auth() _auth: AuthDto): void {
    // Remove stored Google OAuth tokens for this user
    // This would be implemented with a user preferences store
  }

  @Get('google-drive/files')
  @ApiOperation({ summary: 'List Takeout files in Google Drive' })
  @ApiResponse({ status: 200, type: GoogleDriveFilesResponseDto })
  listDriveFiles(@Auth() _auth: AuthDto, @Query('query') _query?: string): GoogleDriveFilesResponseDto {
    // This would fetch files using stored OAuth token
    // For now, return empty array
    return { files: [] };
  }
}
