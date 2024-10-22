import 'package:flutter/material.dart';
import 'package:immich_mobile/utils/collection_util.dart';

enum AssetType {
  // do not change this order!
  other,
  image,
  video,
  audio,
}

class Asset {
  final int? id;
  final String name;
  final String hash;
  final int? height;
  final int? width;
  final AssetType type;
  final DateTime createdTime;
  final DateTime modifiedTime;
  final int duration;

  // local only
  final String? localId;

  // remote only
  final String? remoteId;
  final String? livePhotoVideoId;

  bool get isRemote => remoteId != null;
  bool get isLocal => localId != null;
  bool get isMerged => isRemote && isLocal;
  bool get isImage => type == AssetType.image;

  const Asset({
    this.id,
    required this.name,
    required this.hash,
    this.height,
    this.width,
    required this.type,
    required this.createdTime,
    required this.modifiedTime,
    required this.duration,
    this.localId,
    this.remoteId,
    this.livePhotoVideoId,
  });

  Asset copyWith({
    int? id,
    String? name,
    String? hash,
    int? height,
    int? width,
    AssetType? type,
    DateTime? createdTime,
    DateTime? modifiedTime,
    int? duration,
    ValueGetter<String?>? localId,
    ValueGetter<String?>? remoteId,
    String? livePhotoVideoId,
  }) {
    return Asset(
      id: id ?? this.id,
      name: name ?? this.name,
      hash: hash ?? this.hash,
      height: height ?? this.height,
      width: width ?? this.width,
      type: type ?? this.type,
      createdTime: createdTime ?? this.createdTime,
      modifiedTime: modifiedTime ?? this.modifiedTime,
      duration: duration ?? this.duration,
      localId: localId == null ? this.localId : localId(),
      remoteId: remoteId == null ? this.remoteId : remoteId(),
      livePhotoVideoId: livePhotoVideoId ?? this.livePhotoVideoId,
    );
  }

  Asset merge(Asset newAsset) {
    final existingAsset = this;
    assert(existingAsset.id != null, "Existing asset must be from the db");

    final oldestCreationTime =
        existingAsset.createdTime.isBefore(newAsset.createdTime)
            ? existingAsset.createdTime
            : newAsset.createdTime;

    if (newAsset.modifiedTime.isAfter(existingAsset.modifiedTime)) {
      return newAsset.copyWith(
        id: newAsset.id ?? existingAsset.id,
        height: newAsset.height ?? existingAsset.height,
        width: newAsset.width ?? existingAsset.width,
        createdTime: oldestCreationTime,
        localId: () => existingAsset.localId ?? newAsset.localId,
        remoteId: () => existingAsset.remoteId ?? newAsset.remoteId,
      );
    }

    return existingAsset.copyWith(
      height: existingAsset.height ?? newAsset.height,
      width: existingAsset.width ?? newAsset.width,
      createdTime: oldestCreationTime,
      localId: () => existingAsset.localId ?? newAsset.localId,
      remoteId: () => existingAsset.remoteId ?? newAsset.remoteId,
    );
  }

  @override
  String toString() => """
{
  "id": "${id ?? "-"}",
  "remoteId": "${remoteId ?? "-"}",
  "localId": "${localId ?? "-"}",
  "name": "$name",
  "hash": "$hash",
  "height": ${height ?? "-"},
  "width": ${width ?? "-"},
  "type": "$type",
  "createdTime": "$createdTime",
  "modifiedTime": "$modifiedTime",
  "duration": "$duration",
  "livePhotoVideoId": "${livePhotoVideoId ?? "-"}",
}""";

  @override
  bool operator ==(covariant Asset other) {
    if (identical(this, other)) return true;

    return other.id == id &&
        other.name == name &&
        other.hash == hash &&
        other.height == height &&
        other.width == width &&
        other.type == type &&
        other.createdTime == createdTime &&
        other.modifiedTime == modifiedTime &&
        other.duration == duration &&
        other.localId == localId &&
        other.remoteId == remoteId &&
        other.livePhotoVideoId == livePhotoVideoId;
  }

  @override
  int get hashCode {
    return id.hashCode ^
        name.hashCode ^
        hash.hashCode ^
        height.hashCode ^
        width.hashCode ^
        type.hashCode ^
        createdTime.hashCode ^
        modifiedTime.hashCode ^
        duration.hashCode ^
        localId.hashCode ^
        remoteId.hashCode ^
        livePhotoVideoId.hashCode;
  }

  static int compareByHash(Asset a, Asset b) => a.hash.compareTo(b.hash);

  static int compareByLocalId(Asset a, Asset b) =>
      CollectionUtil.compareToNullable(a.localId, b.localId);
}
