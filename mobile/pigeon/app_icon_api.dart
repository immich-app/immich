import 'package:pigeon/pigeon.dart';

@ConfigurePigeon(
  PigeonOptions(
    dartOut: 'lib/platform/app_icon_api.g.dart',
    swiftOut: 'ios/Runner/Core/AppIcon.g.swift',
    swiftOptions: SwiftOptions(includeErrorClass: false),
    kotlinOut: 'android/app/src/main/kotlin/app/alextran/immich/appicon/AppIcon.g.kt',
    kotlinOptions: KotlinOptions(package: 'app.alextran.immich.appicon'),
    dartOptions: DartOptions(),
    dartPackageName: 'immich_mobile',
  ),
)
@HostApi()
abstract class AppIconApi {
  @async
  void setAppIcon(String iconId);

  String getAppIcon();
}
