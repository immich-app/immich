import 'package:pigeon/pigeon.dart';

@ConfigurePigeon(
  PigeonOptions(
    dartOut: 'lib/platform/background_upload_api.g.dart',
    swiftOut: 'ios/Runner/Background/BackgroundUpload.g.swift',
    swiftOptions: SwiftOptions(includeErrorClass: false),
    kotlinOut: 'android/app/src/main/kotlin/app/alextran/immich/background/BackgroundUpload.g.kt',
    kotlinOptions: KotlinOptions(package: 'app.alextran.immich.background'),
    dartOptions: DartOptions(),
    dartPackageName: 'immich_mobile',
  ),
)
@HostApi()
abstract class BackgroundUploadFgHostApi {
  // Enables the background upload service with the given callback handle
  void enable(int callbackHandle);

  // Disables the background upload service
  void disable();
}

@HostApi()
abstract class BackgroundUploadBgHostApi {
  // Called from the background flutter engine when it has bootstrapped and established the
  // required platform channels to notify the native side to start the background upload
  void onInitialized();
}

@FlutterApi()
abstract class BackgroundUploadFlutterApi {
  // iOS Only: Called when the iOS background refresh is triggered
  @async
  void onIosBackgroundRefresh(int? maxSeconds);

  // iOS Only: Called when the iOS background processing is triggered
  @async
  void onIosBackgroundProcessing();

  // Android Only: Called when the Android background upload is triggered
  @async
  void onAndroidBackgroundUpload();

  @async
  void cancel();
}
