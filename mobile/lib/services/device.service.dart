import 'package:flutter_udid/flutter_udid.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/entities/store.entity.dart';

final deviceServiceProvider = Provider((ref) => DeviceService());

class DeviceService {
  DeviceService();

  createDeviceId() {
    return FlutterUdid.consistentUdid;
  }

  /// Returns the device ID from local storage or creates a new one if not found.
  ///
  /// This method first attempts to retrieve the device ID from the local store using
  /// [StoreKey.deviceId]. If no device ID is found (returns null), it generates a
  /// new device ID by calling [createDeviceId].
  ///
  /// Returns a [String] representing the device's unique identifier.
  String getDeviceId() {
    return Store.tryGet(StoreKey.deviceId) ?? createDeviceId();
  }
}
