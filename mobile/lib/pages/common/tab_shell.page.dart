import 'dart:async';

import 'package:auto_route/auto_route.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/providers/app_settings.provider.dart';
import 'package:immich_mobile/services/app_settings.service.dart';
import 'package:immich_mobile/constants/constants.dart';
import 'package:immich_mobile/domain/models/events.model.dart';
import 'package:immich_mobile/domain/utils/event_stream.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/providers/haptic_feedback.provider.dart';
import 'package:immich_mobile/providers/infrastructure/album.provider.dart';
import 'package:immich_mobile/providers/infrastructure/memory.provider.dart';
import 'package:immich_mobile/providers/infrastructure/people.provider.dart';
import 'package:immich_mobile/providers/infrastructure/readonly_mode.provider.dart';
import 'package:immich_mobile/providers/search/search_input_focus.provider.dart';
import 'package:immich_mobile/providers/tab.provider.dart';
import 'package:immich_mobile/routing/router.dart';
import 'package:immich_mobile/widgets/common/immich_toast.dart';

@RoutePage()
class TabShellPage extends ConsumerStatefulWidget {
  const TabShellPage({super.key});

  @override
  ConsumerState<TabShellPage> createState() => _TabShellPageState();
}

class _TabShellPageState extends ConsumerState<TabShellPage> {
  bool _initialTabSet = false;
  DateTime? _lastBackPressTime;
  int? _lastHomeIndex; // Track the last homeIndex to detect setting changes

  @override
  Widget build(BuildContext context) {
    final isScreenLandscape = context.orientation == Orientation.landscape;
    final isReadonlyModeEnabled = ref.watch(readonlyModeProvider);

    final navigationDestinations = [
      NavigationDestination(
        label: 'photos'.tr(),
        icon: const Icon(Icons.photo_library_outlined),
        selectedIcon: Icon(Icons.photo_library, color: context.primaryColor),
      ),
      NavigationDestination(
        label: 'search'.tr(),
        icon: const Icon(Icons.search_rounded),
        selectedIcon: Icon(Icons.search, color: context.primaryColor),
        enabled: !isReadonlyModeEnabled,
      ),
      NavigationDestination(
        label: 'albums'.tr(),
        icon: const Icon(Icons.photo_album_outlined),
        selectedIcon: Icon(Icons.photo_album_rounded, color: context.primaryColor),
        enabled: !isReadonlyModeEnabled,
      ),
      NavigationDestination(
        label: 'library'.tr(),
        icon: const Icon(Icons.space_dashboard_outlined),
        selectedIcon: Icon(Icons.space_dashboard_rounded, color: context.primaryColor),
        enabled: !isReadonlyModeEnabled,
      ),
    ];

    Widget navigationRail(TabsRouter tabsRouter) {
      return NavigationRail(
        destinations: navigationDestinations
            .map(
              (e) => NavigationRailDestination(
                icon: e.icon,
                label: Text(e.label),
                selectedIcon: e.selectedIcon,
                disabled: !e.enabled,
              ),
            )
            .toList(),
        onDestinationSelected: (index) => _onNavigationSelected(tabsRouter, index, ref),
        selectedIndex: tabsRouter.activeIndex,
        labelType: NavigationRailLabelType.all,
        groupAlignment: 0.0,
      );
    }

    final defaultPage = ref.watch(appSettingsServiceProvider).getSetting(AppSettingsEnum.defaultLandingPage);
    // Use dynamic homeIndex based on setting - this controls AutoTabsRouter's internal back navigation
    final homeIndex = defaultPage == "albums" ? 2 : 0;

    return AutoTabsRouter(
      homeIndex: homeIndex, // Dynamic: Albums(2) if setting enabled, Photos(0) if not
      routes: const [MainTimelineRoute(), DriftSearchRoute(), DriftAlbumsRoute(), DriftLibraryRoute()],
      duration: const Duration(milliseconds: 600),
      transitionBuilder: (context, child, animation) => FadeTransition(opacity: animation, child: child),
      builder: (context, child) {
        final tabsRouter = AutoTabsRouter.of(context);

        // Handle initial tab and setting changes
        if (!_initialTabSet) {
          // First load - set to home tab
          _initialTabSet = true;
          _lastHomeIndex = homeIndex;
          if (homeIndex != 0) {
            WidgetsBinding.instance.addPostFrameCallback((_) {
              tabsRouter.setActiveIndex(homeIndex);
              ref.read(tabProvider.notifier).state = TabEnum.values[homeIndex];
            });
          }
        } else if (_lastHomeIndex != null && _lastHomeIndex != homeIndex) {
          // Setting changed - navigate to new home tab
          _lastHomeIndex = homeIndex;
          WidgetsBinding.instance.addPostFrameCallback((_) {
            tabsRouter.setActiveIndex(homeIndex);
            ref.read(tabProvider.notifier).state = TabEnum.values[homeIndex];
          });
        }

        // PopScope handles back button - we control the behavior
        return PopScope(
          canPop: tabsRouter.activeIndex == homeIndex, // Only allow pop (to show exit dialog) when on home tab
          onPopInvokedWithResult: (didPop, _) {
            if (!didPop) {
              // Not on home tab - navigate to home tab
              tabsRouter.setActiveIndex(homeIndex);
              ref.read(tabProvider.notifier).state = TabEnum.values[homeIndex];
            } else {
              // On home tab and pop happened - check for double tap
              final now = DateTime.now();
              if (_lastBackPressTime != null && now.difference(_lastBackPressTime!) < const Duration(seconds: 2)) {
                // Double tap - exit
                SystemChannels.platform.invokeMethod('SystemNavigator.pop');
              } else {
                // First tap - show toast
                _lastBackPressTime = now;
                ImmichToast.show(context: context, msg: 'Pulsa atrás de nuevo para salir', toastType: ToastType.info);
              }
            }
          },
          child: Scaffold(
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
            bottomNavigationBar: _BottomNavigationBar(tabsRouter: tabsRouter, destinations: navigationDestinations),
          ),
        );
      },
    );
  }
}

