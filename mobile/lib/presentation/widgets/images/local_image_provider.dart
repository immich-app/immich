import 'dart:async';
import 'dart:ui';

import 'package:flutter/foundation.dart';
import 'package:flutter/widgets.dart';
import 'package:immich_mobile/infrastructure/repositories/asset_media.repository.dart';
import 'package:immich_mobile/presentation/widgets/images/image_provider.dart';
import 'package:immich_mobile/presentation/widgets/images/one_frame_multi_image_stream_completer.dart';
import 'package:immich_mobile/presentation/widgets/timeline/constants.dart';

class LocalThumbProvider extends ImageProvider<LocalThumbProvider> with CancellableImageProviderMixin {
  final String id;
  final Size size;

  LocalThumbProvider({required this.id, this.size = kThumbnailResolution});

  @override
  Future<LocalThumbProvider> obtainKey(ImageConfiguration configuration) {
    return SynchronousFuture(this);
  }

  @override
  ImageStreamCompleter loadImage(LocalThumbProvider key, ImageDecoderCallback decode) {
    return OneFramePlaceholderImageStreamCompleter(
      _codec(key, decode),
      informationCollector: () => <DiagnosticsNode>[
        DiagnosticsProperty<String>('Id', key.id),
        DiagnosticsProperty<Size>('Size', key.size),
      ],
    );
  }

  Stream<ImageInfo> _codec(LocalThumbProvider key, ImageDecoderCallback decode) async* {
    final request = this.request = LocalImageRequest(localId: key.id, size: size);
    try {
      final image = await request.load(decode);
      if (image != null) {
        yield image;
      }
    } finally {
      this.request = null;
    }
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

class LocalFullImageProvider extends ImageProvider<LocalFullImageProvider> with CancellableImageProviderMixin {
  final String id;
  final Size size;

  LocalFullImageProvider({required this.id, required this.size});

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
    final request = this.request = LocalImageRequest(
      localId: key.id,
      size: Size(size.width * devicePixelRatio, size.height * devicePixelRatio),
    );

    try {
      final image = await request.load(decode);
      if (image != null) {
        yield image;
      }
    } finally {
      this.request = null;
    }
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
