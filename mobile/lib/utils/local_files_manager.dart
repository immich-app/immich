import 'package:flutter/services.dart';
import 'package:logging/logging.dart';

abstract final class LocalFilesManager {
  static final Logger _logger = Logger('LocalFilesManager');
  static const MethodChannel _channel = MethodChannel('file_trash');

  static Future<bool> moveToTrash(List<String> mediaUrls) async {
    try {
      return await _channel
          .invokeMethod('moveToTrash', {'mediaUrls': mediaUrls});
    } catch (e, s) {
      _logger.warning('Error moving file to trash', e, s);
      return false;
    }
  }

  static Future<bool> restoreFromTrash(String fileName, int type) async {
    try {
      return await _channel.invokeMethod(
        'restoreFromTrash',
        {'fileName': fileName, 'type': type},
      );
    } catch (e, s) {
      _logger.warning('Error restore file from trash', e, s);
      return false;
    }
  }

  static Future<bool> requestManageMediaPermission() async {
    try {
      return await _channel.invokeMethod('requestManageMediaPermission');
    } catch (e, s) {
      _logger.warning('Error requesting manage media permission', e, s);
      return false;
    }
  }
}
