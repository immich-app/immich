import 'dart:async';

import 'package:auto_route/auto_route.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/album/album.model.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/models/events.model.dart';
import 'package:immich_mobile/domain/services/timeline.service.dart';
import 'package:immich_mobile/domain/utils/event_stream.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/extensions/platform_extensions.dart';
import 'package:immich_mobile/extensions/scroll_extensions.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/download_status_floating_button.widget.dart';
import 'package:immich_mobile/presentation/widgets/asset_viewer/asset_page.widget.dart';
import 'package:immich_mobile/presentation/widgets/asset_viewer/asset_preloader.dart';
import 'package:immich_mobile/presentation/widgets/asset_viewer/asset_stack.provider.dart';
import 'package:immich_mobile/providers/asset_viewer/asset_viewer.provider.dart';
import 'package:immich_mobile/presentation/widgets/asset_viewer/viewer_top_app_bar.widget.dart';
import 'package:immich_mobile/presentation/widgets/asset_viewer/viewer_bottom_app_bar.widget.dart';
import 'package:immich_mobile/providers/cast.provider.dart';
import 'package:immich_mobile/providers/infrastructure/current_album.provider.dart';
import 'package:immich_mobile/providers/infrastructure/timeline.provider.dart';
import 'package:immich_mobile/widgets/photo_view/photo_view.dart';

@RoutePage()
class AssetViewerPage extends StatelessWidget {
  final int initialIndex;
  final TimelineService timelineService;
  final int? heroOffset;
  final RemoteAlbum? currentAlbum;

  const AssetViewerPage({
    super.key,
    required this.initialIndex,
    required this.timelineService,
    this.heroOffset,
    this.currentAlbum,
  });

  @override
  Widget build(BuildContext context) {
    // This is necessary to ensure that the timeline service is available
    // since the Timeline and AssetViewer are on different routes / Widget subtrees.
    return ProviderScope(
      overrides: [
        timelineServiceProvider.overrideWithValue(timelineService),
        currentRemoteAlbumScopedProvider.overrideWithValue(currentAlbum),
      ],
      child: AssetViewer(initialIndex: initialIndex, heroOffset: heroOffset),
    );
  }
}

class AssetViewer extends ConsumerStatefulWidget {
  final int initialIndex;
  final int? heroOffset;

  const AssetViewer({super.key, required this.initialIndex, this.heroOffset});

  @override
  ConsumerState createState() => _AssetViewerState();

  static void setAsset(WidgetRef ref, BaseAsset asset) {
    ref.read(assetViewerProvider.notifier).reset();
    _setAsset(ref, asset);
  }

  static void _setAsset(WidgetRef ref, BaseAsset asset) {
    ref.read(assetViewerProvider.notifier).setAsset(asset);
    // Hide controls by default for videos
    if (asset.isVideo) ref.read(assetViewerProvider.notifier).setControls(false);
  }
}

class _AssetViewerState extends ConsumerState<AssetViewer> {
  late final _heroOffset = widget.heroOffset ?? TabsRouterScope.of(context)?.controller.activeIndex ?? 0;
  late final _pageController = PageController(initialPage: widget.initialIndex);
  late final _preloader = AssetPreloader(timelineService: ref.read(timelineServiceProvider), mounted: () => mounted);

  late int _currentPage = widget.initialIndex;
  late int _totalAssets = ref.read(timelineServiceProvider).totalAssets;

  StreamSubscription? _reloadSubscription;
  KeepAliveLink? _stackChildrenKeepAlive;

  void _onTapNavigate(int direction) {
    final page = _pageController.page?.toInt();
    if (page == null) return;
    final target = page + direction;
    final maxPage = _totalAssets - 1;
    if (target >= 0 && target <= maxPage) {
      _pageController.jumpToPage(target);
      _onAssetChanged(target);
    }
  }

  @override
  void initState() {
    super.initState();

    final asset = ref.read(assetViewerProvider).currentAsset;
    assert(asset != null, "Current asset should not be null when opening the AssetViewer");
    if (asset != null) _stackChildrenKeepAlive = ref.read(stackChildrenNotifier(asset).notifier).ref.keepAlive();

    _reloadSubscription = EventStream.shared.listen(_onEvent);

    WidgetsBinding.instance.addPostFrameCallback(_onAssetInit);

    final assetViewer = ref.read(assetViewerProvider);
    _setSystemUIMode(assetViewer.showingControls, assetViewer.showingDetails);
  }

  @override
  void dispose() {
    _pageController.dispose();
    _preloader.dispose();
    _reloadSubscription?.cancel();
    _stackChildrenKeepAlive?.close();

    SystemChrome.setEnabledSystemUIMode(SystemUiMode.edgeToEdge);

    super.dispose();
  }

  // The normal onPageChange callback listens to OnScrollUpdate events, and will
  // round the current page and update whenever that value changes. In practise,
  // this means that the page will change when swiped half way, and may flip
  // whilst dragging.
  //
  // Changing the page at the end of a scroll should be more robust, and allow
  // the page to be dragged more than half way whilst keeping the current video
  // playing, and preventing the video on the next page from becoming ready
  // unnecessarily.
  bool _onScrollEnd(ScrollEndNotification notification) {
    if (notification.depth != 0) return false;

    final page = _pageController.page?.round();
    if (page != null && page != _currentPage) {
      _onAssetChanged(page);
    }
    return false;
  }

  void _onAssetInit(Duration timeStamp) {
    _preloader.preload(widget.initialIndex, context.sizeData);
    _handleCasting();
  }

