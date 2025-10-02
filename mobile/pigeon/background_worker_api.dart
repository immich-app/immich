import 'package:pigeon/pigeon.dart';

@ConfigurePigeon(
  PigeonOptions(
    dartOut: 'lib/platform/background_worker_api.g.dart',
    swiftOut: 'ios/Runner/Background/BackgroundWorker.g.swift',
    swiftOptions: SwiftOptions(includeErrorClass: false),
    kotlinOut: 'android/app/src/main/kotlin/app/alextran/immich/background/BackgroundWorker.g.kt',
    kotlinOptions: KotlinOptions(package: 'app.alextran.immich.background'),
    dartOptions: DartOptions(),
    dartPackageName: 'immich_mobile',
  ),
)
class BackgroundWorkerSettings {
  final bool requiresCharging;
  final int minimumDelaySeconds;

  const BackgroundWorkerSettings({required this.requiresCharging, required this.minimumDelaySeconds});
}

@HostApi()
abstract class BackgroundWorkerFgHostApi {
  void enable();

  void configure(BackgroundWorkerSettings settings);

  void disable();
}

@HostApi()
abstract class BackgroundWorkerBgHostApi {
  // Called from the background flutter engine when it has bootstrapped and established the
  // required platform channels to notify the native side to start the background upload
  void onInitialized();

  void showNotification(String title, String content);

  // Called from the background flutter engine to request the native side to cleanup
  void close();
}

@FlutterApi()
abstract class BackgroundWorkerFlutterApi {
  // iOS Only: Called when the iOS background upload is triggered
  @async
  void onIosUpload(bool isRefresh, int? maxSeconds);

  // Android Only: Called when the Android background upload is triggered
  @async
  void onAndroidUpload();

  @async
  void cancel();
}
