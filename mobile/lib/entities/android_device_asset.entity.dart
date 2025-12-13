import 'package:immich_mobile/entities/device_asset.entity.dart';
import 'package:isar/isar.dart';

part 'android_device_asset.entity.g.dart';

@Collection()
class AndroidDeviceAsset extends DeviceAsset {
  AndroidDeviceAsset({required this.id, required super.hash});
  Id id;
}
