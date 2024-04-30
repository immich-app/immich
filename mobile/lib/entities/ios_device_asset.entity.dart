import 'package:immich_mobile/entities/device_asset.entity.dart';
import 'package:immich_mobile/utils/hash.dart';
import 'package:isar/isar.dart';

part 'ios_device_asset.entity.g.dart';

@Collection()
class IOSDeviceAsset extends DeviceAsset {
  IOSDeviceAsset({required this.id, required super.hash});

  @Index(replace: true, unique: true, type: IndexType.hash)
  String id;
  Id get isarId => fastHash(id);
}
