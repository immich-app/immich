import 'package:pigeon/pigeon.dart';

@ConfigurePigeon(
  PigeonOptions(
    dartOut: 'lib/platform/connectivity_api.g.dart',
    swiftOut: 'ios/Runner/Connectivity/Connectivity.g.swift',
    swiftOptions: SwiftOptions(includeErrorClass: false),
    kotlinOut: 'android/app/src/main/kotlin/app/alextran/immich/connectivity/Connectivity.g.kt',
    kotlinOptions: KotlinOptions(package: 'app.alextran.immich.connectivity'),
    dartOptions: DartOptions(),
    dartPackageName: 'immich_mobile',
  ),
)
enum NetworkCapability { cellular, wifi, vpn, unmetered }

@HostApi()
abstract class ConnectivityApi {
  @TaskQueue(type: TaskQueueType.serialBackgroundThread)
  List<NetworkCapability> getCapabilities();
}
