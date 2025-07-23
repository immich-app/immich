import 'dart:ffi';
import 'dart:typed_data';
import 'dart:ui';
import 'dart:ui' as ui;

import 'package:immich_mobile/providers/infrastructure/platform.provider.dart';
import 'package:photo_manager/photo_manager.dart';
import 'package:ffi/ffi.dart';

class AssetMediaRepository {
  const AssetMediaRepository();

  Future<ui.Codec> getLocalThumbnail(String localId, ui.Size size) async {
    final info = await thumbnailApi.setThumbnailToBuffer(
      localId,
      width: size.width.toInt(),
      height: size.height.toInt(),
    );

    final pointer = Pointer<Uint8>.fromAddress(info['pointer']!);
    final actualWidth = info['width']!;
    final actualHeight = info['height']!;
    final actualSize = actualWidth * actualHeight * 4;

    try {
      final buffer =
          await ImmutableBuffer.fromUint8List(pointer.asTypedList(actualSize));
      final descriptor = ui.ImageDescriptor.raw(
        buffer,
        width: actualWidth,
        height: actualHeight,
        pixelFormat: ui.PixelFormat.rgba8888,
      );
      return await descriptor.instantiateCodec();
    } finally {
      malloc.free(pointer);
    }
  }

  Future<Uint8List?> getThumbnail(
    String id, {
    int quality = 80,
    ui.Size size = const ui.Size.square(256),
  }) =>
      AssetEntity(
        id: id,
        // The below fields are not used in thumbnailDataWithSize but are required
        // to create an AssetEntity instance. It is faster to create a dummy AssetEntity
        // instance than to fetch the asset from the device first.
        typeInt: AssetType.image.index,
        width: size.width.toInt(),
        height: size.height.toInt(),
      ).thumbnailDataWithSize(
        ThumbnailSize(size.width.toInt(), size.height.toInt()),
        quality: quality,
      );
}
