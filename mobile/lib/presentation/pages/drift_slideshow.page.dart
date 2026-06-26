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
import 'package:immich_mobile/providers/infrastructure/settings.provider.dart';
import 'package:immich_mobile/routing/router.dart';
import 'package:immich_mobile/utils/system_ui.utils.dart';
import 'package:immich_mobile/widgets/common/immich_loading_indicator.dart';
import 'package:immich_mobile/widgets/photo_view/photo_view.dart';
import 'package:wakelock_plus/wakelock_plus.dart';

@RoutePage()
class DriftSlideshowPage extends ConsumerStatefulWidget {
  final TimelineService timeline;

  const DriftSlideshowPage({super.key, required this.timeline});

  @override
  ConsumerState<DriftSlideshowPage> createState() => _DriftSlideshowPageState();
}

class _DriftSlideshowPageState extends ConsumerState<DriftSlideshowPage> with SingleTickerProviderStateMixin {
  static const double _kenBurnsZoom = 0.1;

  late SlideshowConfig _config;
  late final PageController _pageController;
  late final Stopwatch _stopwatch;
  late Timer _timer;
  late int _index;
  late int _nextIndex;
  bool _paused = false;
  bool _showAppBar = false;

  late final AnimationController _crossfadeController;
  late final Animation<double> _crossfadeOpacity;
  int? _crossfadeFromIndex;
  int? _crossfadeToIndex;
  int _zoomCycle = 0;

  @override
  initState() {
    super.initState();
    _config = ref.read(appConfigProvider.select((s) => s.slideshow));
    final asset = ref.read(assetViewerProvider).currentAsset;
    _index = asset == null ? 0 : widget.timeline.getIndex(asset.heroTag) ?? 0;
    _pageController = PageController(initialPage: _index);
    _crossfadeController = AnimationController(vsync: this, duration: Durations.extralong2);
    _crossfadeOpacity = Tween<double>(begin: 1.0, end: 0.0).animate(_crossfadeController);
    _stopwatch = Stopwatch();
    _createTimer();
    _updateNextIndex();
    ref.listenManual(appConfigProvider.select((s) => s.slideshow), _onConfigChanged);

    SystemChrome.setEnabledSystemUIMode(SystemUiMode.immersive);
    unawaited(WakelockPlus.enable());
  }

  @override
  dispose() {
    _timer.cancel();
    _stopwatch.stop();
    _pageController.dispose();
    _crossfadeController.dispose();
    unawaited(WakelockPlus.disable());
    unawaited(restoreEdgeToEdge());
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

  void _onConfigChanged(SlideshowConfig? previous, SlideshowConfig next) {
    if (_config == next) {
      return;
    }

    final durationChanged = _config.duration != next.duration;
    _config = next;
    _updateNextIndex();

    final asset = widget.timeline.getAssetSafe(_index);
    if (durationChanged && !_paused && asset?.isImage == true) {
      _timer.cancel();
      _createTimer();
    }

    setState(() {});
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
      } else {
        setState(() {
          _paused = true;
        });
      }
      return;
    }

    if (!widget.timeline.hasRange(_nextIndex, 1)) {
      await widget.timeline.preloadAssets(_nextIndex);
    }

    _crossFadeToPage(_nextIndex);
  }

  void _crossFadeToPage(int page) {
    final previousIndex = _index;
    _pageController.jumpToPage(page);
    setState(() {
      _crossfadeFromIndex = previousIndex;
      _crossfadeToIndex = page;
    });
    _crossfadeController.forward(from: 0.0).whenComplete(() {
      if (mounted) {
        setState(() {
          _crossfadeFromIndex = null;
          _crossfadeToIndex = null;
        });
      }
    });
  }

  Widget _getCrossfadeLayer(BuildContext context, int index, {required bool isIncoming}) {
    final asset = widget.timeline.getAssetSafe(index);

    final Widget child;
    if (isIncoming && asset?.isImage == true) {
      child = _getPhotoView(context, index);
    } else {
      final zoomOut = isIncoming ? _zoomCycle.isOdd : _zoomCycle.isEven;
      final zoom = isIncoming ? (zoomOut ? 1.0 : 0.0) : (zoomOut ? 0.0 : 1.0);
      child = _getCrossfadeChild(context, index, zoom);
    }

    return Stack(
      fit: StackFit.expand,
      children: [if (_config.look == SlideshowLook.blurredBackground) _getBlur(context, index), child],
    );
  }

  Widget _getCrossfadeChild(BuildContext context, int index, double zoom) {
    final asset = widget.timeline.getAssetSafe(index);

    if (asset == null) {
      return const SizedBox.shrink();
    }

    final scale = _config.look == SlideshowLook.cover
        ? PhotoViewComputedScale.covered
        : PhotoViewComputedScale.contained;

    return PhotoView(
      imageProvider: getFullImageProvider(asset, size: context.sizeData),
      index: index,
      disableScaleGestures: true,
      gaplessPlayback: true,
      filterQuality: FilterQuality.high,
      initialScale: scale * (1.0 + zoom * _kenBurnsZoom),
      controller: PhotoViewController(),
    );
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
      _zoomCycle++;

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
    await (_showAppBar ? SystemChrome.setEnabledSystemUIMode(SystemUiMode.immersive) : restoreEdgeToEdge());

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
      final zoomOut = _zoomCycle.isOdd;
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
          initialScale: scale * (1.0 + value * _kenBurnsZoom),
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
          imageProvider: imageProvider,
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
      body: Stack(
        children: [
          PhotoViewGestureDetectorScope(
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
          if (_crossfadeFromIndex != null && _crossfadeToIndex != null)
            Positioned.fill(
              child: IgnorePointer(
                child: Stack(
                  fit: StackFit.expand,
                  children: [
                    const ColoredBox(color: Colors.black),
                    FadeTransition(
                      opacity: _crossfadeController,
                      child: _getCrossfadeLayer(context, _crossfadeToIndex!, isIncoming: true),
                    ),
                    FadeTransition(
                      opacity: _crossfadeOpacity,
                      child: _getCrossfadeLayer(context, _crossfadeFromIndex!, isIncoming: false),
                    ),
                  ],
                ),
              ),
            ),
        ],
      ),
    );
  }
}
