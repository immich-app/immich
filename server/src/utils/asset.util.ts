import { BadRequestException } from '@nestjs/common';
import { StorageCore } from 'src/cores/storage.core';
import { AssetFile } from 'src/database';
import { BulkIdErrorReason, BulkIdResponseDto } from 'src/dtos/asset-ids.response.dto';
import { UploadFieldName } from 'src/dtos/asset-media.dto';
import { AuthDto } from 'src/dtos/auth.dto';
import { AssetFileType, AssetType, AssetVisibility, Permission, VideoSamplingStrategy } from 'src/enum';
import { AuthRequest } from 'src/middleware/auth.guard';
import { AccessRepository } from 'src/repositories/access.repository';
import { AssetRepository } from 'src/repositories/asset.repository';
import { EventRepository } from 'src/repositories/event.repository';
import { PartnerRepository } from 'src/repositories/partner.repository';
import { IBulkAsset, ImmichFile, UploadFile, UploadRequest } from 'src/types';
import { checkAccess } from 'src/utils/access';

export const getAssetFile = (files: AssetFile[], type: AssetFileType, { isEdited }: { isEdited: boolean }) => {
  return files.find((file) => file.type === type && file.isEdited === isEdited);
};

export const getAssetFiles = (files: AssetFile[]) => ({
  fullsizeFile: getAssetFile(files, AssetFileType.FullSize, { isEdited: false }),
  previewFile: getAssetFile(files, AssetFileType.Preview, { isEdited: false }),
  thumbnailFile: getAssetFile(files, AssetFileType.Thumbnail, { isEdited: false }),
  sidecarFile: getAssetFile(files, AssetFileType.Sidecar, { isEdited: false }),

  editedFullsizeFile: getAssetFile(files, AssetFileType.FullSize, { isEdited: true }),
  editedPreviewFile: getAssetFile(files, AssetFileType.Preview, { isEdited: true }),
  editedThumbnailFile: getAssetFile(files, AssetFileType.Thumbnail, { isEdited: true }),

  encodedVideoFile: getAssetFile(files, AssetFileType.EncodedVideo, { isEdited: false }),
});

export const addAssets = async (
  auth: AuthDto,
  repositories: { access: AccessRepository; bulk: IBulkAsset },
  dto: { parentId: string; assetIds: string[] },
) => {
  const { access, bulk } = repositories;
  const existingAssetIds = await bulk.getAssetIds(dto.parentId, dto.assetIds);
  const notPresentAssetIds = dto.assetIds.filter((id) => !existingAssetIds.has(id));
  const allowedAssetIds = await checkAccess(access, {
    auth,
    permission: Permission.AssetShare,
    ids: notPresentAssetIds,
  });

  const results: BulkIdResponseDto[] = [];
  for (const assetId of dto.assetIds) {
    const hasAsset = existingAssetIds.has(assetId);
    if (hasAsset) {
      results.push({ id: assetId, success: false, error: BulkIdErrorReason.DUPLICATE });
      continue;
    }

    const hasAccess = allowedAssetIds.has(assetId);
    if (!hasAccess) {
      results.push({ id: assetId, success: false, error: BulkIdErrorReason.NO_PERMISSION });
      continue;
    }

    existingAssetIds.add(assetId);
    results.push({ id: assetId, success: true });
  }

  const newAssetIds = results.filter(({ success }) => success).map(({ id }) => id);
  if (newAssetIds.length > 0) {
    await bulk.addAssetIds(dto.parentId, newAssetIds);
  }

  return results;
};

