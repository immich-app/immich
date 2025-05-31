import 'dart:async';

import 'package:immich_mobile/domain/interfaces/db.interface.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/models/asset/local_asset_hash.model.dart';
import 'package:immich_mobile/domain/models/device_asset.model.dart';

abstract interface class IDeviceAssetRepository implements IDatabaseRepository {
  Future<bool> updateAll(List<DeviceAsset> assetHash);

  Future<List<DeviceAsset>> getByIds(List<String> localIds);

  Future<void> deleteIds(List<String> ids);
}

abstract interface class ILocalAssetHashRepository
    implements IDatabaseRepository {
  Future<List<LocalAssetHash>> getByIds(Iterable<String> localIds);

  Future<void> handleDelta({
    List<LocalAsset> updates = const [],
    List<String> deletes = const [],
  });
}