  void _onAssetChanged(int index) async {
    _currentPage = index;

    final asset = await ref.read(timelineServiceProvider).getAssetAsync(index);
    if (asset == null) return;

    AssetViewer._setAsset(ref, asset);
    _preloader.preload(index, context.sizeData);
    _handleCasting();
    _stackChildrenKeepAlive?.close();
    _stackChildrenKeepAlive = ref.read(stackChildrenNotifier(asset).notifier).ref.keepAlive();
  }

  void _handleCasting() {
    if (!ref.read(castProvider).isCasting) return;
    final asset = ref.read(assetViewerProvider).currentAsset;
    if (asset == null) return;

    if (asset is RemoteAsset) {
      context.scaffoldMessenger.hideCurrentSnackBar();
      ref.read(castProvider.notifier).loadMedia(asset, false);
      return;
    }

    context.scaffoldMessenger.clearSnackBars();
    ref.read(castProvider.notifier).stop();
    context.scaffoldMessenger.showSnackBar(
      SnackBar(
        duration: const Duration(seconds: 2),
        content: Text(
          "local_asset_cast_failed".tr(),
          style: context.textTheme.bodyLarge?.copyWith(color: context.primaryColor),
        ),
      ),
    );
  }

  void _onEvent(Event event) {
    switch (event) {
      case TimelineReloadEvent():
        _onTimelineReloadEvent();
      case ViewerReloadAssetEvent():
        _onViewerReloadEvent();
      default:
    }
  }

  void _onViewerReloadEvent() {
    if (_totalAssets <= 1) return;

    final index = _pageController.page?.round() ?? 0;
    final target = index >= _totalAssets - 1 ? index - 1 : index + 1;
    _pageController.animateToPage(target, duration: Durations.medium1, curve: Curves.easeInOut);
    _onAssetChanged(target);
  }

  void _onTimelineReloadEvent() {
    final timelineService = ref.read(timelineServiceProvider);
    final totalAssets = timelineService.totalAssets;

    if (totalAssets == 0) {
      context.maybePop();
      return;
    }

    final currentAsset = ref.read(assetViewerProvider).currentAsset;
    final assetIndex = currentAsset != null ? timelineService.getIndex(currentAsset.heroTag) : null;
    final index = (assetIndex ?? _currentPage).clamp(0, totalAssets - 1);

    if (index != _currentPage) {
      _pageController.jumpToPage(index);
      _onAssetChanged(index);
    } else if (currentAsset != null && assetIndex == null) {
      _onAssetChanged(index);
    }

    if (_totalAssets != totalAssets) {
      setState(() {
        _totalAssets = totalAssets;
      });
    }
  }

  void _setSystemUIMode(bool controls, bool details) {
    final mode = !controls || (CurrentPlatform.isIOS && details)
        ? SystemUiMode.immersiveSticky
        : SystemUiMode.edgeToEdge;
    unawaited(SystemChrome.setEnabledSystemUIMode(mode));
  }

  @override
  Widget build(BuildContext context) {
    final showingControls = ref.watch(assetViewerProvider.select((s) => s.showingControls));
    final showingDetails = ref.watch(assetViewerProvider.select((s) => s.showingDetails));
    final isZoomed = ref.watch(assetViewerProvider.select((s) => s.isZoomed));
    final backgroundColor = showingDetails
        ? context.colorScheme.surface
        : Colors.black.withValues(alpha: ref.watch(assetViewerProvider.select((s) => s.backgroundOpacity)));

    // Listen for casting changes and send initial asset to the cast provider
    ref.listen(castProvider.select((value) => value.isCasting), (_, isCasting) {
      if (!isCasting) return;
      WidgetsBinding.instance.addPostFrameCallback((_) {
        _handleCasting();
      });
    });

    ref.listen(assetViewerProvider.select((value) => (value.showingControls, value.showingDetails)), (_, state) {
      final (controls, details) = state;
      _setSystemUIMode(controls, details);
    });

    return Scaffold(
      backgroundColor: backgroundColor,
      resizeToAvoidBottomInset: false,
      appBar: const ViewerTopAppBar(),
      extendBody: true,
      extendBodyBehindAppBar: true,
      floatingActionButton: IgnorePointer(
        ignoring: !showingControls,
        child: AnimatedOpacity(
          opacity: showingControls ? 1.0 : 0.0,
          duration: Durations.short2,
          child: const DownloadStatusFloatingButton(),
        ),
      ),
      bottomNavigationBar: const ViewerBottomAppBar(),
      body: Stack(
        children: [
          NotificationListener<ScrollEndNotification>(
            onNotification: _onScrollEnd,
            child: PhotoViewGestureDetectorScope(
              axis: Axis.horizontal,
              child: PageView.builder(
                controller: _pageController,
                physics: isZoomed
                    ? const NeverScrollableScrollPhysics()
                    : CurrentPlatform.isIOS
                    ? const FastScrollPhysics()
                    : const FastClampingScrollPhysics(),
                itemCount: _totalAssets,
                itemBuilder: (context, index) =>
                    AssetPage(index: index, heroOffset: _heroOffset, onTapNavigate: _onTapNavigate),
              ),
            ),
          ),
          if (!CurrentPlatform.isIOS)
            IgnorePointer(
              child: AnimatedContainer(
                duration: Durations.short2,
                color: Colors.black.withValues(alpha: showingDetails ? 0.6 : 0.0),
                height: context.padding.top,
              ),
            ),
        ],
      ),
    );
  }
}
