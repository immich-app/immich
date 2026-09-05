import { basename, dirname } from 'node:path';
import { getFileNameWithoutExtension, getFilenameExtension } from 'src/utils/file';
import { mimeTypes } from 'src/utils/mime-types';

export interface DuplicateMetadataAsset {
  originalFileName: string;
  originalPath: string;
  dateTimeOriginal: Date | null;
  make: string | null;
  model: string | null;
  autoStackId: string | null;
}

const renderedExtensions = new Set(['.jpg', '.jpeg', '.jpe', '.heic', '.heif']);
const pixelCaptureKeyPattern = /^(PXL_\d{8}_\d{9})(?:\..+)+$/i;

const normalizeText = (value: string) => value.normalize('NFKC').toLowerCase();
const normalizeOptionalText = (value: string | null) => normalizeText(value?.trim() ?? '');
const normalizeCaptureName = (filename: string) => normalizeText(getFileNameWithoutExtension(filename));
const getExtension = (filename: string) => getFilenameExtension(filename).toLowerCase();

const isWithinSeconds = (first: Date | null, second: Date | null, seconds: number) => {
  if (!first || !second) {
    return false;
  }

  return Math.abs(first.getTime() - second.getTime()) <= seconds * 1000;
};

const hasCompatibleDevice = (first: DuplicateMetadataAsset, second: DuplicateMetadataAsset) => {
  const firstMake = normalizeOptionalText(first.make);
  const secondMake = normalizeOptionalText(second.make);
  const firstModel = normalizeOptionalText(first.model);
  const secondModel = normalizeOptionalText(second.model);

  return (
    (!firstMake || !secondMake || firstMake === secondMake) &&
    (!firstModel || !secondModel || firstModel === secondModel)
  );
};

const hasSameDevice = (first: DuplicateMetadataAsset, second: DuplicateMetadataAsset) => {
  const firstMake = normalizeOptionalText(first.make);
  const secondMake = normalizeOptionalText(second.make);
  const firstModel = normalizeOptionalText(first.model);
  const secondModel = normalizeOptionalText(second.model);

  return (!!firstMake && firstMake === secondMake) || (!!firstModel && firstModel === secondModel);
};

const hasRelatedDirectories = (firstPath: string, secondPath: string) => {
  const firstDirectory = normalizeText(dirname(firstPath));
  const secondDirectory = normalizeText(dirname(secondPath));

  if (firstDirectory === secondDirectory) {
    return true;
  }

  return (
    (normalizeText(basename(firstDirectory)) === 'raw' && dirname(firstDirectory) === secondDirectory) ||
    (normalizeText(basename(secondDirectory)) === 'raw' && dirname(secondDirectory) === firstDirectory)
  );
};

export const isCameraRaw = (filename: string) => mimeTypes.isRaw(filename) && getExtension(filename) !== '.psd';

export const isRenderedImage = (filename: string) => renderedExtensions.has(getExtension(filename));

export const getPixelCaptureKey = (filename: string) => {
  const match = basename(filename).match(pixelCaptureKeyPattern);
  return match?.[1] ? normalizeText(match[1]) : null;
};

export const getMetadataCandidatePrefixes = (asset: DuplicateMetadataAsset) => {
  const prefixes = new Set<string>();
  if (isCameraRaw(asset.originalFileName) || isRenderedImage(asset.originalFileName)) {
    prefixes.add(getFileNameWithoutExtension(asset.originalFileName));
  }

  const pixelCaptureKey = getPixelCaptureKey(asset.originalFileName);
  if (pixelCaptureKey) {
    prefixes.add(pixelCaptureKey);
  }

  return [...prefixes];
};

export const isMetadataDuplicate = (first: DuplicateMetadataAsset, second: DuplicateMetadataAsset) => {
  if (!hasCompatibleDevice(first, second)) {
    return false;
  }

  const firstAutoStackId = first.autoStackId?.trim();
  const secondAutoStackId = second.autoStackId?.trim();
  if (
    firstAutoStackId &&
    firstAutoStackId === secondAutoStackId &&
    isWithinSeconds(first.dateTimeOriginal, second.dateTimeOriginal, 60)
  ) {
    return true;
  }

  const firstPixelCaptureKey = getPixelCaptureKey(first.originalFileName);
  const secondPixelCaptureKey = getPixelCaptureKey(second.originalFileName);
  if (
    firstPixelCaptureKey &&
    firstPixelCaptureKey === secondPixelCaptureKey &&
    isWithinSeconds(first.dateTimeOriginal, second.dateTimeOriginal, 15)
  ) {
    return true;
  }

  if (isCameraRaw(first.originalFileName) === isCameraRaw(second.originalFileName)) {
    return false;
  }

  if (!isRenderedImage(first.originalFileName) && !isRenderedImage(second.originalFileName)) {
    return false;
  }

  return (
    normalizeCaptureName(first.originalFileName) === normalizeCaptureName(second.originalFileName) &&
    isWithinSeconds(first.dateTimeOriginal, second.dateTimeOriginal, 2) &&
    (hasSameDevice(first, second) || hasRelatedDirectories(first.originalPath, second.originalPath))
  );
};
