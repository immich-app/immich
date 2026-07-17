import 'package:immich_mobile/domain/models/exif.model.dart';

part 'local_asset.model.dart';
part 'remote_asset.model.dart';

enum AssetType {
  // do not change this order!
  other,
  image,
  video,
  audio,
}

enum AssetState { local, remote, merged }

// do not change!
// keep in sync with PlatformAssetPlaybackStyle
enum AssetPlaybackStyle { unknown, image, video, imageAnimated, livePhoto, videoLooping }

sealed class BaseAsset {
  final String name;
  final String? checksum;
  final AssetType type;
  final DateTime createdAt;
  final DateTime updatedAt;
  final int? width;
  final int? height;
  final int? durationMs;
  final bool isFavorite;
  final bool isEdited;

  const BaseAsset({
    required this.name,
    required this.checksum,
    required this.type,
    required this.createdAt,
    required this.updatedAt,
    this.width,
    this.height,
    this.durationMs,
    this.isFavorite = false,
    required this.isEdited,
  });

  bool get isImage => type == AssetType.image;
  bool get isVideo => type == AssetType.video;

  bool get isMotionPhoto => playbackStyle == AssetPlaybackStyle.livePhoto;
  bool get isAnimatedImage => playbackStyle == AssetPlaybackStyle.imageAnimated;

  Duration get duration {
    final durationMs = this.durationMs;
    if (durationMs != null) {
      return Duration(milliseconds: durationMs);
    }
    return const Duration();
  }

  bool get hasRemote => storage == AssetState.remote || storage == AssetState.merged;
  bool get hasLocal => storage == AssetState.local || storage == AssetState.merged;
  bool get isLocalOnly => storage == AssetState.local;
  bool get isRemoteOnly => storage == AssetState.remote;

  // Same asset even if localId is known on one side but not the other (heroTag isn't stable then)
  bool refersToSameAsset(BaseAsset other) {
    if (remoteId != null && other.remoteId != null) {
      return remoteId == other.remoteId;
    }
    if (localId != null && other.localId != null) {
      return localId == other.localId;
    }
    return checksum != null && checksum == other.checksum;
  }

  bool get isEditable => false;

  // Overridden in subclasses
  AssetState get storage;
  String? get localId;
  String? get remoteId;
  String get heroTag;
  AssetPlaybackStyle get playbackStyle;

  @override
  String toString() {
    return '''BaseAsset {
  name: $name,
  type: $type,
  createdAt: $createdAt,
  updatedAt: $updatedAt,
  width: ${width ?? "<NA>"},
  height: ${height ?? "<NA>"},
  durationMs: ${durationMs ?? "<NA>"},
  isFavorite: $isFavorite,
  isEdited: $isEdited,
}''';
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) {
      return true;
    }
    if (other is BaseAsset) {
      return name == other.name &&
          type == other.type &&
          createdAt == other.createdAt &&
          updatedAt == other.updatedAt &&
          width == other.width &&
          height == other.height &&
          durationMs == other.durationMs &&
          isFavorite == other.isFavorite &&
          isEdited == other.isEdited;
    }
    return false;
  }

  @override
  int get hashCode {
    return name.hashCode ^
        type.hashCode ^
        createdAt.hashCode ^
        updatedAt.hashCode ^
        width.hashCode ^
        height.hashCode ^
        durationMs.hashCode ^
        isFavorite.hashCode ^
        isEdited.hashCode;
  }
}
