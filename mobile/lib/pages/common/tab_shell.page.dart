import 'package:auto_route/auto_route.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/timeline.model.dart';
import 'package:immich_mobile/domain/utils/event_stream.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/providers/app_settings.provider.dart';
import 'package:immich_mobile/providers/backup/drift_backup.provider.dart';
import 'package:immich_mobile/providers/haptic_feedback.provider.dart';
import 'package:immich_mobile/providers/infrastructure/album.provider.dart';
import 'package:immich_mobile/providers/search/search_input_focus.provider.dart';
import 'package:immich_mobile/providers/tab.provider.dart';
import 'package:immich_mobile/providers/timeline/multiselect.provider.dart';
import 'package:immich_mobile/providers/user.provider.dart';
import 'package:immich_mobile/providers/websocket.provider.dart';
import 'package:immich_mobile/routing/router.dart';
import 'package:immich_mobile/services/app_settings.service.dart';
import 'package:immich_mobile/utils/migration.dart';

@RoutePage()
class TabShellPage extends ConsumerStatefulWidget {
  const TabShellPage({super.key});

  @override
  ConsumerState<TabShellPage> createState() => _TabShellPageState();
}

class _TabShellPageState extends ConsumerState<TabShellPage> {
  @override
  void initState() {
    super.initState();

    WidgetsBinding.instance.addPostFrameCallback((_) async {
      ref.read(websocketProvider.notifier).connect();

      final isEnableBackup = ref.read(appSettingsServiceProvider).getSetting(AppSettingsEnum.enableBackup);

      await runNewSync(ref, full: true).then((_) async {
        if (isEnableBackup) {
          final currentUser = ref.read(currentUserProvider);
          if (currentUser == null) {
            return;
          }

          await ref.read(driftBackupProvider.notifier).handleBackupResume(currentUser.id);
        }
      });
    });
  }

  @override
  Widget build(BuildContext context) {
    final isScreenLandscape = context.orientation == Orientation.landscape;

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
      ),
      NavigationDestination(
        label: 'albums'.tr(),
        icon: const Icon(Icons.photo_album_outlined),
        selectedIcon: Icon(Icons.photo_album_rounded, color: context.primaryColor),
      ),
      NavigationDestination(
        label: 'library'.tr(),
        icon: const Icon(Icons.space_dashboard_outlined),
        selectedIcon: Icon(Icons.space_dashboard_rounded, color: context.primaryColor),
      ),
    ];

    Widget navigationRail(TabsRouter tabsRouter) {
      return NavigationRail(
        destinations: navigationDestinations
            .map((e) => NavigationRailDestination(icon: e.icon, label: Text(e.label), selectedIcon: e.selectedIcon))
            .toList(),
        onDestinationSelected: (index) => _onNavigationSelected(tabsRouter, index, ref),
        selectedIndex: tabsRouter.activeIndex,
        labelType: NavigationRailLabelType.all,
        groupAlignment: 0.0,
      );
    }

    return AutoTabsRouter(
      routes: [const MainTimelineRoute(), DriftSearchRoute(), const DriftAlbumsRoute(), const DriftLibraryRoute()],
      duration: const Duration(milliseconds: 600),
      transitionBuilder: (context, child, animation) => FadeTransition(opacity: animation, child: child),
      builder: (context, child) {
        final tabsRouter = AutoTabsRouter.of(context);
        return PopScope(
          canPop: tabsRouter.activeIndex == 0,
          onPopInvokedWithResult: (didPop, _) => !didPop ? tabsRouter.setActiveIndex(0) : null,
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
  if (router.activeIndex == 0 && index == 0) {
    EventStream.shared.emit(const ScrollToTopEvent());
  }

  // On Search page tapped
  if (router.activeIndex == 1 && index == 1) {
    ref.read(searchInputFocusProvider).requestFocus();
  }

  // Album page
  if (index == 2) {
    ref.read(remoteAlbumProvider.notifier).refresh();
  }

  ref.read(hapticFeedbackProvider.notifier).selectionClick();
  router.setActiveIndex(index);
  ref.read(tabProvider.notifier).state = TabEnum.values[index];
}

class _BottomNavigationBar extends ConsumerWidget {
  const _BottomNavigationBar({required this.tabsRouter, required this.destinations});

  final List<Widget> destinations;
  final TabsRouter tabsRouter;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isScreenLandscape = context.orientation == Orientation.landscape;
    final isMultiselectEnabled = ref.watch(multiSelectProvider.select((s) => s.isEnabled));

    if (isScreenLandscape || isMultiselectEnabled) {
      return const SizedBox.shrink();
    }

    return NavigationBar(
      selectedIndex: tabsRouter.activeIndex,
      onDestinationSelected: (index) => _onNavigationSelected(tabsRouter, index, ref),
      destinations: destinations,
    );
  }
}
