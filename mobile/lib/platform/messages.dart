// ignore: depend_on_referenced_packages
import 'package:pigeon/pigeon.dart';

@ConfigurePigeon(
  PigeonOptions(
    dartOut: 'lib/platform/messages.g.dart',
    swiftOut: 'ios/Runner/Platform/Messages.g.swift',
    swiftOptions: SwiftOptions(),
    kotlinOut:
        'android/app/src/main/kotlin/app/alextran/immich/platform/messages.g.kt',
    kotlinOptions: KotlinOptions(),
    dartOptions: DartOptions(),
  ),
)
class Asset {
  final String id;
  final String name;
  final int type; // follows AssetType enum from base_asset.model.dart
  final String? createdAt;
  final String? updatedAt;
  final int durationInSeconds;
  final List<String> albumIds;

  const Asset({
    required this.id,
    required this.name,
    required this.type,
    required this.createdAt,
    required this.updatedAt,
    required this.durationInSeconds,
    required this.albumIds,
  });
}

class SyncDelta {
  SyncDelta({this.updates = const [], this.deletes = const []});
  List<Asset> updates;
  List<String> deletes;
}

@HostApi()
abstract class ImHostService {
  @async
  bool shouldFullSync();

  @async
  bool hasMediaChanges();

  @async
  @TaskQueue(type: TaskQueueType.serialBackgroundThread)
  SyncDelta getMediaChanges();

  @async
  void checkpointSync();
}
