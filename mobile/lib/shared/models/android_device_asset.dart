import 'package:immich_mobile/shared/models/device_asset.dart';
import 'package:isar/isar.dart';

part 'android_device_asset.g.dart';

@Collection()
class AndroidDeviceAsset extends DeviceAsset {
  AndroidDeviceAsset({required this.id, required super.hash});
  Id id;
}
