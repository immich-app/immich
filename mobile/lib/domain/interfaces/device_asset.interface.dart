import 'dart:async';

import 'package:immich_mobile/domain/interfaces/db.interface.dart';
import 'package:immich_mobile/domain/models/device_asset.model.dart';

abstract interface class IDeviceAssetRepository implements IDatabaseRepository {
  Future<bool> updateAll(List<DeviceAsset> assetHash);

  Future<List<DeviceAsset>> getByIds(List<String> localIds);

  Future<void> deleteIds(List<String> ids);
}
