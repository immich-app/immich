import 'package:pigeon/pigeon.dart';

@ConfigurePigeon(
  PigeonOptions(
    dartOut: 'lib/platform/native_sync_api.g.dart',
    swiftOut: 'ios/Runner/Sync/Messages.g.swift',
    swiftOptions: SwiftOptions(),
    kotlinOut:
        'android/app/src/main/kotlin/app/alextran/immich/sync/Messages.g.kt',
    kotlinOptions: KotlinOptions(package: 'app.alextran.immich.sync'),
    dartOptions: DartOptions(),
    dartPackageName: 'immich_mobile',
  ),
)
class ImAsset {
  final String id;
  final String name;
  // Follows AssetType enum from base_asset.model.dart
  final int type;
  // Seconds since epoch
  final int? createdAt;
  final int? updatedAt;
  final int durationInSeconds;

  const ImAsset({
    required this.id,
    required this.name,
    required this.type,
    this.createdAt,
    this.updatedAt,
    this.durationInSeconds = 0,
  });
}

class ImAlbum {
  final String id;
  final String name;
  // Seconds since epoch
  final int? updatedAt;
  final bool isCloud;
  final int assetCount;

  const ImAlbum({
    required this.id,
    required this.name,
    this.updatedAt,
    this.isCloud = false,
    this.assetCount = 0,
  });
}

class SyncDelta {
  final bool hasChanges;
  final List<ImAsset> updates;
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

@HostApi()
abstract class NativeSyncApi {
  bool shouldFullSync();

  @TaskQueue(type: TaskQueueType.serialBackgroundThread)
  SyncDelta getMediaChanges();

  void checkpointSync();

  void clearSyncCheckpoint();

  @TaskQueue(type: TaskQueueType.serialBackgroundThread)
  List<String> getAssetIdsForAlbum(String albumId);

  @TaskQueue(type: TaskQueueType.serialBackgroundThread)
  List<ImAlbum> getAlbums();

  @TaskQueue(type: TaskQueueType.serialBackgroundThread)
  int getAssetsCountSince(String albumId, int timestamp);

  @TaskQueue(type: TaskQueueType.serialBackgroundThread)
  List<ImAsset> getAssetsForAlbum(String albumId, {int? updatedTimeCond});
}