export const removeAssets = async (
  auth: AuthDto,
  repositories: { access: AccessRepository; bulk: IBulkAsset },
  dto: { parentId: string; assetIds: string[]; canAlwaysRemove: Permission },
) => {
  const { access, bulk } = repositories;

  // check if the user can always remove from the parent album, memory, etc.
  const canAlwaysRemove = await checkAccess(access, { auth, permission: dto.canAlwaysRemove, ids: [dto.parentId] });
  const existingAssetIds = await bulk.getAssetIds(dto.parentId, dto.assetIds);
  const allowedAssetIds = canAlwaysRemove.has(dto.parentId)
    ? existingAssetIds
    : await checkAccess(access, { auth, permission: Permission.AssetShare, ids: existingAssetIds });

  const results: BulkIdResponseDto[] = [];
  for (const assetId of dto.assetIds) {
    const hasAsset = existingAssetIds.has(assetId);
    if (!hasAsset) {
      results.push({ id: assetId, success: false, error: BulkIdErrorReason.NOT_FOUND });
      continue;
    }

    const hasAccess = allowedAssetIds.has(assetId);
    if (!hasAccess) {
      results.push({ id: assetId, success: false, error: BulkIdErrorReason.NO_PERMISSION });
      continue;
    }

    existingAssetIds.delete(assetId);
    results.push({ id: assetId, success: true });
  }

  const removedIds = results.filter(({ success }) => success).map(({ id }) => id);
  if (removedIds.length > 0) {
    await bulk.removeAssetIds(dto.parentId, removedIds);
  }

  return results;
};

export type PartnerIdOptions = {
  userId: string;
  repository: PartnerRepository;
  /** only include partners with `inTimeline: true` */
  timelineEnabled?: boolean;
};
export const getMyPartnerIds = async ({ userId, repository, timelineEnabled }: PartnerIdOptions) => {
  const partnerIds = new Set<string>();
  const partners = await repository.getAll(userId);
  for (const partner of partners) {
    // ignore deleted users
    if (!partner.sharedBy || !partner.sharedWith) {
      continue;
    }

    // wrong direction
    if (partner.sharedWithId !== userId) {
      continue;
    }

    if (timelineEnabled && !partner.inTimeline) {
      continue;
    }

    partnerIds.add(partner.sharedById);
  }

  return [...partnerIds];
};

export type AssetHookRepositories = { asset: AssetRepository; event: EventRepository };

export const onBeforeLink = async (
  { asset: assetRepository, event: eventRepository }: AssetHookRepositories,
  { userId, livePhotoVideoId }: { userId: string; livePhotoVideoId: string },
) => {
  const motionAsset = await assetRepository.getById(livePhotoVideoId);
  if (!motionAsset) {
    throw new BadRequestException('Live photo video not found');
  }
  if (motionAsset.type !== AssetType.Video) {
    throw new BadRequestException('Live photo video must be a video');
  }
  if (motionAsset.ownerId !== userId) {
    throw new BadRequestException('Live photo video does not belong to the user');
  }

  if (motionAsset && motionAsset.visibility === AssetVisibility.Timeline) {
    await assetRepository.update({ id: livePhotoVideoId, visibility: AssetVisibility.Hidden });
    await eventRepository.emit('AssetHide', { assetId: motionAsset.id, userId });
  }
};

export const onBeforeUnlink = async (
  { asset: assetRepository }: AssetHookRepositories,
  { livePhotoVideoId }: { livePhotoVideoId: string },
) => {
  const motion = await assetRepository.getById(livePhotoVideoId);
  if (!motion) {
    return null;
  }

  if (StorageCore.isAndroidMotionPath(motion.originalPath)) {
    throw new BadRequestException('Cannot unlink Android motion photos');
  }

  return motion;
};

export const onAfterUnlink = async (
  { asset: assetRepository, event: eventRepository }: AssetHookRepositories,
  { userId, livePhotoVideoId, visibility }: { userId: string; livePhotoVideoId: string; visibility: AssetVisibility },
) => {
  await assetRepository.update({ id: livePhotoVideoId, visibility });
  await eventRepository.emit('AssetShow', { assetId: livePhotoVideoId, userId });
};

export function mapToUploadFile(file: ImmichFile): UploadFile {
  return {
    uuid: file.uuid,
    checksum: file.checksum,
    originalPath: file.path,
    originalName: Buffer.from(file.originalname, 'latin1').toString('utf8'),
    size: file.size,
  };
}

export const asUploadRequest = (request: AuthRequest, file: Express.Multer.File): UploadRequest => {
  return {
    auth: request.user || null,
    body: request.body,
    fieldName: file.fieldname as UploadFieldName,
    file: mapToUploadFile(file as ImmichFile),
  };
};

const isFlipped = (orientation?: string | null) => {
  const value = Number(orientation);
  return value && [5, 6, 7, 8, -90, 90].includes(value);
};

