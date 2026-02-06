import 'package:immich_mobile/infrastructure/repositories/db.repository.dart';

class SyncMigrationRepository extends DriftDatabaseRepository {
  final Drift _db;

  const SyncMigrationRepository(super.db) : _db = db;

  Future<void> v20260128CopyExifWidthHeightToAsset() async {
    await _db.customStatement('''
      UPDATE remote_asset_entity
      SET width = CASE
            WHEN exif.orientation IN ('5', '6', '7', '8', '-90', '90') THEN exif.height
            ELSE exif.width
          END,
          height = CASE
            WHEN exif.orientation IN ('5', '6', '7', '8', '-90', '90') THEN exif.width
            ELSE exif.height
          END
      FROM remote_exif_entity exif
      WHERE exif.asset_id = remote_asset_entity.id
        AND (exif.width IS NOT NULL OR exif.height IS NOT NULL);
    ''');
  }
}
