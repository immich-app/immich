import 'package:pigeon/pigeon.dart';

@ConfigurePigeon(
  PigeonOptions(
    dartOut: 'lib/platform/spherical_video_api.g.dart',
    kotlinOut: 'android/app/src/main/kotlin/app/alextran/immich/spherical/SphericalVideoApi.g.kt',
    kotlinOptions: KotlinOptions(package: 'app.alextran.immich.spherical'),
    dartOptions: DartOptions(),
    dartPackageName: 'immich_mobile',
  ),
)
@HostApi()
abstract class SphericalVideoApi {
  /// Opens a full-screen spherical (360°) player for [url] on Android.
  /// Returns whether the native player could be started.
  @async
  bool openViewer(String url);
}
