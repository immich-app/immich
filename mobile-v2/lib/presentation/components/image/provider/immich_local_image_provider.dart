import 'dart:async';
import 'dart:io';
import 'dart:ui' as ui;

import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/painting.dart';
import 'package:immich_mobile/domain/interfaces/device_asset.interface.dart';
import 'package:immich_mobile/domain/models/asset.model.dart';
import 'package:immich_mobile/service_locator.dart';
import 'package:immich_mobile/utils/extensions/file.extension.dart';

/// The local image provider for an asset
class ImLocalImageProvider extends ImageProvider<ImLocalImageProvider> {
  final Asset asset;

  ImLocalImageProvider({required this.asset})
      : assert(asset.localId != null, 'Only usable when asset.local is set');

  /// Converts an [ImageProvider]'s settings plus an [ImageConfiguration] to a key
  /// that describes the precise image to load.
  @override
  Future<ImLocalImageProvider> obtainKey(ImageConfiguration configuration) {
    return SynchronousFuture(this);
  }

  @override
  ImageStreamCompleter loadImage(
    ImLocalImageProvider key,
    ImageDecoderCallback decode,
  ) {
    final chunkEvents = StreamController<ImageChunkEvent>();
    return MultiImageStreamCompleter(
      codec: _codec(key.asset, decode, chunkEvents),
      scale: 1.0,
      chunkEvents: chunkEvents.stream,
      informationCollector: () sync* {
        yield ErrorDescription(asset.name);
      },
    );
  }

  // Streams in each stage of the image as we ask for it
  Stream<ui.Codec> _codec(
    Asset a,
    ImageDecoderCallback decode,
    StreamController<ImageChunkEvent> chunkEvents,
  ) async* {
    // Load a small thumbnail
    final thumbBytes =
        await di<IDeviceAssetRepository>().getThumbnail(a.localId!);
    if (thumbBytes != null) {
      final buffer = await ui.ImmutableBuffer.fromUint8List(thumbBytes);
      final codec = await decode(buffer);
      yield codec;
    } else {
      debugPrint("Loading thumb for ${a.name} failed");
    }

    if (asset.isImage) {
      /// Using 2K thumbnail for local iOS image to avoid double swiping issue
      if (Platform.isIOS) {
        final largeImageBytes = await di<IDeviceAssetRepository>()
            .getThumbnail(a.localId!, width: 3840, height: 2160);

        if (largeImageBytes == null) {
          throw StateError("Loading thumb for local photo ${a.name} failed");
        }
        final buffer = await ui.ImmutableBuffer.fromUint8List(largeImageBytes);
        final codec = await decode(buffer);
        yield codec;
      } else {
        // Use the original file for Android
        final File? file =
            await di<IDeviceAssetRepository>().getOriginalFile(a.localId!);
        if (file == null) {
          throw StateError("Opening file for asset ${a.name} failed");
        }
        try {
          final buffer = await ui.ImmutableBuffer.fromFilePath(file.path);
          final codec = await decode(buffer);
          yield codec;
        } catch (error, stack) {
          Error.throwWithStackTrace(
            StateError("Loading asset ${a.name} failed"),
            stack,
          );
        } finally {
          await file.deleteDarwinCache();
        }
      }
    }

    await chunkEvents.close();
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    if (other is ImLocalImageProvider) {
      return asset == other.asset;
    }

    return false;
  }

  @override
  int get hashCode => asset.hashCode;
}
