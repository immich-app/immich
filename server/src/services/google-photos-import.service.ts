import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { createWriteStream } from 'node:fs';
import { mkdir, readdir, readFile, rm } from 'node:fs/promises';
import * as path from 'node:path';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { GoogleDriveFileDto, GooglePhotosImportProgressDto } from 'src/dtos/google-photos-import.dto';

// Google Photos JSON metadata structure
interface GooglePhotosMetadata {
  title: string;
  description: string;
  photoTakenTime?: { timestamp: string; formatted: string };
  creationTime?: { timestamp: string; formatted: string };
  geoData?: { latitude: number; longitude: number; altitude: number };
  people?: Array<{ name: string }>;
  favorited?: boolean;
}

interface TakeoutAsset {
  mediaPath: string;
  jsonPath?: string;
  albumName?: string;
  metadata?: GooglePhotosMetadata;
}

interface ImportJob {
  id: string;
  userId: string;
  status: 'pending' | 'processing' | 'complete' | 'failed';
  progress: GooglePhotosImportProgressDto;
  createdAt: Date;
  files: string[];
}

@Injectable()
export class GooglePhotosImportService {
  private readonly logger = new Logger(GooglePhotosImportService.name);
  private readonly jobs = new Map<string, ImportJob>();
  private readonly tempDir = '/tmp/immich-google-photos-import';

  constructor() // Inject required repositories
  // @Inject(IAssetRepository) private assetRepository: IAssetRepository,
  // @Inject(IAlbumRepository) private albumRepository: IAlbumRepository,
  // @Inject(IStorageRepository) private storageRepository: IStorageRepository,
  {}

  async createImportJob(userId: string, files: Express.Multer.File[]): Promise<{ id: string }> {
    const jobId = randomUUID();
    const jobDir = path.join(this.tempDir, jobId);

    await mkdir(jobDir, { recursive: true });

    // Save uploaded files
    const savedFiles: string[] = [];
    for (const file of files) {
      const filePath = path.join(jobDir, file.originalname);
      const writeStream = createWriteStream(filePath);
      await pipeline(Readable.from(file.buffer), writeStream);
      savedFiles.push(filePath);
    }

    const job: ImportJob = {
      id: jobId,
      userId,
      status: 'pending',
      progress: {
        phase: 'extracting',
        current: 0,
        total: files.length,
        albumsFound: 0,
        photosMatched: 0,
        photosMissingMetadata: 0,
        errors: [],
      },
      createdAt: new Date(),
      files: savedFiles,
    };

    this.jobs.set(jobId, job);

    // Start processing in background
    this.processImportJob(job).catch((error) => {
      this.logger.error(`Import job ${jobId} failed: ${error}`);
      job.status = 'failed';
      job.progress.errors.push(error.message);
    });

    return { id: jobId };
  }

  createImportJobFromDrive(userId: string, fileIds: string[]): { id: string } {
    const jobId = randomUUID();

    const job: ImportJob = {
      id: jobId,
      userId,
      status: 'pending',
      progress: {
        phase: 'extracting',
        current: 0,
        total: fileIds.length,
        albumsFound: 0,
        photosMatched: 0,
        photosMissingMetadata: 0,
        errors: [],
      },
      createdAt: new Date(),
      files: fileIds, // These are Drive file IDs, not local paths
    };

    this.jobs.set(jobId, job);

    // Start processing in background
    this.processImportJobFromDrive(job).catch((error) => {
      this.logger.error(`Import job ${jobId} failed: ${error}`);
      job.status = 'failed';
      job.progress.errors.push(error.message);
    });

    return { id: jobId };
  }

  getJobProgress(jobId: string): GooglePhotosImportProgressDto | null {
    const job = this.jobs.get(jobId);
    return job?.progress ?? null;
  }

  async cancelJob(jobId: string): Promise<void> {
    const job = this.jobs.get(jobId);
    if (job) {
      job.status = 'failed';
      job.progress.errors.push('Cancelled by user');
      // Cleanup temp files
      const jobDir = path.join(this.tempDir, jobId);
      await rm(jobDir, { recursive: true, force: true });
    }
  }