void _onNavigationSelected(TabsRouter router, int index, WidgetRef ref) {
  // On Photos page menu tapped
  if (router.activeIndex == kPhotoTabIndex && index == kPhotoTabIndex) {
    EventStream.shared.emit(const ScrollToTopEvent());
  }

  if (index == kPhotoTabIndex) {
    ref.invalidate(driftMemoryFutureProvider);
  }

  if (router.activeIndex != kSearchTabIndex && index == kSearchTabIndex) {
    // ref.read(searchPreFilterProvider.notifier).clear();
  }

  // On Search page tapped
  if (router.activeIndex == kSearchTabIndex && index == kSearchTabIndex) {
    ref.read(searchInputFocusProvider).requestFocus();
  }

  // Album page
  if (index == kAlbumTabIndex) {
    ref.read(remoteAlbumProvider.notifier).refresh();
  }

  // Library page
  if (index == kLibraryTabIndex) {
    ref.invalidate(localAlbumProvider);
    ref.invalidate(driftGetAllPeopleProvider);
  }

  ref.read(hapticFeedbackProvider.notifier).selectionClick();
  router.setActiveIndex(index);
  ref.read(tabProvider.notifier).state = TabEnum.values[index];
}

class _BottomNavigationBar extends ConsumerStatefulWidget {
  const _BottomNavigationBar({required this.tabsRouter, required this.destinations});

  final List<Widget> destinations;
  final TabsRouter tabsRouter;

  @override
  ConsumerState createState() => _BottomNavigationBarState();
}

class _BottomNavigationBarState extends ConsumerState<_BottomNavigationBar> {
  bool hideNavigationBar = false;
  StreamSubscription? _eventSubscription;

  @override
  void initState() {
    super.initState();
    _eventSubscription = EventStream.shared.listen<MultiSelectToggleEvent>(_onEvent);
  }

  void _onEvent(MultiSelectToggleEvent event) {
    setState(() {
      hideNavigationBar = event.isEnabled;
    });
  }

  @override
  void dispose() {
    _eventSubscription?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isScreenLandscape = context.orientation == Orientation.landscape;

    if (isScreenLandscape || hideNavigationBar) {
      return const SizedBox.shrink();
    }

    return NavigationBar(
      selectedIndex: widget.tabsRouter.activeIndex,
      onDestinationSelected: (index) => _onNavigationSelected(widget.tabsRouter, index, ref),
      destinations: widget.destinations,
    );
  }
}
