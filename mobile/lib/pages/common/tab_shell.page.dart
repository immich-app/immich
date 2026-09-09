import 'dart:async';

import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/constants.dart';
import 'package:immich_mobile/domain/models/events.model.dart';
import 'package:immich_mobile/domain/utils/event_stream.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/generated/translations.g.dart';
import 'package:immich_mobile/presentation/pages/search/paginated_search.provider.dart';
import 'package:immich_mobile/providers/haptic_feedback.provider.dart';
import 'package:immich_mobile/providers/infrastructure/album.provider.dart';
import 'package:immich_mobile/providers/infrastructure/memory.provider.dart';
import 'package:immich_mobile/providers/infrastructure/readonly_mode.provider.dart';
import 'package:immich_mobile/providers/search/search_input_focus.provider.dart';
import 'package:immich_mobile/providers/tab.provider.dart';
import 'package:immich_mobile/routing/router.dart';

// [NavigationBar] crops contents and has a fixed 32px element, so we choose a size that's close to the min it will allow
const double _kLandscapeNavigationBarHeight = 40;

// We cannot dynamically size the pills due to the Flutter API, so this size is selected to align the icon + text inside the pill as well as possible
const double _kLandscapeIndicatorWidth = 92;

@RoutePage()
class TabShellPage extends ConsumerStatefulWidget {
  const TabShellPage({super.key});

  @override
  ConsumerState<TabShellPage> createState() => _TabShellPageState();
}

class _TabShellPageState extends ConsumerState<TabShellPage> {
  @override
  Widget build(BuildContext context) {
    final isReadonlyModeEnabled = ref.watch(readonlyModeProvider);

    final navigationDestinations = [
      NavigationDestination(
        label: context.t.photos,
        icon: const Icon(Icons.photo_library_outlined),
        selectedIcon: Icon(Icons.photo_library, color: context.primaryColor),
      ),
      NavigationDestination(
        label: context.t.search,
        icon: const Icon(Icons.search_rounded),
        selectedIcon: Icon(Icons.search, color: context.primaryColor),
        enabled: !isReadonlyModeEnabled,
      ),
      NavigationDestination(
        label: context.t.albums,
        icon: const Icon(Icons.photo_album_outlined),
        selectedIcon: Icon(Icons.photo_album_rounded, color: context.primaryColor),
        enabled: !isReadonlyModeEnabled,
      ),
      NavigationDestination(
        label: context.t.library$,
        icon: const Icon(Icons.space_dashboard_outlined),
        selectedIcon: Icon(Icons.space_dashboard_rounded, color: context.primaryColor),
        enabled: !isReadonlyModeEnabled,
      ),
    ];

    return AutoTabsRouter(
      routes: const [MainTimelineRoute(), SearchRoute(), AlbumsRoute(), LibraryRoute()],
      duration: const Duration(milliseconds: 600),
      transitionBuilder: (context, child, animation) => FadeTransition(opacity: animation, child: child),
      builder: (context, child) {
        final tabsRouter = AutoTabsRouter.of(context);
        return PopScope(
          canPop: tabsRouter.activeIndex == 0,
          onPopInvokedWithResult: (didPop, _) => !didPop ? tabsRouter.setActiveIndex(0) : null,
          child: Scaffold(
            resizeToAvoidBottomInset: false,
            body: child,
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
    ref.invalidate(memoryLaneProvider);
  }

  if (router.activeIndex != kSearchTabIndex && index == kSearchTabIndex) {
    ref.read(searchPreFilterProvider.notifier).clear();
  }

  // On Search page tapped
  if (router.activeIndex == kSearchTabIndex && index == kSearchTabIndex) {
    ref.read(searchInputFocusProvider).requestFocus();
  }

  // Album page
  if (index == kAlbumTabIndex) {
    unawaited(ref.read(remoteAlbumProvider.notifier).refresh());
  }

  // Library page
  if (index == kLibraryTabIndex) {
    ref.invalidate(localAlbumProvider);
  }

  ref.read(hapticFeedbackProvider.notifier).selectionClick();
  router.setActiveIndex(index);
  ref.read(tabProvider.notifier).state = TabEnum.values[index];
}

class _BottomNavigationBar extends ConsumerStatefulWidget {
  const _BottomNavigationBar({required this.tabsRouter, required this.destinations});

  final List<NavigationDestination> destinations;
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
    unawaited(_eventSubscription?.cancel());
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isScreenLandscape = context.orientation == Orientation.landscape;

    if (hideNavigationBar) {
      return const SizedBox.shrink();
    }

    void onDestinationSelected(int index) => _onNavigationSelected(widget.tabsRouter, index, ref);

    if (!isScreenLandscape) {
      return NavigationBar(
        selectedIndex: widget.tabsRouter.activeIndex,
        onDestinationSelected: onDestinationSelected,
        destinations: widget.destinations,
      );
    }

    final destinations = widget.destinations
        .map(
          (destination) => NavigationDestination(
            icon: _InlineDestination(icon: destination.icon, label: destination.label, selected: false),
            selectedIcon: _InlineDestination(
              icon: destination.selectedIcon ?? destination.icon,
              label: destination.label,
              selected: true,
            ),
            label: destination.label,
            enabled: destination.enabled,
          ),
        )
        .toList();

    return NavigationBar(
      selectedIndex: widget.tabsRouter.activeIndex,
      onDestinationSelected: onDestinationSelected,
      destinations: destinations,
      labelBehavior: NavigationDestinationLabelBehavior.alwaysHide,
      height: _kLandscapeNavigationBarHeight,
      indicatorShape: const _FixedWidthStadiumBorder(width: _kLandscapeIndicatorWidth),
    );
  }
}

/// A side by side icon and destination label
class _InlineDestination extends StatelessWidget {
  const _InlineDestination({required this.icon, required this.label, required this.selected});

  final Widget icon;
  final String label;
  final bool selected;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: _kLandscapeIndicatorWidth,
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          IconTheme.merge(data: const IconThemeData(size: 20), child: icon),
          const SizedBox(width: 6),
          Flexible(
            child: Text(
              label,
              softWrap: false,
              overflow: TextOverflow.ellipsis,
              style: context.textTheme.labelMedium?.copyWith(
                fontSize: 12,
                fontWeight: FontWeight.w500,
                color: selected ? context.primaryColor : null,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

/// A [NavigationBar] selection indicator drawn as a pill with a fixed width
class _FixedWidthStadiumBorder extends StadiumBorder {
  const _FixedWidthStadiumBorder({required this.width});

  final double width;

  Rect _limitedWidthRect(Rect rect) => Rect.fromCenter(center: rect.center, width: width, height: rect.height);

  @override
  Path getOuterPath(Rect rect, {TextDirection? textDirection}) =>
      super.getOuterPath(_limitedWidthRect(rect), textDirection: textDirection);

  @override
  Path getInnerPath(Rect rect, {TextDirection? textDirection}) =>
      super.getInnerPath(_limitedWidthRect(rect), textDirection: textDirection);

  @override
  void paintInterior(Canvas canvas, Rect rect, Paint paint, {TextDirection? textDirection}) =>
      super.paintInterior(canvas, _limitedWidthRect(rect), paint, textDirection: textDirection);

  @override
  _FixedWidthStadiumBorder scale(double t) => _FixedWidthStadiumBorder(width: width * t);

  @override
  bool operator ==(Object other) => other is _FixedWidthStadiumBorder && other.side == side && other.width == width;

  @override
  int get hashCode => Object.hash(side, width);
}