  private async processImportJob(job: ImportJob): Promise<void> {
    job.status = 'processing';
    const jobDir = path.join(this.tempDir, job.id);
    const extractDir = path.join(jobDir, 'extracted');

    try {
      // Phase 1: Extract ZIP files
      job.progress.phase = 'extracting';
      await mkdir(extractDir, { recursive: true });

      for (let i = 0; i < job.files.length; i++) {
        const zipPath = job.files[i];
        job.progress.current = i + 1;
        job.progress.currentFile = path.basename(zipPath);

        await this.extractZip(zipPath, extractDir);
      }

      // Phase 2: Parse Takeout structure
      job.progress.phase = 'parsing';
      job.progress.current = 0;
      const assets = await this.parseTakeoutDirectory(extractDir, job);

      // Phase 3: Upload assets
      job.progress.phase = 'uploading';
      job.progress.total = assets.length;
      job.progress.current = 0;

      for (const asset of assets) {
        job.progress.current++;
        job.progress.currentFile = path.basename(asset.mediaPath);

        this.uploadAsset(job.userId, asset);
      }

      // Complete
      job.progress.phase = 'complete';
      job.status = 'complete';
    } finally {
      // Cleanup
      await rm(jobDir, { recursive: true, force: true });
    }
  }

  private async processImportJobFromDrive(job: ImportJob): Promise<void> {
    job.status = 'processing';
    const jobDir = path.join(this.tempDir, job.id);

    try {
      await mkdir(jobDir, { recursive: true });

      // Phase 1: Download from Google Drive
      job.progress.phase = 'extracting';
      const downloadedFiles: string[] = [];

      for (let i = 0; i < job.files.length; i++) {
        const fileId = job.files[i];
        job.progress.current = i + 1;
        job.progress.currentFile = `Downloading file ${i + 1}/${job.files.length}`;

        const filePath = this.downloadFromDrive(fileId, jobDir);
        downloadedFiles.push(filePath);
      }

      // Continue with extraction
      job.files = downloadedFiles;
      await this.processImportJob(job);
    } catch (error) {
      await rm(jobDir, { recursive: true, force: true });
      throw error;
    }
  }

  private async extractZip(zipPath: string, extractDir: string): Promise<void> {
    // Use unzip command or a Node.js ZIP library
    const { exec } = await import('node:child_process');
    const { promisify } = await import('node:util');
    const execAsync = promisify(exec);

    await execAsync(`unzip -o -q "${zipPath}" -d "${extractDir}"`);
  }

  private async parseTakeoutDirectory(extractDir: string, job: ImportJob): Promise<TakeoutAsset[]> {
    const assets: TakeoutAsset[] = [];
    const albums = new Set<string>();

    // Find Google Photos directory
    const takeoutPath = await this.findGooglePhotosPath(extractDir);
    if (!takeoutPath) {
      job.progress.errors.push('Could not find Google Photos folder in Takeout');
      return assets;
    }

    // Collect all files
    const allFiles = await this.collectFiles(takeoutPath);
    const mediaFiles = allFiles.filter((f) => this.isMediaFile(f));
    const jsonFiles = new Map(allFiles.filter((f) => f.endsWith('.json')).map((f) => [f, f]));

    job.progress.total = mediaFiles.length;

    for (let i = 0; i < mediaFiles.length; i++) {
      const mediaPath = mediaFiles[i];
      job.progress.current = i + 1;
      job.progress.currentFile = path.basename(mediaPath);

      // Find matching JSON
      const jsonPath = this.findMatchingJson(mediaPath, jsonFiles);

      // Extract album name
      const albumName = this.extractAlbumName(mediaPath, takeoutPath);
      if (albumName) {
        albums.add(albumName);
      }

      // Parse metadata
      let metadata: GooglePhotosMetadata | undefined;
      if (jsonPath) {
        try {
          const content = await readFile(jsonPath, 'utf8');
          metadata = JSON.parse(content);
          job.progress.photosMatched++;
        } catch {
          job.progress.photosMissingMetadata++;
        }
      } else {
        job.progress.photosMissingMetadata++;
      }

      assets.push({ mediaPath, jsonPath, albumName, metadata });
    }

    job.progress.albumsFound = albums.size;
    return assets;
  }

  private async findGooglePhotosPath(extractDir: string): Promise<string | null> {
    const entries = await readdir(extractDir, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.isDirectory()) {
        const subPath = path.join(extractDir, entry.name);

        if (entry.name.toLowerCase() === 'google photos') {
          return subPath;
        }

        // Check subdirectories (Takeout/Google Photos)
        if (entry.name.toLowerCase() === 'takeout') {
          const takeoutEntries = await readdir(subPath, { withFileTypes: true });
          for (const te of takeoutEntries) {
            if (te.isDirectory() && te.name.toLowerCase() === 'google photos') {
              return path.join(subPath, te.name);
            }
          }
        }
      }
    }

