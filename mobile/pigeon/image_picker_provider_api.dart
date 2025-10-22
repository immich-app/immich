import 'package:pigeon/pigeon.dart';

@ConfigurePigeon(
  PigeonOptions(
    dartOut: 'lib/platform/image_picker_provider_api.g.dart',
    swiftOut: 'ios/Runner/ImagePickerProvider.g.swift',
    swiftOptions: SwiftOptions(includeErrorClass: false),
    kotlinOut:
        'android/app/src/main/kotlin/app/alextran/immich/picker/ImagePickerProvider.g.kt',
    kotlinOptions: KotlinOptions(package: 'app.alextran.immich.picker'),
    dartOptions: DartOptions(),
    dartPackageName: 'immich_mobile',
  ),
)

/// API for Android native to request an image from Flutter
@FlutterApi()
abstract class ImagePickerProviderApi {
  /// Called when Android needs an image for ACTION_GET_CONTENT/ACTION_PICK
  /// Returns the URI of the selected image (content:// or file:// URI)
  /// Returns null if user cancels
  @async
  String? pickImageForIntent();
}
