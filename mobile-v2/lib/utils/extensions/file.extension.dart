import 'dart:io';

extension ClearPhotoManagerCacheExtension on File {
  Future<void> deleteDarwinCache() async {
    if (Platform.isIOS) {
      try {
        await delete();
      } catch (_) {}
    }
  }
}
