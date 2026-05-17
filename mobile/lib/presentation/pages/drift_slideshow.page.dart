import 'dart:async';
import 'dart:math';
import 'dart:ui';

import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/enums.dart';
import 'package:immich_mobile/domain/models/config/slideshow_config.dart';
import 'package:immich_mobile/domain/services/timeline.service.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/extensions/scroll_extensions.dart';
import 'package:immich_mobile/extensions/translate_extensions.dart';
import 'package:immich_mobile/pages/common/settings.page.dart';
import 'package:immich_mobile/presentation/widgets/asset_viewer/video_viewer.widget.dart';
import 'package:immich_mobile/presentation/widgets/images/image_provider.dart';
import 'package:immich_mobile/providers/asset_viewer/asset_viewer.provider.dart';
import 'package:immich_mobile/providers/asset_viewer/video_player_provider.dart';
import 'package:immich_mobile/providers/infrastructure/metadata.provider.dart';
import 'package:immich_mobile/routing/router.dart';
import 'package:immich_mobile/widgets/common/immich_loading_indicator.dart';
import 'package:immich_mobile/widgets/photo_view/photo_view.dart';

@RoutePage()
class DriftSlideshowPage extends ConsumerStatefulWidget {
  final TimelineService timeline;

  const DriftSlideshowPage({super.key, required this.timeline});

  @override
  ConsumerState<DriftSlideshowPage> createState() => _DriftSlideshowPageState();
}

class _DriftSlideshowPageState extends ConsumerState<DriftSlideshowPage> {
  late final SlideshowConfig _config;
  late final PageController _pageController;
  late final Stopwatch _stopwatch;
  late Timer _timer;
  late int _index;
  late int _nextIndex;
  bool _paused = false;
  bool _showAppBar = false;

  @override
  initState() {
    super.initState();
    _config = ref.read(appConfigProvider.select((s) => s.slideshow));
    final asset = ref.read(assetViewerProvider).currentAsset;
    _index = asset == null ? 0 : widget.timeline.getIndex(asset.heroTag) ?? 0;
    _pageController = PageController(initialPage: _index);
    _stopwatch = Stopwatch();
    _createTimer();
    _updateNextIndex();

    SystemChrome.setEnabledSystemUIMode(SystemUiMode.immersive);
  }

  @override
  dispose() {
    _timer.cancel();
    _stopwatch.stop();
    _pageController.dispose();
    SystemChrome.setEnabledSystemUIMode(SystemUiMode.edgeToEdge);
    super.dispose();
  }

  void _play() {
    final asset = widget.timeline.getAssetSafe(_index)!;

    if (asset.isImage) {
      _createTimer();
    } else if (ref.read(videoPlayerProvider(asset.heroTag)).status == VideoPlaybackStatus.paused) {
      ref.read(videoPlayerProvider(asset.heroTag).notifier).play();
    } else {
      _nextPage();
    }

    _updateNextIndex();

    setState(() {
      _paused = false;
    });
  }

  void _pause() {
    _timer.cancel();
    _stopwatch.stop();

    final asset = widget.timeline.getAssetSafe(_index)!;

    if (!asset.isImage) {
      ref.read(videoPlayerProvider(asset.heroTag).notifier).pause();
    }

    setState(() {
      _paused = true;
    });
  }

  void _updateNextIndex() {
    _nextIndex = switch (_config.direction) {
      SlideshowDirection.forward => _index + 1,
      SlideshowDirection.backward => _index - 1,
      SlideshowDirection.shuffle => widget.timeline.getIndex(widget.timeline.getRandomAsset().heroTag)!,
    };

    if (!widget.timeline.hasRange(_nextIndex, 1)) {
      widget.timeline.preloadAssets(_nextIndex);
    }
  }

  void _nextPage() async {
    if (_nextIndex < 0 || _nextIndex >= widget.timeline.totalAssets) {
      if (_config.repeat) {
        final wrapped = _config.direction == SlideshowDirection.forward ? 0 : widget.timeline.totalAssets - 1;
        await widget.timeline.preloadAssets(wrapped);
        _pageController.jumpToPage(wrapped);
      }
      return;
    }

    if (!widget.timeline.hasRange(_nextIndex, 1)) {
      await widget.timeline.preloadAssets(_nextIndex);
    }

    if (_config.direction == SlideshowDirection.shuffle || !_config.transition) {
      _pageController.jumpToPage(_nextIndex);
    } else {
      unawaited(_pageController.animateToPage(_nextIndex, duration: Durations.long2, curve: Curves.easeIn));
    }
  }

  void _createTimer() {
    _timer = Timer(Duration(milliseconds: _config.duration * 1000 - _stopwatch.elapsedMilliseconds), () {
      _stopwatch.stop();
      _stopwatch.reset();
      _nextPage();
    });

    _stopwatch.start();
  }

  void _pageChanged(int page) {
    final asset = widget.timeline.getAssetSafe(page)!;

    setState(() {
      _index = page;

      if (!asset.isImage) {
        _paused = false;
      }
    });

    _timer.cancel();
    _stopwatch.stop();
    _stopwatch.reset();

    if (!_paused && asset.isImage) {
      _createTimer();
    }

    _updateNextIndex();
  }

  void _onTapUp() async {
    await SystemChrome.setEnabledSystemUIMode(_showAppBar ? SystemUiMode.immersive : SystemUiMode.edgeToEdge);

    WidgetsBinding.instance.addPostFrameCallback((_) {
      setState(() {
        _showAppBar = !_showAppBar;
      });
    });
  }

