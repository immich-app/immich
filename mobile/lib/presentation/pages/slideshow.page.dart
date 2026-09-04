import 'dart:async';

import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/enums.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/models/config/slideshow_config.dart';
import 'package:immich_mobile/domain/services/timeline.service.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/extensions/scroll_extensions.dart';
import 'package:immich_mobile/generated/translations.g.dart';
import 'package:immich_mobile/pages/common/settings.page.dart';
import 'package:immich_mobile/presentation/widgets/slideshow/slideshow_controller.dart';
import 'package:immich_mobile/presentation/widgets/slideshow/slideshow_progress_bar.widget.dart';
import 'package:immich_mobile/presentation/widgets/slideshow/slideshow_slide.widget.dart';
import 'package:immich_mobile/providers/asset_viewer/asset_viewer.provider.dart';
import 'package:immich_mobile/providers/asset_viewer/video_player_provider.dart';
import 'package:immich_mobile/providers/infrastructure/settings.provider.dart';
import 'package:immich_mobile/routing/router.dart';
import 'package:immich_mobile/utils/system_ui.utils.dart';
import 'package:immich_mobile/widgets/common/immich_loading_indicator.dart';
import 'package:immich_mobile/widgets/photo_view/photo_view.dart';
import 'package:wakelock_plus/wakelock_plus.dart';

@RoutePage()
class SlideshowPage extends ConsumerStatefulWidget {
  final TimelineService timeline;

  const SlideshowPage({super.key, required this.timeline});

  @override
  ConsumerState<SlideshowPage> createState() => _SlideshowPageState();
}

