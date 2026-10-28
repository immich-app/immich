import 'package:pigeon/pigeon.dart';

@ConfigurePigeon(
  PigeonOptions(
    dartOut: 'lib/platform/passkey_api.g.dart',
    kotlinOut: 'android/app/src/main/kotlin/app/alextran/immich/passkey/Passkey.g.kt',
    kotlinOptions: KotlinOptions(package: 'app.alextran.immich.passkey'),
    dartOptions: DartOptions(),
    dartPackageName: 'immich_mobile',
  ),
)
@HostApi()
abstract class PasskeyHostApi {
  bool isSupported();

  // register and authenticate take the server's WebAuthn options JSON
  // and return the credential JSON, or null when the user cancels
  @async
  String? register(String options);

  @async
  String? authenticate(String options);
}
