import 'dart:async';
import 'dart:ui';

import 'package:flutter/foundation.dart';
import 'package:flutter/widgets.dart';
import 'package:immich_mobile/constants/constants.dart';
import 'package:immich_mobile/infrastructure/repositories/asset_media.repository.dart';
import 'package:immich_mobile/presentation/widgets/images/image_provider.dart';
import 'package:immich_mobile/presentation/widgets/images/one_frame_multi_image_stream_completer.dart';

class LocalThumbProvider extends ImageProvider<LocalThumbProvider> {
  static const _assetMediaRepository = AssetMediaRepository();

  final String id;
  final Size size;

  const LocalThumbProvider({required this.id, this.size = kTimelineThumbnailSize});

  @override
  Future<LocalThumbProvider> obtainKey(ImageConfiguration configuration) {
    return SynchronousFuture(this);
  }

  @override
  ImageStreamCompleter loadImage(LocalThumbProvider key, ImageDecoderCallback decode) {
    return OneFrameImageStreamCompleter(
      _codec(key),
      informationCollector: () => <DiagnosticsNode>[
        DiagnosticsProperty<String>('Id', key.id),
        DiagnosticsProperty<Size>('Size', key.size),
      ],
    );
  }

  Future<ImageInfo> _codec(LocalThumbProvider key) async {
    final codec = await _assetMediaRepository.getLocalThumbnail(key.id, key.size);
    return ImageInfo(image: (await codec.getNextFrame()).image, scale: 1.0);
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    if (other is LocalThumbProvider) {
      return id == other.id && size == other.size;
    }
    return false;
  }

  @override
  int get hashCode => id.hashCode ^ size.hashCode;
}

class LocalFullImageProvider extends ImageProvider<LocalFullImageProvider> {
  static const _assetMediaRepository = AssetMediaRepository();

  final String id;
  final Size size;

  const LocalFullImageProvider({required this.id, required this.size});

  @override
  Future<LocalFullImageProvider> obtainKey(ImageConfiguration configuration) {
    return SynchronousFuture(this);
  }

  @override
  ImageStreamCompleter loadImage(LocalFullImageProvider key, ImageDecoderCallback decode) {
    return OneFramePlaceholderImageStreamCompleter(
      _codec(key, decode),
      initialImage: getCachedImage(LocalThumbProvider(id: key.id)),
      informationCollector: () => <DiagnosticsNode>[
        DiagnosticsProperty<ImageProvider>('Image provider', this),
        DiagnosticsProperty<String>('Id', key.id),
        DiagnosticsProperty<Size>('Size', key.size),
      ],
    );
  }

  Stream<ImageInfo> _codec(LocalFullImageProvider key, ImageDecoderCallback decode) async* {
    final devicePixelRatio = PlatformDispatcher.instance.views.first.devicePixelRatio;
    final codec = await _assetMediaRepository.getLocalThumbnail(
      key.id,
      Size(size.width * devicePixelRatio, size.height * devicePixelRatio),
    );
    final frame = await codec.getNextFrame();
    yield ImageInfo(image: frame.image, scale: 1.0);
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    if (other is LocalFullImageProvider) {
      return id == other.id && size == other.size;
    }
    return false;
  }

  @override
  int get hashCode => id.hashCode ^ size.hashCode;
}
