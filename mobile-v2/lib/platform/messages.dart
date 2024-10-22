// ignore: depend_on_referenced_packages
import 'package:pigeon/pigeon.dart';

@ConfigurePigeon(PigeonOptions(
  dartOut: 'lib/platform/messages.g.dart',
  swiftOut: 'ios/Runner/Platform/Messages.g.swift',
  swiftOptions: SwiftOptions(),
  kotlinOut:
      'android/app/src/main/kotlin/com/alextran/immich/platform/Messages.g.kt',
  kotlinOptions: KotlinOptions(),
  dartOptions: DartOptions(),
))
@HostApi()
abstract class ImHostService {
  @async
  List<Uint8List?> digestFiles(List<String> paths);
}
