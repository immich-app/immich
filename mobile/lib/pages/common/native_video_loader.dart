import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart' hide Store;
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/entities/asset.entity.dart';
import 'package:immich_mobile/entities/store.entity.dart';
import 'package:immich_mobile/pages/common/native_video_viewer.page.dart';
import 'package:immich_mobile/providers/asset_viewer/video_player_value_provider.dart';
import 'package:immich_mobile/services/api.service.dart';
import 'package:immich_mobile/services/asset.service.dart';
import 'package:logging/logging.dart';
import 'package:native_video_player/native_video_player.dart';
import 'package:photo_manager/photo_manager.dart';

class NativeVideoLoader extends HookConsumerWidget {
  final Asset asset;
  final bool isMotionVideo;
  final Widget placeholder;
  final bool showControls;
  final Duration hideControlsTimer;
  final bool loopVideo;

  const NativeVideoLoader({
    super.key,
    required this.asset,
    required this.placeholder,
    this.isMotionVideo = false,
    this.showControls = true,
    this.hideControlsTimer = const Duration(seconds: 5),
    this.loopVideo = false,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final log = Logger('NativeVideoLoader');
    log.info('Building NativeVideoLoader');
    // fast path for aspect ratio
    // final initAspectRatio = useMemoized(
    //   () {
    //     if (asset.exifInfo == null) {
    //       return null;
    //     }

    //     final width = asset.orientatedWidth?.toDouble();
    //     final height = asset.orientatedHeight?.toDouble();
    //     return width != null && height != null && width > 0 && height > 0
    //         ? width / height
    //         : null;
    //   },
    // );

    final localEntity = useMemoized(
      () => asset.isLocal ? AssetEntity.fromId(asset.localId!) : null,
    );
    Future<double> calculateAspectRatio() async {
      log.info('Calculating aspect ratio');
      late final double? orientatedWidth;
      late final double? orientatedHeight;

      if (asset.exifInfo != null) {
        orientatedWidth = asset.orientatedWidth?.toDouble();
        orientatedHeight = asset.orientatedHeight?.toDouble();
      } else if (localEntity != null) {
        final entity = await localEntity;
        orientatedWidth = entity?.orientatedWidth.toDouble();
        orientatedHeight = entity?.orientatedHeight.toDouble();
      } else {
        final entity = await ref.read(assetServiceProvider).loadExif(asset);
        orientatedWidth = entity.orientatedWidth?.toDouble();
        orientatedHeight = entity.orientatedHeight?.toDouble();
      }

      log.info('Calculated aspect ratio');
      if (orientatedWidth != null &&
          orientatedHeight != null &&
          orientatedWidth > 0 &&
          orientatedHeight > 0) {
        return orientatedWidth / orientatedHeight;
      }

      return 1.0;
    }

    final aspectRatioFuture = useMemoized(() => calculateAspectRatio());

    Future<VideoSource> createLocalSource() async {
      log.info('Loading video from local storage');
      final entity = await localEntity;
      if (entity == null) {
        throw Exception('No entity found for the video');
      }

      final file = await entity.file;
      if (file == null) {
        throw Exception('No file found for the video');
      }

      final source = await VideoSource.init(
        path: file.path,
        type: VideoSourceType.file,
      );
      log.info('Loaded video from local storage');
      return source;
    }

    Future<VideoSource> createRemoteSource() async {
      log.info('Loading video from server');

      // Use a network URL for the video player controller
      final serverEndpoint = Store.get(StoreKey.serverEndpoint);
      final String videoUrl = asset.livePhotoVideoId != null
          ? '$serverEndpoint/assets/${asset.livePhotoVideoId}/video/playback'
          : '$serverEndpoint/assets/${asset.remoteId}/video/playback';

      final source = await VideoSource.init(
        path: videoUrl,
        type: VideoSourceType.network,
        headers: ApiService.getRequestHeaders(),
      );
      log.info('Loaded video from server');
      return source;
    }

    Future<VideoSource> createSource() {
      if (asset.isLocal && asset.livePhotoVideoId == null) {
        return createLocalSource();
      }

      return createRemoteSource();
    }

    final createSourceFuture = useMemoized(() => createSource());

    final combinedFuture = useMemoized(
      () async {
        final aspectRatio = await aspectRatioFuture;
        final source = await createSourceFuture;
        return (source, aspectRatio);
      },
    );

    final size = MediaQuery.sizeOf(context);

    return SizedBox(
      height: size.height,
      width: size.width,
      child: GestureDetector(
        behavior: HitTestBehavior.deferToChild,
        child: PopScope(
          onPopInvokedWithResult: (didPop, _) => ref
              .read(videoPlaybackValueProvider.notifier)
              .value = VideoPlaybackValue.uninitialized(),
          child: SizedBox(
            height: size.height,
            width: size.width,
            child: FutureBuilder(
              key: ValueKey(asset.id),
              future: combinedFuture,
              // initialData: initAspectRatio,
              builder: (context, snapshot) {
                if (!snapshot.hasData) {
                  return placeholder;
                }

                return NativeVideoViewerPage(
                  videoSource: snapshot.data!.$1,
                  duration: asset.duration,
                  aspectRatio: snapshot.data!.$2,
                  isMotionVideo: isMotionVideo,
                  hideControlsTimer: hideControlsTimer,
                  loopVideo: loopVideo,
                );
              },
            ),
          ),
        ),
      ),
    );
  }
}
