import { AssetStatus, AssetVisibility, SourceType } from 'src/enum';
import { registerEnum } from 'src/sql-tools';

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
