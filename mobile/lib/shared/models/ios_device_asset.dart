import 'package:immich_mobile/shared/models/device_asset.dart';
import 'package:immich_mobile/utils/hash.dart';
import 'package:isar/isar.dart';

part 'ios_device_asset.g.dart';

@Collection()
class IOSDeviceAsset extends DeviceAsset {
  IOSDeviceAsset({required this.id, required super.hash});

  @Index(replace: true, unique: true, type: IndexType.hash)
  String id;
  Id get isarId => fastHash(id);
}