class _SlideshowPageState extends ConsumerState<SlideshowPage>
    with TickerProviderStateMixin
    implements SlideshowDelegate {
  late final SlideshowController _slideshow;
  late final PageController _pageController;

  late final AnimationController _fade;
  late final Animation<double> _fadeOut;

  /// While non-null, a frozen copy of this slide is fading out over the live page.
  int? _fadingSlideIndex;

  bool _showAppBar = false;
  bool _disableAnimations = false;

  SlideshowConfig get _config => ref.read(appConfigProvider).slideshow;

  BaseAsset? _assetAt(int index) => widget.timeline.getAssetSafe(index);

  BaseAsset? _videoAt(int index) {
    final asset = _assetAt(index);

    if (asset == null || asset.isImage) {
      return null;
    }

    return asset;
  }

  VideoPlayerState _videoState(BaseAsset asset) => ref.read(videoPlayerProvider(asset.id));

  VideoPlayerNotifier? _videoNotifier(int index) {
    final video = _videoAt(index);

    if (video == null) {
      return null;
    }

    return ref.read(videoPlayerProvider(video.id).notifier);
  }

  @override
  void initState() {
    super.initState();

    final asset = ref.read(assetViewerProvider).currentAsset;
    final assetIndex = asset != null ? widget.timeline.getIndex(asset.heroTag) : null;
    final initialIndex = assetIndex ?? 0;

    _pageController = PageController(initialPage: initialIndex);
    _fade = AnimationController(vsync: this, duration: Durations.extralong2);
    _fadeOut = _fade.drive(Tween(begin: 1.0, end: 0.0));

    _slideshow = SlideshowController(
      vsync: this,
      slideDuration: Duration(seconds: _config.duration),
      initialIndex: initialIndex,
      delegate: this,
    );

    ref.listenManual(appConfigProvider.select((s) => s.slideshow), (previous, next) {
      _slideshow.slideDuration = Duration(seconds: next.duration);

      // A new direction or repeat change can cause a different next slide
      _slideshow.recalculateNextIndex();
    });

    _slideshow.goToNextSlide();

    unawaited(SystemChrome.setEnabledSystemUIMode(SystemUiMode.immersive));
    unawaited(WakelockPlus.enable());
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    _disableAnimations = MediaQuery.disableAnimationsOf(context);
  }

  @override
  void dispose() {
    _slideshow.dispose();
    _fade.dispose();
    _pageController.dispose();

    unawaited(WakelockPlus.disable());
    unawaited(restoreEdgeToEdge());
    super.dispose();
  }

  @override
  int? nextIndexAfter(int index) {
    if (widget.timeline.totalAssets == 0) {
      return null;
    }

    var next = switch (_config.direction) {
      SlideshowDirection.forward => index + 1,
      SlideshowDirection.backward => index - 1,
      SlideshowDirection.shuffle => widget.timeline.getIndex(widget.timeline.getRandomAsset().heroTag)!,
    };

    if (next < 0 || next >= widget.timeline.totalAssets) {
      // Out of bounds
      if (!_config.repeat) {
        // Don't wrap. End of slideshow
        return null;
      }

      // Do wrap
      next = _config.direction == SlideshowDirection.forward ? 0 : widget.timeline.totalAssets - 1;
    }

    if (!widget.timeline.hasRange(next, 1)) {
      // Async preload this index. We don't want to wait on it, just get it started so the asset is more likely to be ready in time
      unawaited(widget.timeline.preloadAssets(next));
    }

    return next;
  }

  @override
  Duration? videoProgressOf(int index) {
    final video = _videoAt(index);

    if (video == null) {
      return null;
    }

    return _videoState(video).position;
  }

  @override
  bool isVideoCompleted(int index) {
    final video = _videoAt(index);

    return video != null && _videoState(video).status == VideoPlaybackStatus.completed;
  }

  @override
  void onPlaybackChanged(int index, bool playing) {
    final video = _videoNotifier(index);

    unawaited(playing ? video?.play() : video?.pause());
  }

  @override
  void onShowSlide(int index, int prevIndex) {
    unawaited(() async {
      if (index == prevIndex) {
        // Showing the same slide again. Don't need to animate
        if (isVideoCompleted(index)) {
          unawaited(_videoNotifier(index)?.restart());
        }

        _slideshow.didCompleteShowSlide(index);

        return;
      }

      if (!widget.timeline.hasRange(index, 1)) {
        // If it wasn't already loaded by [nextIndexAfter], make sure we have the new asset synchronously
        await widget.timeline.preloadAssets(index);
      }

      if (!mounted || _slideshow.currentIndex != prevIndex) {
        // User triggered another slide while we waited on preload
        return;
      }

      _pageController.jumpToPage(index);

      // didCompleteShowSlide will be called by onPageChanged, so we don't need to call it in any of these branches
      if (_disableAnimations) {
        return;
      }

      setState(() => _fadingSlideIndex = prevIndex);

      unawaited(
        _fade.forward(from: 0.0).whenComplete(() {
          if (mounted) {
            setState(() => _fadingSlideIndex = null);
          }
        }),
      );
    }());
  }

  Future<void> _onTapUp() async {
    await (_showAppBar ? SystemChrome.setEnabledSystemUIMode(SystemUiMode.immersive) : restoreEdgeToEdge());

    WidgetsBinding.instance.addPostFrameCallback((_) {
      setState(() {
        _showAppBar = !_showAppBar;
      });
    });
  }

  /// Zoom for the current Ken Burns cycle, moving from 0 -> 1, or 1 -> 0
  Animation<double> get _zoom {
    if (_disableAnimations) {
      return const AlwaysStoppedAnimation(0.0);
    }

    return _slideshow.progress.drive(
      _slideshow.shouldZoomOut ? Tween(begin: 1.0, end: 0.0) : Tween(begin: 0.0, end: 1.0),
    );
  }

  Widget _buildSlide(int index, SlideshowLook look) {
    final asset = _assetAt(index);
    if (asset == null) {
      return const Center(child: ImmichLoadingIndicator());
    }

    return SlideshowSlide(
      asset: asset,
      index: index,
      look: look,
      zoom: _zoom,
      isCurrent: _slideshow.currentIndex == index,
      onTapUp: _onTapUp,
      onCompleted: _slideshow.didCompleteVideo,
    );
  }

  /// The outgoing slide, frozen in its last position
  Widget _buildFadingSlide(int index, SlideshowLook look) {
    final asset = _assetAt(index);
    if (asset == null) {
      return const SizedBox.shrink();
    }

    return SlideshowSlide.frozen(asset: asset, index: index, look: look, zoom: _slideshow.shouldZoomOut ? 1.0 : 0.0);
  }

  @override
  Widget build(BuildContext context) {
    final config = ref.watch(appConfigProvider.select((s) => s.slideshow));

    return ListenableBuilder(
      listenable: _slideshow,
      builder: (context, _) {
        final currentAsset = _assetAt(_slideshow.currentIndex);
        final progressBar = currentAsset != null
            ? SlideshowProgressBar(asset: currentAsset, progress: _slideshow.progress)
            : const SizedBox.shrink();

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
                      title: Text(context.t.slideshow),
                      actions: [
                        IconButton(
                          onPressed: _slideshow.paused ? _slideshow.resume : _slideshow.pause,
                          icon: Icon(_slideshow.paused ? Icons.play_arrow : Icons.pause),
                        ),
                        IconButton(
                          onPressed: () {
                            if (!_slideshow.paused) {
                              _slideshow.pause();
                            }
                            unawaited(context.pushRoute(SettingsSubRoute(section: SettingSection.assetViewer)));
                          },
                          icon: const Icon(Icons.settings),
                        ),
                      ],
                    ),
                    progressBar,
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
                  onPageChanged: _slideshow.didCompleteShowSlide,
                  itemBuilder: (context, index) => _buildSlide(index, config.look),
                ),
              ),
              if (_fadingSlideIndex != null)
                Positioned.fill(
                  child: IgnorePointer(
                    child: FadeTransition(opacity: _fadeOut, child: _buildFadingSlide(_fadingSlideIndex!, config.look)),
                  ),
                ),
            ],
          ),
        );
      },
    );
  }
}
