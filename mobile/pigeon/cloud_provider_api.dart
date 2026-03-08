import 'package:pigeon/pigeon.dart';

@ConfigurePigeon(
  PigeonOptions(
    dartOut: 'lib/platform/cloud_provider_api.g.dart',
    kotlinOut: 'android/app/src/main/kotlin/app/alextran/immich/cloudprovider/CloudProviderApi.g.kt',
    kotlinOptions: KotlinOptions(package: 'app.alextran.immich.cloudprovider'),
    dartOptions: DartOptions(),
    dartPackageName: 'immich_mobile',
  ),
)
@HostApi()
abstract class CloudProviderApi {
  String getAdbSetupCommand();
  String getAdbDisableCommand();
}