  Widget _getProgressBar(BuildContext context) {
    final asset = widget.timeline.getAssetSafe(_index);

    if (asset == null) {
      return Container();
    }

    if (asset.isImage) {
      final elapsed = _stopwatch.elapsedMilliseconds;
      final duration = _config.duration * 1000;

      return TweenAnimationBuilder(
        key: Key(_index.toString()),
        tween: Tween<double>(begin: elapsed / duration.toDouble(), end: _paused ? elapsed / duration.toDouble() : 1.0),
        duration: Duration(milliseconds: _paused ? 1 : max(duration - elapsed, 1)),
        builder: (context, value, _) => LinearProgressIndicator(
          color: context.colorScheme.primary,
          borderRadius: const BorderRadius.all(Radius.zero),
          minHeight: 5,
          value: value,
        ),
      );
    } else {
      return LinearProgressIndicator(
        color: context.colorScheme.primary,
        borderRadius: const BorderRadius.all(Radius.zero),
        minHeight: 5,
        value:
            ref.watch(videoPlayerProvider(asset.heroTag).select((s) => s.position)).inMilliseconds /
            asset.duration.inMilliseconds,
      );
    }
  }

  Widget _getBlur(BuildContext context, int index) {
    final asset = widget.timeline.getAssetSafe(index);

    if (asset == null) {
      return Container();
    }

    return ImageFiltered(
      imageFilter: ImageFilter.blur(sigmaX: 30, sigmaY: 30),
      child: Container(
        decoration: BoxDecoration(
          image: DecorationImage(
            image: getFullImageProvider(asset, size: Size(context.width, context.height)),
            fit: BoxFit.cover,
          ),
        ),
        child: Container(color: Colors.black.withValues(alpha: 0.2)),
      ),
    );
  }

  Widget _getPhotoView(BuildContext context, int index) {
    final asset = widget.timeline.getAssetSafe(index);

    if (asset == null) {
      return const Center(child: ImmichLoadingIndicator());
    }

    final scale = _config.look == SlideshowLook.cover
        ? PhotoViewComputedScale.covered
        : PhotoViewComputedScale.contained;
    final isCurrent = _index == index;
    final imageProvider = getFullImageProvider(asset, size: context.sizeData);

    if (asset.isImage) {
      final zoomOut = index % 2 == 1;
      final elapsed = _stopwatch.elapsedMilliseconds;
      final duration = _config.duration * 1000;
      final progress = zoomOut ? 1.0 - elapsed / duration.toDouble() : elapsed / duration.toDouble();

      return TweenAnimationBuilder(
        tween: Tween<double>(
          begin: progress,
          end: _paused
              ? progress
              : zoomOut
              ? 0.0
              : 1.0,
        ),
        duration: Duration(milliseconds: _paused ? 1 : max(duration - elapsed, 1)),
        builder: (context, value, _) => PhotoView(
          imageProvider: imageProvider,
          index: index,
          disableScaleGestures: true,
          gaplessPlayback: true,
          filterQuality: FilterQuality.high,
          initialScale: scale * (1.0 + value / 10.0),
          controller: PhotoViewController(),
          onTapUp: (_, _, _) => _onTapUp(),
        ),
      );
    } else {
      final status = ref.watch(videoPlayerProvider(asset.heroTag).select((s) => s.status));
      final position = ref.read(videoPlayerProvider(asset.heroTag)).position;

      if (status == VideoPlaybackStatus.completed && isCurrent && position.inMicroseconds > 0) {
        _nextPage();
      } else if (status == VideoPlaybackStatus.playing) {
        ref.read(videoPlayerProvider(asset.heroTag).notifier).setLoop(false);
      }

      return PhotoView.customChild(
        onTapUp: (_, _, _) => _onTapUp(),
        disableScaleGestures: true,
        filterQuality: FilterQuality.high,
        initialScale: scale,
        child: NativeVideoViewer(
          asset: asset,
          isCurrent: isCurrent,
          image: Image(image: imageProvider, fit: BoxFit.contain, alignment: Alignment.center),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: PreferredSize(
        preferredSize: Size(AppBar().preferredSize.width, AppBar().preferredSize.height + 5),
        child: IgnorePointer(
          ignoring: !_showAppBar,
          child: AnimatedOpacity(
            opacity: _showAppBar ? 1.0 : 0.0,
            duration: Durations.short2,
            child: Column(
              children: [
                AppBar(
                  backgroundColor: context.scaffoldBackgroundColor,
                  title: Text("slideshow".t(context: context)),
                  actions: [
                    IconButton(
                      onPressed: _paused ? _play : _pause,
                      icon: Icon(_paused ? Icons.play_arrow : Icons.pause),
                    ),
                    IconButton(
                      onPressed: () {
                        _pause();
                        context.pushRoute(SettingsSubRoute(section: SettingSection.assetViewer));
                      },
                      icon: const Icon(Icons.settings),
                    ),
                  ],
                ),
                _getProgressBar(context),
              ],
            ),
          ),
        ),
      ),
      extendBody: true,
      extendBodyBehindAppBar: true,
      backgroundColor: Colors.black,
      body: PhotoViewGestureDetectorScope(
        axis: Axis.horizontal,
        child: PageView.builder(
          controller: _pageController,
          physics: const FastClampingScrollPhysics(),
          itemCount: widget.timeline.totalAssets,
          onPageChanged: _pageChanged,
          itemBuilder: (context, index) => Stack(
            children: [
              if (_config.look == SlideshowLook.blurredBackground) _getBlur(context, index),
              _getPhotoView(context, index),
            ],
          ),
        ),
      ),
    );
  }
}
