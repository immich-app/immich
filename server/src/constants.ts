import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { SemVer } from 'semver';
import {
  ApiTag,
  AudioCodec,
  DatabaseExtension,
  ExifOrientation,
  TranscodeHardwareAcceleration,
  VectorIndex,
  VideoCodec,
} from 'src/enum';

export const IMMICH_SERVER_START = 'Immich Server is listening';

export const ErrorMessages = {
  InconsistentMediaLocation:
    'Detected an inconsistent media location. For more information, see https://docs.immich.app/errors#inconsistent-media-location',
  SchemaDrift: `Detected schema drift. For more information, see https://docs.immich.app/errors#schema-drift`,
  TypeOrmUpgrade: 'Invalid upgrade path. For more information, see https://docs.immich.app/errors/#typeorm-upgrade',
};

export const POSTGRES_VERSION_RANGE = '>=14.0.0';
export const VECTORCHORD_VERSION_RANGE = '>=0.3 <2';
export const VECTOR_VERSION_RANGE = '>=0.5 <1';

export const JOBS_ASSET_PAGINATION_SIZE = 1000;
export const JOBS_LIBRARY_PAGINATION_SIZE = 10_000;

export const EXTENSION_NAMES: Record<DatabaseExtension, string> = {
  cube: 'cube',
  earthdistance: 'earthdistance',
  vector: 'pgvector',
  vchord: 'VectorChord',
} as const;

export const VECTOR_EXTENSIONS = [DatabaseExtension.VectorChord, DatabaseExtension.Vector] as const;

export const VECTOR_INDEX_TABLES = {
  [VectorIndex.Clip]: 'smart_search',
  [VectorIndex.Face]: 'face_search',
} as const;

export const VECTORCHORD_LIST_SLACK_FACTOR = 1.2;

export const SALT_ROUNDS = 10;
// Syntactically valid bcrypt hash used in login() preventing timing-based user enumeration.
export const LOGIN_DUMMY_HASH = '$2b$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZabcde';

export const IWorker = 'IWorker';

// eslint-disable-next-line unicorn/prefer-module
const basePath = dirname(__filename);
const packageFile = join(basePath, '..', 'package.json');
const { version } = JSON.parse(readFileSync(packageFile, 'utf8'));
export const serverVersion = new SemVer(version);

export const citiesFile = 'cities500.txt';
export const reverseGeocodeMaxDistance = 25_000;

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
  'ViT-B-16-SigLIP2__webli': { dimSize: 768 },
  'ViT-B-32-SigLIP2-256__webli': { dimSize: 768 },
  'ViT-L-16-SigLIP2-256__webli': { dimSize: 1024 },
  'ViT-L-16-SigLIP2-384__webli': { dimSize: 1024 },
  'ViT-L-16-SigLIP2-512__webli': { dimSize: 1024 },
  'ViT-SO400M-14-SigLIP2__webli': { dimSize: 1152 },
  'ViT-SO400M-14-SigLIP2-378__webli': { dimSize: 1152 },
  'ViT-SO400M-16-SigLIP2-256__webli': { dimSize: 1152 },
  'ViT-SO400M-16-SigLIP2-384__webli': { dimSize: 1152 },
  'ViT-SO400M-16-SigLIP2-512__webli': { dimSize: 1152 },
  'ViT-gopt-16-SigLIP2-256__webli': { dimSize: 1536 },
  'ViT-gopt-16-SigLIP2-384__webli': { dimSize: 1536 },
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

