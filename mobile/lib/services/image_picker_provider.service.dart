import 'dart:io';

import 'package:flutter/services.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/platform/image_picker_provider_api.g.dart';
import 'package:immich_mobile/utils/debug_print.dart';
import 'package:path_provider/path_provider.dart';

final imagePickerProviderServiceProvider = Provider((ref) => ImagePickerProviderService());

/// Service that handles image picker requests from Android native code
/// When other apps (like Twitter) request an image via ACTION_GET_CONTENT,
/// this service provides the image URI
class ImagePickerProviderService implements ImagePickerProviderApi {
  ImagePickerProviderService() {
    // Register this service with the platform channel
    ImagePickerProviderApi.setUp(this);
    dPrint(() => "ImagePickerProviderService registered");
  }

  @override
  Future<String?> pickImageForIntent() async {
    dPrint(() => "pickImageForIntent called from native");
    
    try {
      // For now, return a static test image
      // TODO: In the future, show UI to let user select an image
      final imageUri = await _getStaticTestImageUri();
      dPrint(() => "Returning image URI: $imageUri");
      return imageUri;
    } catch (e, stackTrace) {
      dPrint(() => "Error in pickImageForIntent: $e\n$stackTrace");
      return null;
    }
  }

  /// Returns a URI to a static test image
  /// Copies the immich logo from assets to a temporary file and returns a content URI
  Future<String> _getStaticTestImageUri() async {
    // Load the asset image
    final ByteData data = await rootBundle.load('assets/immich-logo.png');
    final Uint8List bytes = data.buffer.asUint8List();
    
    // Get temporary directory
    final Directory tempDir = await getTemporaryDirectory();
    final File tempFile = File('${tempDir.path}/picker_test_image.png');
    
    // Write the image to a temporary file
    await tempFile.writeAsBytes(bytes);
    
    // Return the file URI (Android native will convert this to a content URI if needed)
    return 'file://${tempFile.path}';
  }
}
