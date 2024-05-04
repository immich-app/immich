import 'package:isar/isar.dart';

class DeviceAsset {
  DeviceAsset({required this.hash});

  @Index(unique: false, type: IndexType.hash)
  List<byte> hash;
}
