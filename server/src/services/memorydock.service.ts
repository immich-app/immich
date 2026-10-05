import { BadGatewayException, BadRequestException, Injectable, ServiceUnavailableException } from '@nestjs/common';
import { createHash, randomUUID } from 'node:crypto';
import { extname, join, resolve, sep } from 'node:path';
import type { Asset } from 'src/database.js';
import type { UploadFile, UploadRequest } from 'src/types.js';
import { AssetMediaCreateDto, UploadFieldName } from 'src/dtos/asset-media.dto.js';
import { AuthDto } from 'src/dtos/auth.dto.js';
import { MemoryDockStyleTransformDto } from 'src/dtos/memorydock.dto.js';
import { AssetType, AssetVisibility, Permission } from 'src/enum.js';
import { AssetMediaService } from 'src/services/asset-media.service.js';
import { BaseService } from 'src/services/base.service.js';

const STYLE_SERVICE_URL_ENV = 'MEMORYDOCK_STYLE_SERVICE_URL';
const STYLE_SERVICE_TOKEN_ENV = 'MEMORYDOCK_STYLE_SERVICE_TOKEN';
const STYLE_OUTPUT_ROOT_ENV = 'MEMORYDOCK_STYLE_OUTPUT_ROOT';
const STYLE_WAIT_TIMEOUT_ENV = 'MEMORYDOCK_STYLE_WAIT_TIMEOUT_SECONDS';
const DEFAULT_STYLE_SERVICE_URL = 'http://memorydock_style_service:8734/v1/style-transforms';
const DEFAULT_STYLE_OUTPUT_ROOT = '/data/memorydock/style-output';
const DEFAULT_STYLE_WAIT_TIMEOUT_SECONDS = 120;
const POLL_INTERVAL_MS = 500;

type StyleSubmission = {
  jobId?: unknown;
  statusUrl?: unknown;
};

type StyleJob = {
  jobId?: unknown;
  status?: unknown;
  result?: unknown;
  error?: unknown;
};

@Injectable()
export class MemoryDockService extends BaseService {
  async createStyleTransform(auth: AuthDto, dto: MemoryDockStyleTransformDto): Promise<unknown> {
    await this.requireAccess({ auth, permission: Permission.AssetUpdate, ids: [dto.assetId] });

    const asset = await this.assetRepository.getById(dto.assetId);
    if (!asset || asset.type !== AssetType.Image) {
      throw new BadRequestException('Only image assets can be style transformed');
    }

    const upstreamUrl = this.getStyleServiceUrl();
    const submission = await this.submitStyleTransform(upstreamUrl, auth, asset, dto.style);
    const job = await this.waitForStyleJob(upstreamUrl, submission);
    const outputPath = this.getOutputPath(job.result);
    const imported = await this.importGeneratedAsset(auth, asset, outputPath, dto.style);

    return {
      jobId: submission.jobId,
      status: 'succeeded',
      style: dto.style,
      assetId: imported.id,
      assetStatus: imported.status,
      model: this.getResultModel(job.result),
    };
  }

