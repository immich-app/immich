import { Duration } from 'luxon';
import { readFileSync } from 'node:fs';
import { SemVer } from 'semver';
import { DatabaseExtension, ExifOrientation } from 'src/enum';

export const POSTGRES_VERSION_RANGE = '>=14.0.0';
export const VECTORS_VERSION_RANGE = '>=0.2 <0.4';
export const VECTOR_VERSION_RANGE = '>=0.5 <1';

export const NEXT_RELEASE = 'NEXT_RELEASE';
export const LIFECYCLE_EXTENSION = 'x-immich-lifecycle';
export const DEPRECATED_IN_PREFIX = 'This property was deprecated in ';
export const ADDED_IN_PREFIX = 'This property was added in ';

export const JOBS_ASSET_PAGINATION_SIZE = 1000;
export const JOBS_LIBRARY_PAGINATION_SIZE = 10_000;

export const EXTENSION_NAMES: Record<DatabaseExtension, string> = {
  cube: 'cube',
  earthdistance: 'earthdistance',
  vector: 'pgvector',
  vectors: 'pgvecto.rs',
} as const;

export const SALT_ROUNDS = 10;

export const IWorker = 'IWorker';

const { version } = JSON.parse(readFileSync('./package.json', 'utf8'));
export const serverVersion = new SemVer(version);

export const AUDIT_LOG_MAX_DURATION = Duration.fromObject({ days: 100 });
export const ONE_HOUR = Duration.fromObject({ hours: 1 });

export const APP_MEDIA_LOCATION = process.env.IMMICH_MEDIA_LOCATION || './upload';

export const MACHINE_LEARNING_PING_TIMEOUT = Number(process.env.MACHINE_LEARNING_PING_TIMEOUT || 2000);
export const MACHINE_LEARNING_AVAILABILITY_BACKOFF_TIME = Number(
  process.env.MACHINE_LEARNING_AVAILABILITY_BACKOFF_TIME || 30_000,
);

export const citiesFile = 'cities500.txt';

export const MOBILE_REDIRECT = 'app.immich:///oauth-callback';
export const LOGIN_URL = '/auth/login?autoLaunch=0';

export const excludePaths = ['/.well-known/immich', '/custom.css', '/favicon.ico'];

export const FACE_THUMBNAIL_SIZE = 250;

type ModelInfo = { dimSize: number };
export const CLIP_MODEL_INFO: Record<string, ModelInfo> = {
  RN101__openai: { dimSize: 512 },
  RN101__yfcc15m: { dimSize: 512 },
  'ViT-B-16__laion400m_e31': { dimSize: 512 },
  'ViT-B-16__laion400m_e32': { dimSize: 512 },
  'ViT-B-16__openai': { dimSize: 512 },
  'ViT-B-32__laion2b-s34b-b79k': { dimSize: 512 },
  'ViT-B-32__laion2b_e16': { dimSize: 512 },
  'ViT-B-32__laion400m_e31': { dimSize: 512 },
  'ViT-B-32__laion400m_e32': { dimSize: 512 },
  'ViT-B-32__openai': { dimSize: 512 },
  'XLM-Roberta-Base-ViT-B-32__laion5b_s13b_b90k': { dimSize: 512 },
  'XLM-Roberta-Large-Vit-B-32': { dimSize: 512 },
  RN50x4__openai: { dimSize: 640 },
  'ViT-B-16-plus-240__laion400m_e31': { dimSize: 640 },
  'ViT-B-16-plus-240__laion400m_e32': { dimSize: 640 },
  'XLM-Roberta-Large-Vit-B-16Plus': { dimSize: 640 },
  'LABSE-Vit-L-14': { dimSize: 768 },
  RN50x16__openai: { dimSize: 768 },
  'ViT-B-16-SigLIP-256__webli': { dimSize: 768 },
  'ViT-B-16-SigLIP-384__webli': { dimSize: 768 },
  'ViT-B-16-SigLIP-512__webli': { dimSize: 768 },
  'ViT-B-16-SigLIP-i18n-256__webli': { dimSize: 768 },
  'ViT-B-16-SigLIP__webli': { dimSize: 768 },
  'ViT-L-14-336__openai': { dimSize: 768 },
  'ViT-L-14-quickgelu__dfn2b': { dimSize: 768 },
  'ViT-L-14__laion2b-s32b-b82k': { dimSize: 768 },
  'ViT-L-14__laion400m_e31': { dimSize: 768 },
  'ViT-L-14__laion400m_e32': { dimSize: 768 },
  'ViT-L-14__openai': { dimSize: 768 },
  'XLM-Roberta-Large-Vit-L-14': { dimSize: 768 },
  'nllb-clip-base-siglip__mrl': { dimSize: 768 },
  'nllb-clip-base-siglip__v1': { dimSize: 768 },
  RN50__cc12m: { dimSize: 1024 },
  RN50__openai: { dimSize: 1024 },
  RN50__yfcc15m: { dimSize: 1024 },
  RN50x64__openai: { dimSize: 1024 },
  'ViT-H-14-378-quickgelu__dfn5b': { dimSize: 1024 },
  'ViT-H-14-quickgelu__dfn5b': { dimSize: 1024 },
  'ViT-H-14__laion2b-s32b-b79k': { dimSize: 1024 },
  'ViT-L-16-SigLIP-256__webli': { dimSize: 1024 },
  'ViT-L-16-SigLIP-384__webli': { dimSize: 1024 },
  'ViT-g-14__laion2b-s12b-b42k': { dimSize: 1024 },
  'XLM-Roberta-Large-ViT-H-14__frozen_laion5b_s13b_b90k': { dimSize: 1024 },
  'ViT-SO400M-14-SigLIP-384__webli': { dimSize: 1152 },
  'nllb-clip-large-siglip__mrl': { dimSize: 1152 },
  'nllb-clip-large-siglip__v1': { dimSize: 1152 },
};

type SharpRotationData = {
  angle?: number;
  flip?: boolean;
  flop?: boolean;
};
export const ORIENTATION_TO_SHARP_ROTATION: Record<ExifOrientation, SharpRotationData> = {
  [ExifOrientation.Horizontal]: { angle: 0 },
  [ExifOrientation.MirrorHorizontal]: { angle: 0, flop: true },
  [ExifOrientation.Rotate180]: { angle: 180 },
  [ExifOrientation.MirrorVertical]: { angle: 180, flop: true },
  [ExifOrientation.MirrorHorizontalRotate270CW]: { angle: 270, flip: true },
  [ExifOrientation.Rotate90CW]: { angle: 90 },
  [ExifOrientation.MirrorHorizontalRotate90CW]: { angle: 90, flip: true },
  [ExifOrientation.Rotate270CW]: { angle: 270 },
} as const;
