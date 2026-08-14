import 'package:pigeon/pigeon.dart';

enum PermissionStatus { granted, denied, permanentlyDenied }

@ConfigurePigeon(
  PigeonOptions(
    dartOut: 'lib/platform/permission_api.g.dart',
    swiftOut: 'ios/Runner/Permission/PermissionApi.g.swift',
    swiftOptions: SwiftOptions(includeErrorClass: false),
    kotlinOut: 'android/app/src/main/kotlin/app/alextran/immich/permission/PermissionApi.g.kt',
    kotlinOptions: KotlinOptions(package: 'app.alextran.immich.permission'),
    dartOptions: DartOptions(),
    dartPackageName: 'immich_mobile',
  ),
)
@HostApi()
abstract class PermissionApi {
  PermissionStatus isIgnoringBatteryOptimizations();

  bool hasManageMediaPermission();

  @async
  bool requestManageMediaPermission();

  @async
  bool manageMediaPermission();
}
