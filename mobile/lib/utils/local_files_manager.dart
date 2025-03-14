import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';

class LocalFilesManager {
  static const MethodChannel _channel = MethodChannel('file_trash');

  static Future<bool> moveToTrash(String fileName) async {
    try {
      final bool success =
          await _channel.invokeMethod('moveToTrash', {'fileName': fileName});
      return success;
    } on PlatformException catch (e) {
      debugPrint("Error moving to trash: ${e.message}");
      return false;
    }
  }

  static Future<bool> restoreFromTrash(String fileName) async {
    try {
      final bool success = await _channel
          .invokeMethod('restoreFromTrash', {'fileName': fileName});
      return success;
    } on PlatformException catch (e) {
      debugPrint("Error restoring file: ${e.message}");
      return false;
    }
  }
}
