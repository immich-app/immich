import 'package:pigeon/pigeon.dart';

@ConfigurePigeon(
  PigeonOptions(
    dartOut: 'lib/platform/view_intent_api.g.dart',
    swiftOut: 'ios/Runner/ViewIntent/ViewIntent.g.swift',
    swiftOptions: SwiftOptions(includeErrorClass: false),
    kotlinOut: 'android/app/src/main/kotlin/app/alextran/immich/viewintent/ViewIntent.g.kt',
    kotlinOptions: KotlinOptions(package: 'app.alextran.immich.viewintent'),
    dartOptions: DartOptions(),
    dartPackageName: 'immich_mobile',
  ),
)
enum ViewIntentType { image, video }

class ViewIntentPayload {
  final String path;
  final ViewIntentType type;
  final String mimeType;
  final String? localAssetId;

  const ViewIntentPayload({
    required this.path,
    required this.type,
    required this.mimeType,
    this.localAssetId,
  });
}

@HostApi()
abstract class ViewIntentHostApi {
  @async
  ViewIntentPayload? consumeViewIntent();
}
