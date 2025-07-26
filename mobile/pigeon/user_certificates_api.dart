import 'package:pigeon/pigeon.dart';

@ConfigurePigeon(
  PigeonOptions(
    dartOut: 'lib/platform/user_certificates_api.g.dart',
    kotlinOut:
        'android/app/src/main/kotlin/app/alextran/immich/certificates/UserCertificatesApi.g.kt',
    kotlinOptions: KotlinOptions(package: 'app.alextran.immich.certificates'),
    dartOptions: DartOptions(),
    dartPackageName: 'immich_mobile',
  ),
)
@HostApi()
abstract class UserCertificatesApi {
  @async
  Map<String, String> getUserPemCertificatesByName();
}