export const getDimensions = ({
  exifImageHeight: height,
  exifImageWidth: width,
  orientation,
}: {
  exifImageHeight: number | null;
  exifImageWidth: number | null;
  orientation: string | null;
}) => {
  if (!width || !height) {
    return { width: 0, height: 0 };
  }

  if (isFlipped(orientation)) {
    return { width: height, height: width };
  }

  return { width, height };
};

export const isPanorama = (asset: { projectionType: string | null; originalFileName: string }) => {
  return asset.projectionType === 'EQUIRECTANGULAR' || asset.originalFileName.toLowerCase().endsWith('.insp');
};

/** Parse `asset.duration` (e.g. from metadata) to milliseconds. */
export const parseAssetDurationStringToMs = (duration: string | null | undefined): number | null => {
  if (duration == null || duration.trim() === '') {
    return null;
  }
  const segments = duration
    .trim()
    .split(':')
    .map((s) => Number.parseFloat(s));
  if (segments.some((n) => Number.isNaN(n))) {
    return null;
  }
  let ms = 0;
  if (segments.length === 3) {
    const [h, m, s] = segments;
    ms = ((h * 60 + m) * 60 + s) * 1000;
  } else if (segments.length === 2) {
    const [m, s] = segments;
    ms = (m * 60 + s) * 1000;
  } else if (segments.length === 1) {
    ms = segments[0]! * 1000;
  } else {
    return null;
  }
  return Number.isFinite(ms) ? Math.round(ms) : null;
};

/** Hard cap on distinct time-based frame extractions per video (face detection + CLIP). */
export const MAX_VIDEO_SAMPLING_FRAMES = 32;

export type VideoSamplingConfigInput = {
  strategy: VideoSamplingStrategy;
  samplingFractions: number[];
  uniformFrameCount: number;
  fractionStep: number;
};

const clampOpenUnit = (x: number): number => Math.min(0.999999, Math.max(0.000001, x));

const sortUniqueFractions = (fractions: number[]): number[] => {
  const sorted = [...fractions].map(clampOpenUnit).sort((a, b) => a - b);
  const out: number[] = [];
  for (const f of sorted) {
    if (out.length === 0 || Math.abs(f - out[out.length - 1]!) > 1e-9) {
      out.push(f);
    }
  }
  return out;
};

/**
 * Resolves configured video sampling into ordered unique fractions in (0, 1) for seek positions.
 */
export const resolveVideoSamplingFractions = (vs: VideoSamplingConfigInput): number[] => {
  let raw: number[] = [];
  switch (vs.strategy) {
    case VideoSamplingStrategy.Fractions:
      raw = [...vs.samplingFractions];
      break;
    case VideoSamplingStrategy.UniformCount: {
      const n = vs.uniformFrameCount;
      if (n >= 1) {
        for (let i = 1; i <= n; i++) {
          raw.push(i / (n + 1));
        }
      }
      break;
    }
    case VideoSamplingStrategy.FixedStep: {
      const step = vs.fractionStep;
      if (step > 0) {
        for (let i = 1; i * step < 1 - 1e-9 && raw.length < MAX_VIDEO_SAMPLING_FRAMES; i++) {
          const v = Number((i * step).toFixed(9));
          raw.push(clampOpenUnit(v));
        }
      }
      break;
    }
    default:
      raw = [...vs.samplingFractions];
  }
  return sortUniqueFractions(raw).slice(0, MAX_VIDEO_SAMPLING_FRAMES);
};

/** Sample timestamps in ms along [0, durationMs] from fractional positions in (0, 1). */
export const getVideoSamplingOffsetsMs = (durationMs: number, fractions: number[]): number[] => {
  const d = Math.max(0, durationMs);
  const q = (ratio: number) => Math.min(d, Math.max(0, Math.floor(ratio * d)));
  return fractions.map((ratio) => q(ratio));
};

/**
 * After {@link getVideoSamplingOffsetsMs}, several ratios can map to the same integer millisecond
 * on very short clips; dedupe preserves first-seen order so we do not run redundant ffmpeg seeks.
 */
export const dedupeSamplingOffsetsMs = (offsetsMs: number[]): number[] => {
  const seen = new Set<number>();
  const out: number[] = [];
  for (const ms of offsetsMs) {
    if (!seen.has(ms)) {
      seen.add(ms);
      out.push(ms);
    }
  }
  return out;
};
