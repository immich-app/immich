import 'dart:typed_data';

import 'package:immich_mobile/domain/models/device_asset.model.dart';
import 'package:immich_mobile/utils/hash.dart';
import 'package:isar/isar.dart';

part 'device_asset.entity.g.dart';

@Collection(inheritance: false)
class DeviceAssetEntity {
  Id get id => fastHash(assetId);

  @Index(replace: true, unique: true, type: IndexType.hash)
  final String assetId;
  @Index(unique: false, type: IndexType.hash)
  final List<byte> hash;
  final DateTime modifiedTime;

  const DeviceAssetEntity({
    required this.assetId,
    required this.hash,
    required this.modifiedTime,
  });

  DeviceAsset toModel() => DeviceAsset(
        assetId: assetId,
        hash: Uint8List.fromList(hash),
        modifiedTime: modifiedTime,
      );

  static DeviceAssetEntity fromDto(DeviceAsset dto) => DeviceAssetEntity(
        assetId: dto.assetId,
        hash: dto.hash,
        modifiedTime: dto.modifiedTime,
      );
}