export const endpointTags: Record<ApiTag, string> = {
  [ApiTag.Activities]: 'An activity is a like or a comment made by a user on an asset or album.',
  [ApiTag.Albums]: 'An album is a collection of assets that can be shared with other users or via shared links.',
  [ApiTag.ApiKeys]: 'An api key can be used to programmatically access the Immich API.',
  [ApiTag.Assets]: 'An asset is an image or video that has been uploaded to Immich.',
  [ApiTag.Authentication]: 'Endpoints related to user authentication, including OAuth.',
  [ApiTag.AuthenticationAdmin]: 'Administrative endpoints related to authentication.',
  [ApiTag.DatabaseBackups]: 'Manage backups of the Immich database.',
  [ApiTag.Deprecated]: 'Deprecated endpoints that are planned for removal in the next major release.',
  [ApiTag.Download]: 'Endpoints for downloading assets or collections of assets.',
  [ApiTag.Duplicates]: 'Endpoints for managing and identifying duplicate assets.',
  [ApiTag.Faces]:
    'A face is a detected human face within an asset, which can be associated with a person. Faces are normally detected via machine learning, but can also be created manually.',
  [ApiTag.Integrity]: 'Endpoints for viewing and managing integrity reports.',
  [ApiTag.Jobs]:
    'Queues and background jobs are used for processing tasks asynchronously. Queues can be paused and resumed as needed.',
  [ApiTag.Libraries]:
    'An external library is made up of input file paths or expressions that are scanned for asset files. Discovered files are automatically imported. Assets much be unique within a library, but can be duplicated across libraries. Each user has a default upload library, and can have one or more external libraries.',
  [ApiTag.Maintenance]: 'Maintenance mode allows you to put Immich in a read-only state to perform various operations.',
  [ApiTag.Map]:
    'Map endpoints include supplemental functionality related to geolocation, such as reverse geocoding and retrieving map markers for assets with geolocation data.',
  [ApiTag.Memories]:
    'A memory is a specialized collection of assets with dedicated viewing implementations in the web and mobile clients. A memory includes fields related to visibility and are automatically generated per user via a background job.',
  [ApiTag.Notifications]:
    'A notification is a specialized message sent to users to inform them of important events. Currently, these notifications are only shown in the Immich web application.',
  [ApiTag.NotificationsAdmin]: 'Notification administrative endpoints.',
  [ApiTag.Partners]: 'A partner is a link with another user that allows sharing of assets between two users.',
  [ApiTag.People]:
    'A person is a collection of faces, which can be favorited and named. A person can also be merged into another person. People are automatically created via the face recognition job.',
  [ApiTag.Plugins]:
    'A plugin is an installed module that makes filters and actions available for the workflow feature.',
  [ApiTag.Queues]:
    'Queues and background jobs are used for processing tasks asynchronously. Queues can be paused and resumed as needed.',
  [ApiTag.Search]:
    'Endpoints related to searching assets via text, smart search, optical character recognition (OCR), and other filters like person, album, and other metadata. Search endpoints usually support pagination and sorting.',
  [ApiTag.Server]:
    'Information about the current server deployment, including version and build information, available features, supported media types, and more.',
  [ApiTag.Sessions]:
    'A session represents an authenticated login session for a user. Sessions also appear in the web application as "Authorized devices".',
  [ApiTag.SharedLinks]:
    'A shared link is a public url that provides access to a specific album, asset, or collection of assets. A shared link can be protected with a password, include a specific slug, allow or disallow downloads, and optionally include an expiration date.',
  [ApiTag.Stacks]:
    'A stack is a group of related assets. One asset is the "primary" asset, and the rest are "child" assets. On the main timeline, stack parents are included by default, while child assets are hidden.',
  [ApiTag.Sync]: 'A collection of endpoints for the new mobile synchronization implementation.',
  [ApiTag.SystemConfig]: 'Endpoints to view, modify, and validate the system configuration settings.',
  [ApiTag.SystemMetadata]:
    'Endpoints to view, modify, and validate the system metadata, which includes information about things like admin onboarding status.',
  [ApiTag.Tags]:
    'A tag is a user-defined label that can be applied to assets for organizational purposes. Tags can also be hierarchical, allowing for parent-child relationships between tags.',
  [ApiTag.Timeline]:
    'Specialized endpoints related to the timeline implementation used in the web application. External applications or tools should not use or rely on these endpoints, as they are subject to change without notice.',
  [ApiTag.Trash]:
    'Endpoints for managing the trash can, which includes assets that have been discarded. Items in the trash are automatically deleted after a configured amount of time.',
  [ApiTag.UsersAdmin]:
    'Administrative endpoints for managing users, including creating, updating, deleting, and restoring users. Also includes endpoints for resetting passwords and PIN codes.',
  [ApiTag.Users]:
    'Endpoints for viewing and updating the current users, including product key information, profile picture data, onboarding progress, and more.',
  [ApiTag.Views]: 'Endpoints for specialized views, such as the folder view.',
  [ApiTag.Workflows]:
    'A workflow is a set of actions that run whenever a triggering event occurs. Workflows also can include filters to further limit execution.',
};

