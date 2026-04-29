import { registerEnum } from '@immich/sql-tools';
import {
  AlbumUserRole,
  AssetStatus,
  AssetVisibility,
  ChecksumAlgorithm,
  SourceType,
  VideoSegmentCodec,
} from 'src/enum';

export const album_user_role_enum = registerEnum({
  name: 'album_user_role_enum',
  values: [AlbumUserRole.Owner, AlbumUserRole.Editor, AlbumUserRole.Viewer],
});

export const assets_status_enum = registerEnum({
  name: 'assets_status_enum',
  values: Object.values(AssetStatus),
});

export const asset_face_source_type = registerEnum({
  name: 'sourcetype',
  values: Object.values(SourceType),
});

export const asset_visibility_enum = registerEnum({
  name: 'asset_visibility_enum',
  values: Object.values(AssetVisibility),
});

export const asset_checksum_algorithm_enum = registerEnum({
  name: 'asset_checksum_algorithm_enum',
  values: Object.values(ChecksumAlgorithm),
});

export const video_stream_variant_codec_enum = registerEnum({
  name: 'video_stream_variant_codec_enum',
  values: Object.values(VideoSegmentCodec),
});
