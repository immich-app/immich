import 'package:hive/hive.dart';

part 'hive_backup_asset.model.g.dart';

@HiveType(typeId: 2)
class HiveBackupAsset {
  @HiveField(0)
  String assetId;

  HiveBackupAsset({
    required this.assetId,
  });
}
