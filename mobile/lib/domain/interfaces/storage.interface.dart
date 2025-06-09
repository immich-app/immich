import 'dart:io';

import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
// ignore: import_rule_photo_manager
import 'package:photo_manager/photo_manager.dart';

abstract interface class IStorageRepository {
  Future<File?> getFileForAsset(LocalAsset asset);
  Future<AssetEntity?> getAssetEntityForAsset(LocalAsset asset);
}
