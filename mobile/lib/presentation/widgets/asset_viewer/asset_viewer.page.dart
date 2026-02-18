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
import 'package:immich_mobile/presentation/widgets/asset_viewer/asset_viewer.state.dart';
import 'package:immich_mobile/presentation/widgets/asset_viewer/viewer_top_app_bar.widget.dart';
import 'package:immich_mobile/presentation/widgets/asset_viewer/viewer_bottom_app_bar.widget.dart';
import 'package:immich_mobile/providers/asset_viewer/video_player_controls_provider.dart';
import 'package:immich_mobile/providers/asset_viewer/video_player_value_provider.dart';
import 'package:immich_mobile/providers/cast.provider.dart';
import 'package:immich_mobile/providers/infrastructure/asset_viewer/asset.provider.dart';
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
    // Always holds the current asset from the timeline
    ref.read(assetViewerProvider.notifier).setAsset(asset);
    // The currentAssetNotifier actually holds the current asset that is displayed
    // which could be stack children as well
    ref.read(currentAssetNotifier.notifier).setAsset(asset);
    if (asset.isVideo || asset.isMotionPhoto) {
      ref.read(videoPlaybackValueProvider.notifier).reset();
      ref.read(videoPlayerControlsProvider.notifier).pause();
    }
    // Hide controls by default for videos
    if (asset.isVideo) ref.read(assetViewerProvider.notifier).setControls(false);
  }
}

class _AssetViewerState extends ConsumerState<AssetViewer> {
  late PageController pageController;

  StreamSubscription? _reloadSubscription;

  late final int heroOffset;
  bool _assetReloadRequested = false;
  int _totalAssets = 0;

  late final AssetPreloader _preloader;
  KeepAliveLink? _stackChildrenKeepAlive;

  @override
  void initState() {
    super.initState();
    assert(ref.read(currentAssetNotifier) != null, "Current asset should not be null when opening the AssetViewer");
    pageController = PageController(initialPage: widget.initialIndex);
    final timelineService = ref.read(timelineServiceProvider);
    _totalAssets = timelineService.totalAssets;
    _preloader = AssetPreloader(timelineService: timelineService, mounted: () => mounted);
    WidgetsBinding.instance.addPostFrameCallback(_onAssetInit);
    _reloadSubscription = EventStream.shared.listen(_onEvent);
    heroOffset = widget.heroOffset ?? TabsRouterScope.of(context)?.controller.activeIndex ?? 0;
    final asset = ref.read(currentAssetNotifier);
    if (asset != null) _stackChildrenKeepAlive = ref.read(stackChildrenNotifier(asset).notifier).ref.keepAlive();
  }

  @override
  void dispose() {
    pageController.dispose();
    _preloader.dispose();
    _reloadSubscription?.cancel();
    _stackChildrenKeepAlive?.close();
    SystemChrome.setEnabledSystemUIMode(SystemUiMode.edgeToEdge);
    super.dispose();
  }

  void _onAssetInit(Duration timeStamp) {
    _preloader.preload(widget.initialIndex, context.sizeData);
    _handleCasting();
  }

  void _onAssetChanged(int index) async {
    final timelineService = ref.read(timelineServiceProvider);
    final asset = await timelineService.getAssetAsync(index);
    if (asset == null) return;

    AssetViewer._setAsset(ref, asset);
    _preloader.preload(index, context.sizeData);
    _handleCasting();
    _stackChildrenKeepAlive?.close();
    _stackChildrenKeepAlive = ref.read(stackChildrenNotifier(asset).notifier).ref.keepAlive();
  }

  void _handleCasting() {
    if (!ref.read(castProvider).isCasting) return;
    final asset = ref.read(currentAssetNotifier);
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
        _assetReloadRequested = true;
      default:
    }
  }

  void _onTimelineReloadEvent() {
    final timelineService = ref.read(timelineServiceProvider);
    _totalAssets = timelineService.totalAssets;

    if (_totalAssets == 0) {
      context.maybePop();
      return;
    }

    var index = pageController.page?.round() ?? 0;
    final currentAsset = ref.read(currentAssetNotifier);
    if (currentAsset != null) {
      final newIndex = timelineService.getIndex(currentAsset.heroTag);
      if (newIndex != null && newIndex != index) {
        index = newIndex;
        pageController.jumpToPage(index);
      }
    }

    if (index >= _totalAssets) {
      index = _totalAssets - 1;
      pageController.jumpToPage(index);
    }

    if (_assetReloadRequested) {
      _assetReloadRequested = false;
      _onAssetReloadEvent(index);
    }
  }

  void _onAssetReloadEvent(int index) async {
    final timelineService = ref.read(timelineServiceProvider);

    final newAsset = await timelineService.getAssetAsync(index);
    if (newAsset == null) return;

    final currentAsset = ref.read(currentAssetNotifier);

    // Do not reload if the asset has not changed
    if (newAsset.heroTag == currentAsset?.heroTag) return;

    _onAssetChanged(index);
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
      final mode = !controls || (CurrentPlatform.isIOS && details)
          ? SystemUiMode.immersiveSticky
          : SystemUiMode.edgeToEdge;
      unawaited(SystemChrome.setEnabledSystemUIMode(mode));
    });

    return PopScope(
      onPopInvokedWithResult: (didPop, result) => ref.read(currentAssetNotifier.notifier).dispose(),
      child: Scaffold(
        backgroundColor: backgroundColor,
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
            PhotoViewGestureDetectorScope(
              axis: Axis.horizontal,
              child: PageView.builder(
                controller: pageController,
                physics: isZoomed
                    ? const NeverScrollableScrollPhysics()
                    : CurrentPlatform.isIOS
                    ? const FastScrollPhysics()
                    : const FastClampingScrollPhysics(),
                itemCount: _totalAssets,
                onPageChanged: (index) => _onAssetChanged(index),
                itemBuilder: (context, index) => AssetPage(index: index, heroOffset: heroOffset),
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
      ),
    );
  }
}