  private async submitStyleTransform(
    upstreamUrl: URL,
    auth: AuthDto,
    asset: Asset,
    style: string,
  ): Promise<{ jobId: string; statusUrl: URL }> {
    const headers = new Headers({ 'Content-Type': 'application/json' });
    const token = process.env[STYLE_SERVICE_TOKEN_ENV]?.trim();
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    let response: Response;
    try {
      response = await fetch(upstreamUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          assetId: asset.id,
          style,
          userId: auth.user.id,
          sourcePath: asset.originalPath,
        }),
      });
    } catch (error) {
      throw new ServiceUnavailableException('MemoryDock style service request failed', { cause: error });
    }

    if (!response.ok) {
      throw new BadGatewayException(`MemoryDock style service failed with status ${response.status}`);
    }

    const payload = await this.getJson<StyleSubmission>(
      response,
      'MemoryDock style service returned an invalid response',
    );
    if (typeof payload.jobId !== 'string' || !payload.jobId) {
      throw new BadGatewayException('MemoryDock style service did not return a job ID');
    }
    if (typeof payload.statusUrl !== 'string' || !payload.statusUrl) {
      throw new BadGatewayException('MemoryDock style service did not return a job status URL');
    }

    const statusUrl = new URL(payload.statusUrl, upstreamUrl);
    if (statusUrl.origin !== upstreamUrl.origin) {
      throw new BadGatewayException('MemoryDock style service returned an invalid job status URL');
    }

    return { jobId: payload.jobId, statusUrl };
  }

  private async waitForStyleJob(upstreamUrl: URL, submission: { jobId: string; statusUrl: URL }): Promise<StyleJob> {
    const deadline = Date.now() + this.getWaitTimeoutMilliseconds();
    const headers = new Headers();
    const token = process.env[STYLE_SERVICE_TOKEN_ENV]?.trim();
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    while (Date.now() <= deadline) {
      let response: Response;
      try {
        response = await fetch(submission.statusUrl, { headers });
      } catch (error) {
        throw new ServiceUnavailableException('MemoryDock style service status request failed', { cause: error });
      }

      if (!response.ok) {
        throw new BadGatewayException(`MemoryDock style service status failed with status ${response.status}`);
      }

      const job = await this.getJson<StyleJob>(response, 'MemoryDock style service returned an invalid job status');
      if (job.jobId !== submission.jobId || typeof job.status !== 'string') {
        throw new BadGatewayException('MemoryDock style service returned an invalid job status');
      }
      if (job.status === 'succeeded') {
        return job;
      }
      if (job.status === 'failed') {
        const message = typeof job.error === 'string' && job.error ? `: ${job.error}` : '';
        throw new BadGatewayException(`MemoryDock style transform failed${message}`);
      }
      if (job.status !== 'queued' && job.status !== 'running') {
        throw new BadGatewayException('MemoryDock style service returned an unknown job status');
      }

      await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
    }

    throw new ServiceUnavailableException('MemoryDock style transform timed out');
  }

  private async importGeneratedAsset(
    auth: AuthDto,
    sourceAsset: Asset,
    outputPath: string,
    style: string,
  ): Promise<{ id: string; status: string }> {
    const output = await this.storageRepository.readFile(outputPath);
    if (output.length === 0) {
      throw new BadGatewayException('MemoryDock style service generated an empty image');
    }

    const extension = extname(outputPath).toLowerCase();
    if (!['.jpg', '.jpeg', '.png', '.webp'].includes(extension)) {
      throw new BadGatewayException('MemoryDock style service generated an unsupported image type');
    }

    const originalName = this.getGeneratedFilename(sourceAsset.originalFileName, style, extension);
    const file: UploadFile = {
      uuid: randomUUID(),
      checksum: createHash('sha1').update(output).digest(),
      originalPath: '',
      originalName,
      size: output.length,
    };
    const uploadRequest: UploadRequest = {
      auth,
      fieldName: UploadFieldName.ASSET_DATA,
      file,
      body: { filename: originalName },
    };
    const uploadService = BaseService.create(AssetMediaService, this);
    const uploadFolder = uploadService.getUploadFolder(uploadRequest);
    file.originalPath = join(uploadFolder, uploadService.getUploadFilename(uploadRequest));

    await this.storageRepository.copyFile(outputPath, file.originalPath);

    const dto: AssetMediaCreateDto = {
      fileCreatedAt: sourceAsset.fileCreatedAt,
      fileModifiedAt: new Date(),
      filename: originalName,
      isFavorite: false,
      visibility: AssetVisibility.Timeline,
    };
    const response = await uploadService.uploadAsset(auth, dto, file);
    return response;
  }

  private getStyleServiceUrl(): URL {
    const value = process.env[STYLE_SERVICE_URL_ENV]?.trim() || DEFAULT_STYLE_SERVICE_URL;

    let url: URL;
    try {
      url = new URL(value);
    } catch (error) {
      throw new ServiceUnavailableException('MemoryDock style service URL is invalid', { cause: error });
    }

    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) {
      throw new ServiceUnavailableException('MemoryDock style service URL is invalid');
    }

    return url;
  }

  private getOutputPath(result: unknown): string {
    if (!result || typeof result !== 'object' || !('outputPath' in result) || typeof result.outputPath !== 'string') {
      throw new BadGatewayException('MemoryDock style service did not return an output image');
    }

    const root = resolve(process.env[STYLE_OUTPUT_ROOT_ENV]?.trim() || DEFAULT_STYLE_OUTPUT_ROOT);
    const outputPath = resolve(result.outputPath);
    if (outputPath !== root && !outputPath.startsWith(`${root}${sep}`)) {
      throw new BadGatewayException('MemoryDock style service returned an invalid output image path');
    }

    return outputPath;
  }

  private getResultModel(result: unknown): string | undefined {
    if (!result || typeof result !== 'object' || !('model' in result) || typeof result.model !== 'string') {
      return;
    }
    return result.model;
  }

  private getGeneratedFilename(sourceName: string, style: string, extension: string): string {
    const suffix = extname(sourceName);
    const stem = sourceName.slice(0, Math.max(0, sourceName.length - suffix.length)) || 'memorydock';
    return `${stem}-${style}${extension === '.jpeg' ? '.jpg' : extension}`;
  }

  private getWaitTimeoutMilliseconds(): number {
    const value = Number(process.env[STYLE_WAIT_TIMEOUT_ENV] ?? DEFAULT_STYLE_WAIT_TIMEOUT_SECONDS);
    const seconds = Number.isFinite(value) ? Math.min(Math.max(value, 5), 600) : DEFAULT_STYLE_WAIT_TIMEOUT_SECONDS;
    return seconds * 1000;
  }

  private async getJson<T>(response: Response, message: string): Promise<T> {
    try {
      return (await response.json()) as T;
    } catch (error) {
      throw new BadGatewayException(message, { cause: error });
    }
  }
}
