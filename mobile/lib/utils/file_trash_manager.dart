import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';

class FileTrashManager {
  static const MethodChannel _channel = MethodChannel('file_trash');

  static Future<bool> moveToTrash(String filePath) async {
    try {
      final bool success =
          await _channel.invokeMethod('moveToTrash', {'filePath': filePath});
      return success;
    } on PlatformException catch (e) {
      debugPrint("Error: ${e.message}");
      return false;
    }
  }
}
