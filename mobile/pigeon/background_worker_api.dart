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
@HostApi()
abstract class BackgroundWorkerFgHostApi {
  void enableSyncWorker();

  // Enables the background upload service with the given callback handle
  void enableBackupWorker(int callbackHandle);

  // Disables the background upload service
  void disableBackupWorker();
}

@HostApi()
abstract class BackgroundWorkerBgHostApi {
  // Called from the background flutter engine when it has bootstrapped and established the
  // required platform channels to notify the native side to start the background upload
  void onInitialized();
}

@FlutterApi()
abstract class BackgroundWorkerFlutterApi {
  // Android & iOS: Called when the local sync is triggered
  @async
  void onLocalSync(int? maxSeconds);

  // iOS Only: Called when the iOS background refresh is triggered
  @async
  void onIosRefresh(int? maxSeconds);

  // iOS Only: Called when the iOS background processing is triggered
  @async
  void onIosProcessing();

  // Android Only: Called when the Android background upload is triggered
  @async
  void onAndroidUpload();

  @async
  void cancel();
}
