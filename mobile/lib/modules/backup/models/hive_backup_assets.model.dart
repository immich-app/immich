import 'dart:convert';

import 'package:collection/collection.dart';
import 'package:hive/hive.dart';

part 'hive_backup_assets.model.g.dart';

@HiveType(typeId: 2)
class HiveBackupAssets {
  @HiveField(0)
  String assetId;

  @HiveField(1)
  String deviceAssetId;

  HiveBackupAssets({
    required this.assetId,
    required this.deviceAssetId,
  });
}
