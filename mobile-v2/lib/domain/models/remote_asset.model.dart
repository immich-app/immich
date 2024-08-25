import 'package:flutter/foundation.dart';
import 'package:immich_mobile/domain/models/asset.model.dart';

@immutable
class RemoteAsset extends Asset {
  final String remoteId;

  const RemoteAsset({
    required this.remoteId,
    required super.id,
    required super.name,
    required super.checksum,
    required super.height,
    required super.width,
    required super.type,
    required super.createdTime,
    required super.modifiedTime,
    required super.duration,
    required super.isLivePhoto,
  });

  @override
  String toString() => """
{
  "id": $id,
  "remoteId": "$remoteId",
  "name": "$name",
  "checksum": "$checksum",
  "height": $height,
  "width": $width,
  "type": "$type",
  "createdTime": "$createdTime",
  "modifiedTime": "$modifiedTime",
  "duration": "$duration",
  "isLivePhoto": "$isLivePhoto",
}""";

  @override
  bool operator ==(covariant RemoteAsset other) {
    if (identical(this, other)) return true;

    return super == (other) && other.remoteId == remoteId;
  }

  @override
  int get hashCode => super.hashCode ^ remoteId.hashCode;

  @override
  RemoteAsset copyWith({
    int? id,
    String? remoteId,
    String? name,
    String? checksum,
    int? height,
    int? width,
    AssetType? type,
    DateTime? createdTime,
    DateTime? modifiedTime,
    int? duration,
    bool? isLivePhoto,
  }) {
    return RemoteAsset(
      id: id ?? this.id,
      remoteId: remoteId ?? this.remoteId,
      name: name ?? this.name,
      checksum: checksum ?? this.checksum,
      height: height ?? this.height,
      width: width ?? this.width,
      type: type ?? this.type,
      createdTime: createdTime ?? this.createdTime,
      modifiedTime: modifiedTime ?? this.modifiedTime,
      duration: duration ?? this.duration,
      isLivePhoto: isLivePhoto ?? this.isLivePhoto,
    );
  }
}
