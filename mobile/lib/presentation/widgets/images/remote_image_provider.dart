import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter/painting.dart';
import 'package:immich_mobile/domain/models/setting.model.dart';
import 'package:immich_mobile/domain/services/setting.service.dart';
import 'package:immich_mobile/infrastructure/loaders/image_request.dart';
import 'package:immich_mobile/presentation/widgets/images/image_provider.dart';
import 'package:immich_mobile/presentation/widgets/images/one_frame_multi_image_stream_completer.dart';
import 'package:immich_mobile/providers/image/cache/remote_image_cache_manager.dart';
import 'package:immich_mobile/services/api.service.dart';
import 'package:immich_mobile/utils/image_url_builder.dart';
import 'package:openapi/api.dart';

class RemoteThumbProvider extends CancellableImageProvider<RemoteThumbProvider>
    with CancellableImageProviderMixin<RemoteThumbProvider> {
  static final cacheManager = RemoteThumbnailCacheManager();
  final String assetId;

  RemoteThumbProvider({required this.assetId});

  @override
  Future<RemoteThumbProvider> obtainKey(ImageConfiguration configuration) {
    return SynchronousFuture(this);
  }

  @override
  ImageStreamCompleter loadImage(RemoteThumbProvider key, ImageDecoderCallback decode) {
    return OneFramePlaceholderImageStreamCompleter(
      _codec(key, decode),
      informationCollector: () => <DiagnosticsNode>[
        DiagnosticsProperty<ImageProvider>('Image provider', this),
        DiagnosticsProperty<String>('Asset Id', key.assetId),
      ],
      onDispose: cancel,
    );
  }

  Stream<ImageInfo> _codec(RemoteThumbProvider key, ImageDecoderCallback decode) {
    final request = this.request = RemoteImageRequest(
      uri: getThumbnailUrlForRemoteId(key.assetId),
      headers: ApiService.getRequestHeaders(),
      cacheManager: cacheManager,
    );
    return loadRequest(request, decode);
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

class RemoteFullImageProvider extends CancellableImageProvider<RemoteFullImageProvider>
    with CancellableImageProviderMixin<RemoteFullImageProvider> {
  static final cacheManager = RemoteThumbnailCacheManager();
  final String assetId;

  RemoteFullImageProvider({required this.assetId});

  @override
  Future<RemoteFullImageProvider> obtainKey(ImageConfiguration configuration) {
    return SynchronousFuture(this);
  }

  @override
  ImageStreamCompleter loadImage(RemoteFullImageProvider key, ImageDecoderCallback decode) {
    return OneFramePlaceholderImageStreamCompleter(
      _codec(key, decode),
      initialImage: getInitialImage(RemoteThumbProvider(assetId: key.assetId)),
      informationCollector: () => <DiagnosticsNode>[
        DiagnosticsProperty<ImageProvider>('Image provider', this),
        DiagnosticsProperty<String>('Asset Id', key.assetId),
      ],
      onDispose: cancel,
    );
  }

  Stream<ImageInfo> _codec(RemoteFullImageProvider key, ImageDecoderCallback decode) async* {
    yield* initialImageStream();

    if (isCancelled) {
      unawaited(evict());
      return;
    }

    final headers = ApiService.getRequestHeaders();
    final request = this.request = RemoteImageRequest(
      uri: getThumbnailUrlForRemoteId(key.assetId, type: AssetMediaSize.preview),
      headers: headers,
      cacheManager: cacheManager,
    );
    yield* loadRequest(request, decode);

    if (isCancelled) {
      unawaited(evict());
      return;
    }

    if (AppSetting.get(Setting.loadOriginal)) {
      final request = this.request = RemoteImageRequest(uri: getOriginalUrlForRemoteId(key.assetId), headers: headers);
      yield* loadRequest(request, decode);
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
