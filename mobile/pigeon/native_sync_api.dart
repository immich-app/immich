import 'package:pigeon/pigeon.dart';

@ConfigurePigeon(
  PigeonOptions(
    dartOut: 'lib/platform/native_sync_api.g.dart',
    swiftOut: 'ios/Runner/Sync/Messages.g.swift',
    swiftOptions: SwiftOptions(),
    kotlinOut: 'android/app/src/main/kotlin/app/alextran/immich/sync/Messages.g.kt',
    kotlinOptions: KotlinOptions(package: 'app.alextran.immich.sync'),
    dartOptions: DartOptions(),
    dartPackageName: 'immich_mobile',
  ),
)
enum PlatformAssetPlaybackStyle { unknown, image, video, imageAnimated, livePhoto, videoLooping }

class PlatformAsset {
  final String id;
  final String name;

  // Follows AssetType enum from base_asset.model.dart
  final int type;

  // Seconds since epoch
  final int? createdAt;
  final int? updatedAt;
  final int? width;
  final int? height;
  final int durationMs;
  final int orientation;
  final bool isFavorite;

  final int? adjustmentTime;
  final double? latitude;
  final double? longitude;

  final PlatformAssetPlaybackStyle playbackStyle;

  // iOS burst grouping. `burstId` = PHAsset.burstIdentifier (null for non-burst
  // assets). `isBurstRepresentative` = the auto-picked lead frame at detection
  // time. android always returns null/false (no burstIdentifier equivalent).
  final String? burstId;
  final bool isBurstRepresentative;

  const PlatformAsset({
    required this.id,
    required this.name,
    required this.type,
    this.createdAt,
    this.updatedAt,
    this.width,
    this.height,
    this.durationMs = 0,
    this.orientation = 0,
    this.isFavorite = false,
    this.adjustmentTime,
    this.latitude,
    this.longitude,
    this.playbackStyle = PlatformAssetPlaybackStyle.unknown,
    this.burstId,
    this.isBurstRepresentative = false,
  });
}

class PlatformAlbum {
  final String id;
  final String name;

  // Seconds since epoch
  final int? updatedAt;
  final bool isCloud;
  final int assetCount;

  const PlatformAlbum({
    required this.id,
    required this.name,
    this.updatedAt,
    this.isCloud = false,
    this.assetCount = 0,
  });
}

class SyncDelta {
  final bool hasChanges;
  final List<PlatformAsset> updates;
  final List<String> deletes;

  // Asset -> Album mapping
  final Map<String, List<String>> assetAlbums;

  const SyncDelta({
    this.hasChanges = false,
    this.updates = const [],
    this.deletes = const [],
    this.assetAlbums = const {},
  });
}

class HashResult {
  final String assetId;
  final String? error;
  final String? hash;

  const HashResult({required this.assetId, this.error, this.hash});
}

class CloudIdResult {
  final String assetId;
  final String? error;
  final String? cloudId;

  const CloudIdResult({required this.assetId, this.error, this.cloudId});
}

class BaseResource {
  final String path;
  final String sha1;

  const BaseResource({required this.path, required this.sha1});
}

// The readable originals of an edited live photo: the still always, the paired
// video when the asset still carries one. Both are temp copies the caller
// uploads then deletes.
class BaseLivePhoto {
  final BaseResource still;
  final BaseResource? video;

  const BaseLivePhoto({required this.still, this.video});
}

// Whether an iOS asset currently carries a user edit, as opposed to a
// capture-time Photographic Style or a reverted edit. `unknown` means the
// adjustment data couldn't be read (e.g. the asset is offloaded to iCloud and
// network wasn't allowed), so callers must not treat it as "not edited".
enum EditState { notEdited, edited, unknown }

@HostApi()
abstract class NativeSyncApi {
  @async
  bool shouldFullSync();

  @async
  SyncDelta getMediaChanges();

  void checkpointSync();

  void clearSyncCheckpoint();

  @async
  List<String> getAssetIdsForAlbum(String albumId);

  @async
  List<PlatformAlbum> getAlbums();

  @TaskQueue(type: TaskQueueType.serialBackgroundThread)
  int getAssetsCountSince(String albumId, int timestamp);

  @async
  List<PlatformAsset> getAssetsForAlbum(String albumId, {int? updatedTimeCond});

  @async
  @TaskQueue(type: TaskQueueType.serialBackgroundThread)
  List<HashResult> hashAssets(List<String> assetIds, {bool allowNetworkAccess = false});

  void cancelHashing();

  void cancelSync();

  @TaskQueue(type: TaskQueueType.serialBackgroundThread)
  Map<String, List<PlatformAsset>> getTrashedAssets();

  @async
  bool restoreFromTrashById(String mediaId, int type);

  @TaskQueue(type: TaskQueueType.serialBackgroundThread)
  List<CloudIdResult> getCloudIdForAssetIds(List<String> assetIds);

  @async
  @TaskQueue(type: TaskQueueType.serialBackgroundThread)
  BaseResource? getBaseResource(String assetId, {bool allowNetworkAccess = false});

  /// Streams the bytes immich treats as the asset's canonical content — the same
  /// resource [hashAssets] hashes (`PHAsset.getResource()`, the `.isCurrent`
  /// rendition). Used to upload iOS burst members: they're invisible to
  /// photo_manager, so this is the only way to read their file, and streaming
  /// the same resource the hash measured keeps the server checksum aligned with
  /// the local one (else the asset shows cloud-only). iOS-only; android returns null.
  @async
  @TaskQueue(type: TaskQueueType.serialBackgroundThread)
  BaseResource? getCurrentResource(String assetId, {bool allowNetworkAccess = false});

  @async
  @TaskQueue(type: TaskQueueType.serialBackgroundThread)
  EditState getEditState(String assetId, {bool allowNetworkAccess = false});

  @async
  @TaskQueue(type: TaskQueueType.serialBackgroundThread)
  BaseLivePhoto? getBaseLivePhoto(String assetId, {bool allowNetworkAccess = false});
}
