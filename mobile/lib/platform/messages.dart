// ignore: depend_on_referenced_packages
import 'package:pigeon/pigeon.dart';

@ConfigurePigeon(
  PigeonOptions(
    dartOut: 'lib/platform/messages.g.dart',
    swiftOut: 'ios/Runner/Platform/Messages.g.swift',
    swiftOptions: SwiftOptions(),
    kotlinOut:
        'android/app/src/main/kotlin/app/alextran/immich/platform/Messages.g.kt',
    kotlinOptions: KotlinOptions(),
    dartOptions: DartOptions(),
  ),
)
class Asset {
  final String id;
  final String name;
  final int type; // follows AssetType enum from base_asset.model.dart
  // Seconds since epoch
  final int? createdAt;
  final int? updatedAt;
  final int durationInSeconds;
  final List<String> albumIds;

  const Asset({
    required this.id,
    required this.name,
    required this.type,
    this.createdAt,
    this.updatedAt,
    this.durationInSeconds = 0,
    this.albumIds = const [],
  });
}

class SyncDelta {
  SyncDelta({
    this.hasChanges = false,
    this.updates = const [],
    this.deletes = const [],
  });
  bool hasChanges;
  List<Asset> updates;
  List<String> deletes;
}

@HostApi()
abstract class ImHostService {
  bool shouldFullSync();

  @TaskQueue(type: TaskQueueType.serialBackgroundThread)
  SyncDelta getMediaChanges();

  void checkpointSync();

  @TaskQueue(type: TaskQueueType.serialBackgroundThread)
  List<String> getAssetIdsForAlbum(String albumId);
}
