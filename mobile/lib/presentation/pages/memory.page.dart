import 'dart:async';

import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:flutter/scheduler.dart';
import 'package:flutter/services.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/models/memory.model.dart';
import 'package:immich_mobile/generated/translations.g.dart';
import 'package:immich_mobile/presentation/widgets/images/image_provider.dart';
import 'package:immich_mobile/presentation/widgets/memory/memory_bottom_info.widget.dart';
import 'package:immich_mobile/presentation/widgets/memory/memory_card.widget.dart';
import 'package:immich_mobile/presentation/widgets/slideshow/slideshow_controller.dart';
import 'package:immich_mobile/providers/asset_viewer/asset_viewer.provider.dart';
import 'package:immich_mobile/providers/asset_viewer/video_player_provider.dart';
import 'package:immich_mobile/providers/haptic_feedback.provider.dart';
import 'package:immich_mobile/providers/infrastructure/settings.provider.dart';
import 'package:immich_mobile/utils/system_ui.utils.dart';
import 'package:immich_mobile/widgets/memories/memory_epilogue.dart';
import 'package:immich_mobile/widgets/memories/memory_progress_indicator.dart';

const _kMemoryAssetDuration = Duration(seconds: 5);

/// Expects the current asset to be set via [assetViewerProvider] before navigating to this page
@RoutePage()
class MemoryPage extends ConsumerStatefulWidget {
  final List<Memory> memories;
  final int memoryIndex;

  const MemoryPage({required this.memories, required this.memoryIndex, super.key});

  static void setMemory(WidgetRef ref, Memory memory) {
    if (memory.assets.isNotEmpty) {
      ref.read(assetViewerProvider.notifier).setAsset(memory.assets.first);
    }
  }

  @override
  ConsumerState<MemoryPage> createState() => _MemoryPageState();
}

class _MemoryPageState extends ConsumerState<MemoryPage> with TickerProviderStateMixin implements SlideshowDelegate {
  late final SlideshowController _slideshow;
  late final PageController _memoryPageController;
  late final List<PageController> _assetPageControllers;

  late final List<int> _offsets;
  late final int _totalAssets;

  int _currentMemoryIndex = 0;
  int _currentAssetPage = 0;
  bool _onEpilogue = false;

  bool _userPaused = false;

  RemoteAsset? _currentAsset;

  List<Memory> get _memories => widget.memories;

  bool get _autoplay => ref.read(appConfigProvider).viewer.autoplayMemories;

  int _encode(int memory, int asset) => _offsets[memory] + asset;

  (int, int) _decode(int index) {
    for (var m = _memories.length - 1; m >= 0; m--) {
      if (index >= _offsets[m]) {
        return (m, index - _offsets[m]);
      }
    }
    return (0, 0);
  }

  RemoteAsset? _assetAtFlat(int index) {
    if (index < 0 || index >= _totalAssets) {
      return null;
    }
    final (m, a) = _decode(index);
    return _memories[m].assets[a];
  }

