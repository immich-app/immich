import 'dart:io';

import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';

abstract interface class IStorageRepository {
  Future<File?> getFileForAsset(LocalAsset asset);
}