export const AUDIO_ENCODER: Record<AudioCodec, string> = {
  [AudioCodec.Aac]: 'aac',
  [AudioCodec.Mp3]: 'mp3',
  [AudioCodec.Opus]: 'libopus',
  [AudioCodec.PcmS16le]: 'pcm_s16le',
};

export const SUPPORTED_HWA_CODECS: Record<TranscodeHardwareAcceleration, VideoCodec[]> = {
  [TranscodeHardwareAcceleration.Nvenc]: [VideoCodec.H264, VideoCodec.Hevc, VideoCodec.Av1],
  [TranscodeHardwareAcceleration.Qsv]: [VideoCodec.H264, VideoCodec.Hevc, VideoCodec.Vp9, VideoCodec.Av1],
  [TranscodeHardwareAcceleration.Vaapi]: [VideoCodec.H264, VideoCodec.Hevc, VideoCodec.Vp9, VideoCodec.Av1],
  [TranscodeHardwareAcceleration.Rkmpp]: [VideoCodec.H264, VideoCodec.Hevc],
  [TranscodeHardwareAcceleration.Disabled]: [VideoCodec.H264, VideoCodec.Hevc, VideoCodec.Vp9, VideoCodec.Av1],
};

export const HLS_BACKPRESSURE_PAUSE_SEGMENTS = 30;
export const HLS_BACKPRESSURE_RESUME_SEGMENTS = 15;
export const HLS_CLEANUP_INTERVAL_MS = 60 * 1000;
export const HLS_CRF: Record<VideoCodec, number> = {
  [VideoCodec.H264]: 23,
  [VideoCodec.Hevc]: 28,
  [VideoCodec.Vp9]: 31,
  [VideoCodec.Av1]: 35,
};
export const HLS_INACTIVITY_TIMEOUT_MS = 5 * 60 * 1000;
export const HLS_LEASE_DURATION_MS = 30 * 60 * 1000;
export const HLS_PLAYLIST_CONTENT_TYPE = 'application/vnd.apple.mpegurl';
export const HLS_SEGMENT_DURATION = 2;
export const HLS_SEGMENT_FILENAME_REGEX = /^seg_(\d+)\.m4s$/;
export const HLS_VARIANTS = [
  { resolution: 480, codec: VideoCodec.Av1, bitrate: 1_000_000 },
  { resolution: 480, codec: VideoCodec.Hevc, bitrate: 1_200_000 },
  { resolution: 480, codec: VideoCodec.H264, bitrate: 2_500_000 },
  { resolution: 720, codec: VideoCodec.Av1, bitrate: 2_000_000 },
  { resolution: 720, codec: VideoCodec.Hevc, bitrate: 2_500_000 },
  { resolution: 720, codec: VideoCodec.H264, bitrate: 5_000_000 },
  { resolution: 1080, codec: VideoCodec.Av1, bitrate: 4_000_000 },
  { resolution: 1080, codec: VideoCodec.Hevc, bitrate: 4_500_000 },
  { resolution: 1080, codec: VideoCodec.H264, bitrate: 8_000_000 },
  { resolution: 1440, codec: VideoCodec.Av1, bitrate: 7_000_000 },
  { resolution: 1440, codec: VideoCodec.Hevc, bitrate: 8_000_000 },
  { resolution: 1440, codec: VideoCodec.H264, bitrate: 14_000_000 },
  { resolution: 2160, codec: VideoCodec.Av1, bitrate: 12_000_000 },
  { resolution: 2160, codec: VideoCodec.Hevc, bitrate: 14_000_000 },
  { resolution: 2160, codec: VideoCodec.H264, bitrate: 25_000_000 },
];
export const HLS_VERSION = 7;

