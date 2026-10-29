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

  // Register and authenticate using the server provided WebAuthn options JSON. Returns the resulting credential
  // as JSON, or null if the user cancels
  @async
  String? register(String options);

  @async
  String? authenticate(String options);
}
