import 'dart:async';

import 'package:flutter/material.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/services/timeline.service.dart';
import 'package:immich_mobile/infrastructure/repositories/settings.repository.dart';
import 'package:immich_mobile/presentation/widgets/images/image_provider.dart';

const _kMaxPreloadOriginalBytes = 100 * 1024 * 1024;

class AssetPreloader {
  static final _dummyListener = ImageStreamListener((image, _) => image.dispose());

  final TimelineService timelineService;
  final bool Function() mounted;

  Timer? _timer;
  ImageStream? _prevStream;
  ImageStream? _nextStream;
  final _thumbnailStreams = <ImageStream>[];

  AssetPreloader({required this.timelineService, required this.mounted});

  /// Preloads adjacent images with the current thumbnail size.
  void preload(int index, Size size, {Size? thumbnailSize}) {
    unawaited(timelineService.preloadAssets(index));
    _timer?.cancel();
    _timer = Timer(Durations.medium4, () async {
      if (!mounted()) {
        return;
      }
      final (prev, next) = await (
        timelineService.getAssetAsync(index - 1),
        timelineService.getAssetAsync(index + 1),
      ).wait;
      if (!mounted()) {
        return;
      }
      _prevStream?.removeListener(_dummyListener);
      _nextStream?.removeListener(_dummyListener);
      for (final stream in _thumbnailStreams) {
        stream.removeListener(_dummyListener);
      }
      _thumbnailStreams.clear();
      _prevStream = prev != null ? _resolveImage(prev, size, thumbnailSize) : null;
      _nextStream = next != null ? _resolveImage(next, size, thumbnailSize) : null;
    });
  }

  ImageStream _resolveImage(BaseAsset asset, Size size, Size? thumbnailSize) {
    final decodedBytes = (asset.width ?? 0) * (asset.height ?? 0) * 4;
    final previewOnly =
        SettingsRepository.instance.appConfig.image.loadOriginal &&
        asset.isImage &&
        !asset.isAnimatedImage &&
        decodedBytes > _kMaxPreloadOriginalBytes;
    if (previewOnly) {
      final thumbnail = getThumbnailImageProvider(asset, remoteSize: thumbnailSize)?.resolve(ImageConfiguration.empty);
      if (thumbnail != null) {
        _thumbnailStreams.add(thumbnail..addListener(_dummyListener));
      }
    }
    return getFullImageProvider(
      asset,
      size: size,
      remoteThumbnailSize: thumbnailSize,
      previewOnly: previewOnly,
    ).resolve(ImageConfiguration.empty)..addListener(_dummyListener);
  }

  void dispose() {
    _timer?.cancel();
    _prevStream?.removeListener(_dummyListener);
    _nextStream?.removeListener(_dummyListener);
    for (final stream in _thumbnailStreams) {
      stream.removeListener(_dummyListener);
    }
    _thumbnailStreams.clear();
  }
}