export type CodecLevel = { maxFrame: number; maxRate: number; token: string };

// H.264 High profile: token is the hex level_idc.
export const H264_LEVELS: CodecLevel[] = [
  { maxFrame: 1620, maxRate: 40_500, token: '1e' }, // 3.0
  { maxFrame: 3600, maxRate: 108_000, token: '1f' }, // 3.1
  { maxFrame: 5120, maxRate: 216_000, token: '20' }, // 3.2
  { maxFrame: 8192, maxRate: 245_760, token: '28' }, // 4.0
  { maxFrame: 8704, maxRate: 522_240, token: '2a' }, // 4.2
  { maxFrame: 22_080, maxRate: 589_824, token: '32' }, // 5.0
  { maxFrame: 36_864, maxRate: 983_040, token: '33' }, // 5.1
  { maxFrame: 36_864, maxRate: 2_073_600, token: '34' }, // 5.2
  { maxFrame: 139_264, maxRate: 4_177_920, token: '3c' }, // 6.0
  { maxFrame: 139_264, maxRate: 8_355_840, token: '3d' }, // 6.1
  { maxFrame: 139_264, maxRate: 16_711_680, token: '3e' }, // 6.2
];

// HEVC Main profile, Main tier: token is `L` + level_idc (level × 30).
export const HEVC_LEVELS: CodecLevel[] = [
  { maxFrame: 552_960, maxRate: 16_588_800, token: 'L90' }, // 3.0
  { maxFrame: 983_040, maxRate: 33_177_600, token: 'L93' }, // 3.1
  { maxFrame: 2_228_224, maxRate: 66_846_720, token: 'L120' }, // 4.0
  { maxFrame: 2_228_224, maxRate: 133_693_440, token: 'L123' }, // 4.1
  { maxFrame: 8_912_896, maxRate: 267_386_880, token: 'L150' }, // 5.0
  { maxFrame: 8_912_896, maxRate: 534_773_760, token: 'L153' }, // 5.1
  { maxFrame: 8_912_896, maxRate: 1_069_547_520, token: 'L156' }, // 5.2
  { maxFrame: 35_651_584, maxRate: 1_069_547_520, token: 'L180' }, // 6.0
  { maxFrame: 35_651_584, maxRate: 2_139_095_040, token: 'L183' }, // 6.1
  { maxFrame: 35_651_584, maxRate: 4_278_190_080, token: 'L186' }, // 6.2
];

// AV1 Main profile (0), Main tier (M): token is the two-digit seq_level_idx + `M`.
export const AV1_LEVELS: CodecLevel[] = [
  { maxFrame: 665_856, maxRate: 19_975_168, token: '04M' }, // 3.0
  { maxFrame: 1_065_024, maxRate: 31_950_336, token: '05M' }, // 3.1
  { maxFrame: 2_359_296, maxRate: 70_778_880, token: '08M' }, // 4.0
  { maxFrame: 2_359_296, maxRate: 141_557_760, token: '09M' }, // 4.1
  { maxFrame: 8_912_896, maxRate: 267_386_880, token: '12M' }, // 5.0
  { maxFrame: 8_912_896, maxRate: 534_773_760, token: '13M' }, // 5.1
  { maxFrame: 8_912_896, maxRate: 1_069_547_520, token: '14M' }, // 5.2
  { maxFrame: 35_651_584, maxRate: 1_069_547_520, token: '16M' }, // 6.0
  { maxFrame: 35_651_584, maxRate: 2_139_095_040, token: '17M' }, // 6.1
  { maxFrame: 35_651_584, maxRate: 4_278_190_080, token: '18M' }, // 6.2
];
