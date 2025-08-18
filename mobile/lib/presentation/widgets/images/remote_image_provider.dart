import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter/painting.dart';
import 'package:immich_mobile/domain/models/setting.model.dart';
import 'package:immich_mobile/domain/services/setting.service.dart';
import 'package:immich_mobile/infrastructure/repositories/asset_media.repository.dart';
import 'package:immich_mobile/presentation/widgets/images/image_provider.dart';
import 'package:immich_mobile/presentation/widgets/images/one_frame_multi_image_stream_completer.dart';
import 'package:immich_mobile/providers/image/cache/remote_image_cache_manager.dart';
import 'package:immich_mobile/services/api.service.dart';
import 'package:immich_mobile/utils/image_url_builder.dart';

class RemoteThumbProvider extends ImageProvider<RemoteThumbProvider> with CancellableImageProviderMixin {
  static final cacheManager = RemoteThumbnailCacheManager();
  final String assetId;

  RemoteThumbProvider({required this.assetId});

  @override
  Future<RemoteThumbProvider> obtainKey(ImageConfiguration configuration) {
    return SynchronousFuture(this);
  }

  @override
  ImageStreamCompleter loadImage(RemoteThumbProvider key, ImageDecoderCallback decode) {
    final completer = OneFramePlaceholderImageStreamCompleter(
      _codec(key, decode),
      informationCollector: () => <DiagnosticsNode>[
        DiagnosticsProperty<ImageProvider>('Image provider', this),
        DiagnosticsProperty<String>('Asset Id', key.assetId),
      ],
    );
    completer.addOnLastListenerRemovedCallback(cancel);
    return completer;
  }

  Stream<ImageInfo> _codec(RemoteThumbProvider key, ImageDecoderCallback decode) async* {
    final preview = getThumbnailUrlForRemoteId(key.assetId);
    final request = this.request = RemoteImageRequest(
      uri: preview,
      headers: ApiService.getRequestHeaders(),
      cacheManager: cacheManager,
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
    if (other is RemoteThumbProvider) {
      return assetId == other.assetId;
    }

    return false;
  }

  @override
  int get hashCode => assetId.hashCode;
}

class RemoteFullImageProvider extends ImageProvider<RemoteFullImageProvider> with CancellableImageProviderMixin {
  static final cacheManager = RemoteThumbnailCacheManager();
  final String assetId;

  RemoteFullImageProvider({required this.assetId});

  @override
  Future<RemoteFullImageProvider> obtainKey(ImageConfiguration configuration) {
    return SynchronousFuture(this);
  }

  @override
  ImageStreamCompleter loadImage(RemoteFullImageProvider key, ImageDecoderCallback decode) {
    final completer = OneFramePlaceholderImageStreamCompleter(
      _codec(key, decode),
      initialImage: getCachedImage(RemoteThumbProvider(assetId: assetId)),
      informationCollector: () => <DiagnosticsNode>[
        DiagnosticsProperty<ImageProvider>('Image provider', this),
        DiagnosticsProperty<String>('Asset Id', key.assetId),
      ],
    );
    // TODO: these callbacks gets called a bit too late in the timeline, need to investigate
    //  Probably related to the viewport's cacheExtent
    completer.addOnLastListenerRemovedCallback(cancel);
    return completer;
  }

  Stream<ImageInfo> _codec(RemoteFullImageProvider key, ImageDecoderCallback decode) async* {
    try {
      final request = this.request = RemoteImageRequest(
        uri: getPreviewUrlForRemoteId(key.assetId),
        headers: ApiService.getRequestHeaders(),
        cacheManager: cacheManager,
      );
      final image = await request.load(decode);
      if (image == null) {
        return;
      }
      yield image;
    } finally {
      request = null;
    }

    if (AppSetting.get(Setting.loadOriginal)) {
      try {
        final request = this.request = RemoteImageRequest(
          uri: getOriginalUrlForRemoteId(key.assetId),
          headers: ApiService.getRequestHeaders(),
        );
        final image = await request.load(decode);
        if (image != null) {
          yield image;
        }
      } finally {
        request = null;
      }
    }
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    if (other is RemoteFullImageProvider) {
      return assetId == other.assetId;
    }

    return false;
  }

  @override
  int get hashCode => assetId.hashCode;
}
