import 'dart:async';

import 'package:immich_mobile/domain/models/device_asset_hash.model.dart';

abstract interface class IDeviceAssetToHashRepository {
  /// Add a new device asset to hash entry
  FutureOr<bool> upsertAll(Iterable<DeviceAssetToHash> assetHash);

  // Gets the asset with the local ID from the device
  FutureOr<List<DeviceAssetToHash>> getForIds(Iterable<String> localIds);

  /// Removes assets with the given [ids]
  FutureOr<void> deleteIds(Iterable<int> ids);
}
