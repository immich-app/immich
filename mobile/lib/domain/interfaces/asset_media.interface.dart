import 'dart:typed_data';
import 'dart:ui';

abstract interface class IAssetMediaRepository {
  Future<Uint8List?> getThumbnail(
    String id, {
    int quality = 80,
    Size size = const Size.square(256),
  });
}