    return null;
  }

  private async collectFiles(dir: string): Promise<string[]> {
    const files: string[] = [];

    const walk = async (currentDir: string): Promise<void> => {
      const entries = await readdir(currentDir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(currentDir, entry.name);
        if (entry.isDirectory()) {
          await walk(fullPath);
        } else if (entry.isFile()) {
          files.push(fullPath);
        }
      }
    };

    await walk(dir);
    return files;
  }

  private isMediaFile(filePath: string): boolean {
    const ext = path.extname(filePath).toLowerCase();
    const mediaExtensions = new Set([
      '.jpg',
      '.jpeg',
      '.png',
      '.gif',
      '.heic',
      '.heif',
      '.webp',
      '.tiff',
      '.tif',
      '.bmp',
      '.raw',
      '.dng',
      '.cr2',
      '.nef',
      '.arw',
      '.raf',
      '.orf',
      '.rw2',
      '.pef',
      '.srw',
      '.mp4',
      '.mov',
      '.avi',
      '.mkv',
      '.webm',
      '.m4v',
      '.3gp',
      '.mts',
      '.m2ts',
    ]);
    return mediaExtensions.has(ext);
  }

  private findMatchingJson(mediaPath: string, jsonFiles: Map<string, string>): string | undefined {
    const baseName = path.basename(mediaPath);
    const dir = path.dirname(mediaPath);

    // Try common patterns
    const candidates = [
      path.join(dir, `${baseName}.supplemental-metadata.json`),
      path.join(dir, `${baseName}.json`),
      path.join(dir, `${path.basename(baseName, path.extname(baseName))}.json`),
    ];

    for (const candidate of candidates) {
      if (jsonFiles.has(candidate)) {
        return candidate;
      }
    }

    // Handle truncated filenames (46 char limit)
    const truncatedName = baseName.slice(0, 46 - '.supplemental-metadata.json'.length);
    const truncatedCandidate = path.join(dir, `${truncatedName}.supplemental-metadata.json`);
    if (jsonFiles.has(truncatedCandidate)) {
      return truncatedCandidate;
    }

    return undefined;
  }

  private extractAlbumName(mediaPath: string, basePath: string): string | undefined {
    const relativePath = path.relative(basePath, mediaPath);
    const parts = relativePath.split(path.sep);

    if (parts.length < 2) {
      return undefined;
    }

    const albumFolder = parts[0];

    // Exclude year-based folders
    if (/^Photos from \d{4}$/.test(albumFolder)) {
      return undefined;
    }

    // Exclude special folders
    const excluded = ['Trash', 'Archive', 'Recently Deleted'];
    if (excluded.includes(albumFolder)) {
      return undefined;
    }

    return albumFolder;
  }

  private uploadAsset(_userId: string, asset: TakeoutAsset): void {
    // This would integrate with the existing asset upload service
    // For now, this is a placeholder that demonstrates the structure

    // 1. Create XMP sidecar from Google metadata if available
    // 2. Upload the asset file via the asset-media service
    // 3. Associate with album if albumName is set

    this.logger.debug(`Would upload: ${asset.mediaPath} (album: ${asset.albumName})`);
  }

  private downloadFromDrive(_fileId: string, _targetDir: string): string {
    // This would use Google Drive API to download the file
    // Requires OAuth token from the user's session

    // Placeholder - in production, this would:
    // 1. Use the stored Google OAuth credentials
    // 2. Call Drive API to download the file
    // 3. Save to targetDir

    throw new Error('Google Drive integration requires OAuth setup');
  }

  // Google Drive API methods (require OAuth integration)
  async getGoogleDriveFiles(accessToken: string): Promise<GoogleDriveFileDto[]> {
    // Query Google Drive for Takeout files
    // This is a placeholder - actual implementation would use googleapis

    const response = await fetch(
      'https://www.googleapis.com/drive/v3/files?' +
        new URLSearchParams({
          q: "name contains 'takeout-' and mimeType='application/zip'",
          fields: 'files(id,name,size,createdTime,mimeType)',
          orderBy: 'createdTime desc',
        }),
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );

    if (!response.ok) {
      throw new Error('Failed to fetch Google Drive files');
    }

    const data = await response.json();
    return data.files || [];
  }
}
