import 'package:pigeon/pigeon.dart';

@ConfigurePigeon(
  PigeonOptions(
    dartOut: 'lib/platform/permission_api.g.dart',
    swiftOut: 'ios/Runner/Permission/PermissionApi.g.swift',
    swiftOptions: SwiftOptions(),
    kotlinOut: 'android/app/src/main/kotlin/app/alextran/immich/permission/PermissionApi.g.kt',
    kotlinOptions: KotlinOptions(package: 'app.alextran.immich.permission'),
    dartOptions: DartOptions(),
    dartPackageName: 'immich_mobile',
  ),
)
@HostApi()
abstract class PermissionApi {
  bool hasManageMediaPermission();

  @async
  bool requestManageMediaPermission();

  @async
  bool manageMediaPermission();
}