  @override
  void initState() {
    super.initState();

    _offsets = List<int>.filled(_memories.length, 0);
    var running = 0;
    for (var m = 0; m < _memories.length; m++) {
      _offsets[m] = running;
      running += _memories[m].assets.length;
    }
    _totalAssets = running;

    _currentMemoryIndex = widget.memoryIndex;
    _currentAsset = _memories[widget.memoryIndex].assets.isNotEmpty ? _memories[widget.memoryIndex].assets.first : null;

    _memoryPageController = PageController(initialPage: widget.memoryIndex);
    _assetPageControllers = List.generate(_memories.length, (_) => PageController());

    _slideshow = SlideshowController(
      vsync: this,
      slideDuration: _kMemoryAssetDuration,
      initialIndex: _encode(widget.memoryIndex, 0),
      delegate: this,
    );

    ref.listenManual(appConfigProvider.select((c) => c.viewer.autoplayMemories), (_, enabled) {
      if (enabled && !_userPaused && !_onEpilogue) {
        _slideshow.resume();
      } else if (!enabled) {
        _slideshow.pause();
      }
    });

    unawaited(SystemChrome.setEnabledSystemUIMode(SystemUiMode.immersive));

    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) {
        return;
      }
      if (!_autoplay) {
        _slideshow.pause();
      }
      _slideshow.goToNextSlide();
      unawaited(_precacheAsset(1));
    });
  }

  @override
  void dispose() {
    _slideshow.dispose();
    _memoryPageController.dispose();
    for (final controller in _assetPageControllers) {
      controller.dispose();
    }
    unawaited(restoreEdgeToEdge());
    super.dispose();
  }

  @override
  int? nextIndexAfter(int index) {
    if (index >= _totalAssets) {
      return null;
    }
    final (m, a) = _decode(index);
    if (a + 1 < _memories[m].assets.length) {
      return index + 1;
    }
    if (m + 1 < _memories.length) {
      return _encode(m + 1, 0);
    }
    // Past the last asset lies the epilogue
    return _totalAssets;
  }

  @override
  Duration? videoProgressOf(int index) {
    if (!_autoplay) {
      return null;
    }
    final asset = _assetAtFlat(index);
    if (asset == null || asset.isImage) {
      return null;
    }
    return ref.read(videoPlayerProvider(asset.id)).position;
  }

  @override
  bool isVideoCompleted(int index) {
    if (!_autoplay) {
      return false;
    }
    final asset = _assetAtFlat(index);
    if (asset == null || asset.isImage) {
      return false;
    }
    return ref.read(videoPlayerProvider(asset.id)).status == VideoPlaybackStatus.completed;
  }

  @override
  void onPlaybackChanged(int index, bool playing) {
    final asset = _assetAtFlat(index);
    if (asset == null || asset.isImage) {
      return;
    }
    final notifier = ref.read(videoPlayerProvider(asset.id).notifier);
    unawaited(playing ? notifier.play() : notifier.pause());
  }

  @override
  void onShowSlide(int index, int prevIndex) {
    if (index == prevIndex) {
      _slideshow.didCompleteShowSlide(index);
    } else if (index >= _totalAssets) {
      unawaited(_toNextMemory());
    } else if (_decode(index).$1 == _decode(prevIndex.clamp(0, _totalAssets - 1)).$1) {
      _toNextAsset(_currentAssetPage);
    } else {
      unawaited(_toNextMemory());
    }
  }

  Future<void> _toNextMemory() {
    return _memoryPageController.nextPage(duration: const Duration(milliseconds: 500), curve: Curves.easeIn);
  }

  void _toPreviousMemory() {
    if (_currentMemoryIndex == 0) {
      return;
    }
    unawaited(_memoryPageController.previousPage(duration: const Duration(milliseconds: 500), curve: Curves.easeIn));

    void jumpToEnd() {
      final previousIndex = _currentMemoryIndex - 1;
      final controller = _assetPageControllers[previousIndex];
      if (controller.hasClients) {
        controller.jumpToPage(_memories[previousIndex].assets.length - 1);
      } else {
        SchedulerBinding.instance.addPostFrameCallback((_) {
          if (controller.hasClients) {
            controller.jumpToPage(_memories[previousIndex].assets.length - 1);
          }
        });
      }
    }

    SchedulerBinding.instance.addPostFrameCallback((_) => jumpToEnd());
  }

  void _toNextAsset(int currentAssetIndex) {
    if (currentAssetIndex + 1 < _memories[_currentMemoryIndex].assets.length) {
      unawaited(
        _assetPageControllers[_currentMemoryIndex].nextPage(
          curve: Curves.easeInOut,
          duration: const Duration(milliseconds: 500),
        ),
      );
    } else {
      unawaited(_toNextMemory());
    }
  }

  void _toPreviousAsset(int currentAssetIndex) {
    if (currentAssetIndex > 0) {
      unawaited(
        _assetPageControllers[_currentMemoryIndex].previousPage(
          curve: Curves.easeInOut,
          duration: const Duration(milliseconds: 500),
        ),
      );
    } else {
      _toPreviousMemory();
    }
  }

  Future<void> _precacheAsset(int index) async {
    if (index < 0 || !mounted) {
      return;
    }

    final currentMemory = _memories[_currentMemoryIndex];
    late RemoteAsset asset;
    if (index < currentMemory.assets.length) {
      asset = currentMemory.assets[index];
    } else {
      final nextMemoryIndex = _currentMemoryIndex + 1;
      if (nextMemoryIndex >= _memories.length) {
        return;
      }
      asset = _memories[nextMemoryIndex].assets.first;
    }

    final size = MediaQuery.sizeOf(context);
    await precacheImage(getFullImageProvider(asset, size: Size(size.width, size.height)), context, size: size);
  }

  Future<void> _onAssetChanged(int memoryIndex, int assetIndex) async {
    ref.read(hapticFeedbackProvider.notifier).selectionClick();
    setState(() {
      _currentMemoryIndex = memoryIndex;
      _currentAssetPage = assetIndex;
    });
    _slideshow.didCompleteShowSlide(_encode(memoryIndex, assetIndex));

    final activeMemory = _memories[memoryIndex];

    // Wait for the page change animation before precaching, then bail if the
    // visible memory changed underneath us
    await Future.delayed(const Duration(milliseconds: 400));
    if (!mounted || _currentMemoryIndex != memoryIndex) {
      return;
    }
    await _precacheAsset(assetIndex + 1);
    if (!mounted || _currentMemoryIndex != memoryIndex) {
      return;
    }

    final asset = activeMemory.assets[assetIndex];
    setState(() => _currentAsset = asset);
    ref.read(assetViewerProvider.notifier).setAsset(asset);
  }

  void _onMemoryChanged(int pageNumber) {
    ref.read(hapticFeedbackProvider.notifier).mediumImpact();

    if (pageNumber >= _memories.length) {
      // Epilogue: no next slide, so stop the timer and settle the controller there
      setState(() => _onEpilogue = true);
      _slideshow.pause();
      _slideshow.didCompleteShowSlide(_totalAssets);
      return;
    }

    setState(() {
      _onEpilogue = false;
      _currentMemoryIndex = pageNumber;
      _currentAssetPage = 0;
      if (_memories[pageNumber].assets.isNotEmpty) {
        _currentAsset = _memories[pageNumber].assets.first;
      }
    });

    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) {
        MemoryPage.setMemory(ref, _memories[pageNumber]);
      }
    });

    _slideshow.didCompleteShowSlide(_encode(pageNumber, 0));
  }

  void _togglePause() {
    setState(() => _userPaused = !_userPaused);
    _userPaused ? _slideshow.pause() : _slideshow.resume();
  }

  void _holdPause() {
    if (_autoplay && !_userPaused) {
      _slideshow.pause();
    }
  }

  void _holdResume() {
    if (_autoplay && !_userPaused && !_onEpilogue) {
      _slideshow.resume();
    }
  }

  void _onVideoCompleted(RemoteAsset asset) {
    if (_assetAtFlat(_slideshow.currentIndex)?.id == asset.id) {
      _slideshow.didCompleteVideo();
    }
  }

  @override
  Widget build(BuildContext context) {
    final autoplay = ref.watch(appConfigProvider.select((config) => config.viewer.autoplayMemories));

    return NotificationListener<ScrollNotification>(
      onNotification: (notification) => _onScroll(notification, autoplay),
      child: Scaffold(
        backgroundColor: Colors.black,
        body: SafeArea(
          child: ListenableBuilder(
            listenable: _slideshow,
            builder: (context, _) => PageView.builder(
              physics: const BouncingScrollPhysics(parent: AlwaysScrollableScrollPhysics()),
              scrollDirection: Axis.vertical,
              controller: _memoryPageController,
              onPageChanged: _onMemoryChanged,
              itemCount: _memories.length + 1,
              itemBuilder: (context, mIndex) =>
                  mIndex == _memories.length ? _buildEpilogue() : _buildMemoryPage(context, mIndex, autoplay),
            ),
          ),
        ),
      ),
    );
  }

  bool _onScroll(ScrollNotification notification, bool autoplay) {
    // Freeze the timer while the user drags so it doesn't fight the scroll
    if (notification is ScrollStartNotification && autoplay && !_userPaused && !_onEpilogue) {
      _slideshow.pause();
    } else if (notification is ScrollEndNotification && autoplay && !_userPaused && !_onEpilogue) {
      _slideshow.resume();
    } else if (notification is ScrollUpdateNotification) {
      // Overscrolling past the epilogue pops the page
      final isEpiloguePage = (_memoryPageController.page?.floor() ?? 0) >= _memories.length;
      if (isEpiloguePage && notification.metrics.pixels > notification.metrics.maxScrollExtent + 150) {
        unawaited(context.maybePop());
        return true;
      }
    }
    return false;
  }

  Widget _buildEpilogue() {
    return MemoryEpilogue(
      onStartOver: () =>
          _memoryPageController.animateToPage(0, duration: const Duration(seconds: 1), curve: Curves.easeInOut),
    );
  }

  Widget _buildMemoryPage(BuildContext context, int mIndex, bool autoplay) {
    final yearsAgo = DateTime.now().year - _memories[mIndex].data.year;
    final title = context.t.years_ago(years: yearsAgo);
    final assetController = _assetPageControllers[mIndex];

    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.only(left: 24.0, right: 24.0, top: 8.0, bottom: 2.0),
          child: _buildProgressBar(mIndex, assetController, autoplay),
        ),
        Expanded(
          child: Stack(
            children: [
              PageView.builder(
                physics: const BouncingScrollPhysics(parent: AlwaysScrollableScrollPhysics()),
                controller: assetController,
                onPageChanged: (assetIndex) => _onAssetChanged(mIndex, assetIndex),
                scrollDirection: Axis.horizontal,
                itemCount: _memories[mIndex].assets.length,
                itemBuilder: (context, index) => _buildAsset(mIndex, index, title, autoplay),
              ),
              _buildCloseButton(context),
              if (autoplay) _buildPauseButton(),
              if (_currentAsset != null && _currentAsset!.isVideo) ...[
                if (autoplay) _MemoryVideoCompletionListener(asset: _currentAsset!, onCompleted: _onVideoCompleted),
                Positioned(bottom: 24, right: 32, child: Icon(Icons.videocam_outlined, color: Colors.grey[200])),
              ],
            ],
          ),
        ),
        MemoryBottomInfo(memory: _memories[mIndex], title: title),
      ],
    );
  }

  Widget _buildProgressBar(int mIndex, PageController assetController, bool autoplay) {
    return AnimatedBuilder(
      // With autoplay the fill is driven by the timer, otherwise by the scrolled page
      animation: autoplay ? _slideshow.progress : assetController,
      builder: (context, _) {
        final assetCount = _memories[mIndex].assets.length;
        double value;
        if (!autoplay) {
          final page = assetController.hasClients ? (assetController.page ?? 0) : 0.0;
          value = (page + 1) / assetCount;
        } else if (mIndex == _currentMemoryIndex) {
          value = (_currentAssetPage + _slideshow.progress.value) / assetCount;
        } else {
          value = mIndex < _currentMemoryIndex ? 1.0 : 0.0;
        }
        return MemoryProgressIndicator(ticks: assetCount, value: value.clamp(0.0, 1.0));
      },
    );
  }

  Widget _buildAsset(int mIndex, int index, String title, bool autoplay) {
    final asset = _memories[mIndex].assets[index];
    return Stack(
      children: [
        ColoredBox(
          color: Colors.black,
          child: MemoryCard(
            asset: asset,
            title: title,
            showTitle: index == 0,
            isCurrent: mIndex == _currentMemoryIndex && index == _currentAssetPage,
          ),
        ),
        Positioned.fill(
          child: Row(
            children: [
              _buildTapZone(autoplay, () => _toPreviousAsset(index)),
              _buildTapZone(autoplay, () => _toNextAsset(index)),
            ],
          ),
        ),
      ],
    );
  }

  /// Half-screen tap target that navigates on tap and pauses on press-and-hold.
  Widget _buildTapZone(bool autoplay, VoidCallback onTap) {
    return Expanded(
      child: GestureDetector(
        behavior: HitTestBehavior.translucent,
        onTap: onTap,
        onLongPressStart: autoplay ? (_) => _holdPause() : null,
        onLongPressEnd: autoplay ? (_) => _holdResume() : null,
        onLongPressCancel: autoplay ? _holdResume : null,
      ),
    );
  }

  Widget _buildCloseButton(BuildContext context) {
    return Positioned(
      top: 8,
      left: 8,
      child: MaterialButton(
        minWidth: 0,
        onPressed: () {
          // auto_route doesn't invoke pop scope, so turn off full screen mode here
          // https://github.com/Milad-Akarie/auto_route_library/issues/1799
          unawaited(context.maybePop());
          unawaited(restoreEdgeToEdge());
        },
        shape: const CircleBorder(),
        color: Colors.white.withValues(alpha: 0.2),
        elevation: 0,
        child: const Icon(Icons.close_rounded, color: Colors.white),
      ),
    );
  }

  Widget _buildPauseButton() {
    return Positioned(
      top: 8,
      right: 8,
      child: MaterialButton(
        minWidth: 0,
        onPressed: _togglePause,
        shape: const CircleBorder(),
        color: Colors.white.withValues(alpha: 0.2),
        elevation: 0,
        child: Icon(_userPaused ? Icons.play_arrow_rounded : Icons.pause_rounded, color: Colors.white),
      ),
    );
  }
}

/// Invisible listener that reports when [asset]'s video finishes playing, kept
/// as a widget so the subscription stays unconditional
class _MemoryVideoCompletionListener extends ConsumerWidget {
  final RemoteAsset asset;
  final void Function(RemoteAsset asset) onCompleted;

  const _MemoryVideoCompletionListener({required this.asset, required this.onCompleted});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    ref.listen(videoPlayerProvider(asset.id).select((s) => s.status), (_, status) {
      if (status == VideoPlaybackStatus.completed) {
        onCompleted(asset);
      }
    });
    return const SizedBox.shrink();
  }
}
