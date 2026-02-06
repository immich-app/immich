import 'package:auto_route/auto_route.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/store.model.dart';
import 'package:immich_mobile/providers/app_settings.provider.dart';
import 'package:immich_mobile/services/app_settings.service.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/providers/album/album.provider.dart';
import 'package:immich_mobile/providers/asset.provider.dart';
import 'package:immich_mobile/providers/asset_viewer/scroll_notifier.provider.dart';
import 'package:immich_mobile/providers/haptic_feedback.provider.dart';
import 'package:immich_mobile/providers/multiselect.provider.dart';
import 'package:immich_mobile/providers/search/search_input_focus.provider.dart';
import 'package:immich_mobile/providers/tab.provider.dart';
import 'package:immich_mobile/routing/router.dart';
import 'package:immich_mobile/widgets/common/immich_toast.dart';

@RoutePage()
class TabControllerPage extends ConsumerStatefulWidget {
  const TabControllerPage({super.key});

  @override
  ConsumerState<TabControllerPage> createState() => _TabControllerPageState();
}

class _TabControllerPageState extends ConsumerState<TabControllerPage> {
  final GlobalKey<AutoTabsRouterState> _tabsRouterKey = GlobalKey<AutoTabsRouterState>();
  bool _initialTabSet = false;
  DateTime? _lastBackPressTime;

  void _handleBackButton() async {
    final router = _tabsRouterKey.currentState?.controller;
    if (router == null) {
      // Fallback - exit app if router not available
      await SystemChannels.platform.invokeMethod('SystemNavigator.pop');
      return;
    }

    if (router.activeIndex == 0) {
      // On Photos tab - check for double tap to exit
      final now = DateTime.now();
      if (_lastBackPressTime != null && now.difference(_lastBackPressTime!) < const Duration(seconds: 2)) {
        // Double tap detected - exit the app
        await SystemChannels.platform.invokeMethod('SystemNavigator.pop');
        return;
      }

      // First tap - show toast and wait for second tap
      _lastBackPressTime = now;
      if (mounted) {
        ImmichToast.show(context: context, msg: 'Pulsa atrás de nuevo para salir', toastType: ToastType.info);
      }
    } else {
      // Not on Photos tab - switch to Photos
      router.setActiveIndex(0);
      ref.read(tabProvider.notifier).state = TabEnum.home;
    }
  }

  void _onNavigationSelected(TabsRouter router, int index) {
    // On Photos page menu tapped
    if (router.activeIndex == 0 && index == 0) {
      scrollToTopNotifierProvider.scrollToTop();
    }

    // On Search page tapped
    if (router.activeIndex == 1 && index == 1) {
      ref.read(searchInputFocusProvider).requestFocus();
    }

    ref.read(hapticFeedbackProvider.notifier).selectionClick();
    router.setActiveIndex(index);
    ref.read(tabProvider.notifier).state = TabEnum.values[index];
  }

  @override
  Widget build(BuildContext context) {
    final isRefreshingAssets = ref.watch(assetProvider);
    final isRefreshingRemoteAlbums = ref.watch(isRefreshingRemoteAlbumProvider);
    final isScreenLandscape = MediaQuery.orientationOf(context) == Orientation.landscape;
    final multiselectEnabled = ref.watch(multiselectProvider);
    final defaultPage = ref.watch(appSettingsServiceProvider).getSetting(AppSettingsEnum.defaultLandingPage);

    Widget buildIcon({required Widget icon, required bool isProcessing}) {
      if (!isProcessing) return icon;
      return Stack(
        alignment: Alignment.center,
        clipBehavior: Clip.none,
        children: [
          icon,
          Positioned(
            right: -18,
            child: SizedBox(
              height: 20,
              width: 20,
              child: CircularProgressIndicator(
                strokeWidth: 2,
                valueColor: AlwaysStoppedAnimation<Color>(context.primaryColor),
              ),
            ),
          ),
        ],
      );
    }

    final navigationDestinations = [
      NavigationDestination(
        label: 'photos'.tr(),
        icon: const Icon(Icons.photo_library_outlined),
        selectedIcon: buildIcon(
          isProcessing: isRefreshingAssets,
          icon: Icon(Icons.photo_library, color: context.primaryColor),
        ),
      ),
      NavigationDestination(
        label: 'search'.tr(),
        icon: const Icon(Icons.search_rounded),
        selectedIcon: Icon(Icons.search, color: context.primaryColor),
      ),
      NavigationDestination(
        label: 'albums'.tr(),
        icon: const Icon(Icons.photo_album_outlined),
        selectedIcon: buildIcon(
          isProcessing: isRefreshingRemoteAlbums,
          icon: Icon(Icons.photo_album_rounded, color: context.primaryColor),
        ),
      ),
      NavigationDestination(
        label: 'library'.tr(),
        icon: const Icon(Icons.space_dashboard_outlined),
        selectedIcon: buildIcon(
          isProcessing: isRefreshingAssets,
          icon: Icon(Icons.space_dashboard_rounded, color: context.primaryColor),
        ),
      ),
    ];

    Widget bottomNavigationBar(TabsRouter tabsRouter) {
      return NavigationBar(
        selectedIndex: tabsRouter.activeIndex,
        onDestinationSelected: (index) => _onNavigationSelected(tabsRouter, index),
        destinations: navigationDestinations,
      );
    }

    Widget navigationRail(TabsRouter tabsRouter) {
      return NavigationRail(
        destinations: navigationDestinations
            .map((e) => NavigationRailDestination(icon: e.icon, label: Text(e.label), selectedIcon: e.selectedIcon))
            .toList(),
        onDestinationSelected: (index) => _onNavigationSelected(tabsRouter, index),
        selectedIndex: tabsRouter.activeIndex,
        labelType: NavigationRailLabelType.all,
        groupAlignment: 0.0,
      );
    }

    // PopScope WRAPS AutoTabsRouter - this ensures we intercept BEFORE AutoTabsRouter can handle it
    return PopScope(
      canPop: false, // NEVER let the system/AutoTabsRouter handle back - we handle it completely
      onPopInvokedWithResult: (didPop, _) {
        if (!didPop) {
          _handleBackButton();
        }
      },
      child: AutoTabsRouter(
        key: _tabsRouterKey,
        homeIndex: 0, // Always Photos as home
        routes: [const PhotosRoute(), SearchRoute(), const AlbumsRoute(), const LibraryRoute()],
        duration: const Duration(milliseconds: 600),
        transitionBuilder: (context, child, animation) => FadeTransition(opacity: animation, child: child),
        builder: (context, child) {
          final tabsRouter = AutoTabsRouter.of(context);

          // Switch to Albums on first load if setting is enabled
          if (!_initialTabSet && defaultPage == "albums") {
            _initialTabSet = true;
            WidgetsBinding.instance.addPostFrameCallback((_) {
              tabsRouter.setActiveIndex(2);
              ref.read(tabProvider.notifier).state = TabEnum.values[2];
            });
          } else if (!_initialTabSet) {
            _initialTabSet = true;
          }

          return Scaffold(
            resizeToAvoidBottomInset: false,
            body: isScreenLandscape
                ? Row(
                    children: [
                      navigationRail(tabsRouter),
                      const VerticalDivider(),
                      Expanded(child: child),
                    ],
                  )
                : child,
            bottomNavigationBar: multiselectEnabled || isScreenLandscape ? null : bottomNavigationBar(tabsRouter),
          );
        },
      ),
    );
  }
}
