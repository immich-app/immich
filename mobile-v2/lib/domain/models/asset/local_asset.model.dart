import 'package:flutter/foundation.dart';
import 'package:immich_mobile/domain/models/asset/asset.model.dart';

@immutable
class LocalAsset extends Asset {
  final String localId;

  const LocalAsset({
    required this.localId,
    required super.name,
    required super.checksum,
    required super.height,
    required super.width,
    required super.type,
    required super.createdTime,
    required super.modifiedTime,
    required super.duration,
  });

  @override
  String toString() => """
{
  "localId": "$localId",
  "name": "$name",
  "checksum": "$checksum",
  "height": ${height ?? "-"},
  "width": ${width ?? "-"},
  "type": "$type",
  "createdTime": "$createdTime",
  "modifiedTime": "$modifiedTime",
  "duration": "$duration",
}""";

  @override
  bool operator ==(covariant LocalAsset other) {
    if (identical(this, other)) return true;

    return super == (other) && other.localId == localId;
  }

  @override
  int get hashCode => super.hashCode ^ localId.hashCode;

  @override
  LocalAsset copyWith({
    String? localId,
    String? name,
    String? checksum,
    int? height,
    int? width,
    AssetType? type,
    DateTime? createdTime,
    DateTime? modifiedTime,
    int? duration,
  }) {
    return LocalAsset(
      localId: localId ?? this.localId,
      name: name ?? this.name,
      checksum: checksum ?? this.checksum,
      height: height ?? this.height,
      width: width ?? this.width,
      type: type ?? this.type,
      createdTime: createdTime ?? this.createdTime,
      modifiedTime: modifiedTime ?? this.modifiedTime,
      duration: duration ?? this.duration,
    );
  }
}
