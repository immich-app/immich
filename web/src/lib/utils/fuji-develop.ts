import { getFilenameExtension } from '$lib/utils/asset-utils';
import type { AssetResponseDto } from '@immich/sdk';
import {
  getFilmSimulationGraphic,
  isFujiFilmSimulationSlug,
  type FujiFilmSimulationSlug,
} from './film-simulation';

export const FUJI_DEVELOP_ACTION = 'fuji_develop' as const;
export const FUJI_DEVELOP_PROCESS_MODEL = 'lightroom-pv2012-independent-v6' as const;
export const FUJI_DEVELOP_READY_TIMEOUT_MS = 10 * 60 * 1000;

export type FujiDevelopSettings = {
  exposure: number;
  contrast: number;
  highlights: number;
  shadows: number;
  whites: number;
  blacks: number;
  temperature: number | null;
  tint: number | null;
  vibrance: number;
  saturation: number;
};

export type FujiDevelopParameters = FujiDevelopSettings & {
  profileSlug: FujiFilmSimulationSlug;
  processModel: typeof FUJI_DEVELOP_PROCESS_MODEL;
};

export type StoredAssetEdit = {
  id?: string;
  action: string;
  parameters: Record<string, unknown>;
};

export type FujiDevelopEdit = StoredAssetEdit & {
  action: typeof FUJI_DEVELOP_ACTION;
  parameters: FujiDevelopParameters;
};

export const FUJI_DEVELOP_CONTROL_CONFIG = {
  exposure: { minimum: -5, maximum: 5, step: 0.05 },
  contrast: { minimum: -100, maximum: 100, step: 1 },
  highlights: { minimum: -100, maximum: 100, step: 1 },
  shadows: { minimum: -100, maximum: 100, step: 1 },
  whites: { minimum: -100, maximum: 100, step: 1 },
  blacks: { minimum: -100, maximum: 100, step: 1 },
  temperature: { minimum: 2000, maximum: 50_000, step: 50 },
  tint: { minimum: -150, maximum: 150, step: 1 },
  vibrance: { minimum: -100, maximum: 100, step: 1 },
  saturation: { minimum: -100, maximum: 100, step: 1 },
} as const;

export const defaultFujiDevelopSettings = (): FujiDevelopSettings => ({
  exposure: 0,
  contrast: 0,
  highlights: 0,
  shadows: 0,
  whites: 0,
  blacks: 0,
  temperature: null,
  tint: null,
  vibrance: 0,
  saturation: 0,
});

const isBoundedNumber = (value: unknown, minimum: number, maximum: number): value is number =>
  typeof value === 'number' && Number.isFinite(value) && value >= minimum && value <= maximum;

export const isFujiDevelopParameters = (value: unknown): value is FujiDevelopParameters => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const parameters = value as Record<string, unknown>;
  if (
    !isFujiFilmSimulationSlug(parameters.profileSlug) ||
    parameters.processModel !== FUJI_DEVELOP_PROCESS_MODEL
  ) {
    return false;
  }

  for (const name of [
    'exposure',
    'contrast',
    'highlights',
    'shadows',
    'whites',
    'blacks',
    'vibrance',
    'saturation',
  ] as const) {
    const config = FUJI_DEVELOP_CONTROL_CONFIG[name];
    if (!isBoundedNumber(parameters[name], config.minimum, config.maximum)) {
      return false;
    }
  }

  for (const name of ['temperature', 'tint'] as const) {
    const config = FUJI_DEVELOP_CONTROL_CONFIG[name];
    const setting = parameters[name];
    if (setting !== null && !isBoundedNumber(setting, config.minimum, config.maximum)) {
      return false;
    }
  }

  return true;
};

export const isFujiDevelopEdit = (edit: StoredAssetEdit): edit is FujiDevelopEdit =>
  edit.action === FUJI_DEVELOP_ACTION && isFujiDevelopParameters(edit.parameters);

export const findFujiDevelopEdit = (edits: readonly StoredAssetEdit[]): FujiDevelopEdit | undefined =>
  edits.find(isFujiDevelopEdit);

export const createFujiDevelopParameters = (
  profileSlug: FujiFilmSimulationSlug,
  settings: FujiDevelopSettings,
): FujiDevelopParameters => ({
  profileSlug,
  processModel: FUJI_DEVELOP_PROCESS_MODEL,
  ...settings,
});

/**
 * Replace only the Fuji develop edit and retain every native Immich edit.
 * Crop remains first, matching the server's existing edit-order contract.
 */
export const mergeFujiDevelopEdit = (
  edits: readonly StoredAssetEdit[],
  parameters: FujiDevelopParameters,
): StoredAssetEdit[] => {
  const retained = edits
    .filter((edit) => edit.action !== FUJI_DEVELOP_ACTION)
    .map(({ action, parameters }) => ({ action, parameters }));
  const crops = retained.filter((edit) => edit.action === 'crop');
  const rest = retained.filter((edit) => edit.action !== 'crop');

  return [...crops, ...rest, { action: FUJI_DEVELOP_ACTION, parameters }];
};

export const fujiDevelopSignature = (parameters: FujiDevelopParameters): string =>
  JSON.stringify({
    profileSlug: parameters.profileSlug,
    processModel: parameters.processModel,
    exposure: parameters.exposure,
    contrast: parameters.contrast,
    highlights: parameters.highlights,
    shadows: parameters.shadows,
    whites: parameters.whites,
    blacks: parameters.blacks,
    temperature: parameters.temperature,
    tint: parameters.tint,
    vibrance: parameters.vibrance,
    saturation: parameters.saturation,
  });

export const getAsShotFujiProfileSlug = (filmMode: string | null | undefined): FujiFilmSimulationSlug =>
  (filmMode && getFilmSimulationGraphic(filmMode)?.slug) || 'provia-standard';

export const isFujiXt5RawAsset = (asset: AssetResponseDto): boolean => {
  const extension = getFilenameExtension(asset.originalFileName) || getFilenameExtension(asset.originalPath);
  const make = asset.exifInfo?.make?.trim().toUpperCase();
  const model = asset.exifInfo?.model?.trim().toUpperCase();
  return extension === 'raf' && make === 'FUJIFILM' && model === 'X-T5';
};
