import 'dart:async';

import 'package:auto_route/auto_route.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/events.model.dart';
import 'package:immich_mobile/domain/utils/event_stream.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/presentation/widgets/gallery_nav/gallery_nav_pill.widget.dart';
import 'package:immich_mobile/presentation/widgets/gallery_nav/gallery_search_blob.widget.dart';
import 'package:immich_mobile/providers/gallery_nav/bottom_nav_height.provider.dart';
import 'package:immich_mobile/providers/gallery_nav/gallery_nav_destination.dart';
import 'package:immich_mobile/providers/gallery_nav/gallery_search_action.dart';
import 'package:immich_mobile/providers/gallery_nav/gallery_tab_enum.dart';
import 'package:immich_mobile/providers/haptic_feedback.provider.dart';
import 'package:immich_mobile/providers/infrastructure/album.provider.dart';
import 'package:immich_mobile/providers/infrastructure/memory.provider.dart';
import 'package:immich_mobile/providers/infrastructure/people.provider.dart';
import 'package:immich_mobile/providers/infrastructure/readonly_mode.provider.dart';
import 'package:immich_mobile/providers/photos_filter/filter_sheet.provider.dart';

class GalleryBottomNav extends ConsumerStatefulWidget {
  final TabsRouter tabsRouter;
  const GalleryBottomNav({super.key, required this.tabsRouter});

  @override
  ConsumerState<GalleryBottomNav> createState() => _GalleryBottomNavState();
}

class _GalleryBottomNavState extends ConsumerState<GalleryBottomNav> {
  static const double _keyboardThreshold = 80;
  static const Duration _hideAnimation = Duration(milliseconds: 200);
  static const double _pillHeight = 58;
  static const double _bottomFloat = 26;

  bool _hiddenForMultiSelect = false;
  StreamSubscription? _multiSelectSub;

  @override
  void initState() {
    super.initState();
    _multiSelectSub = EventStream.shared.listen<MultiSelectToggleEvent>((e) {
      if (!mounted) return;
      setState(() => _hiddenForMultiSelect = e.isEnabled);
    });
  }

  @override
  void dispose() {
    _multiSelectSub?.cancel();
    super.dispose();
  }

  /// Equality-guarded publish of the visible reserved height from screen
  /// bottom to the top of the floating pill's outer padding.
  void _writeHeight(double h) {
    final current = ref.read(bottomNavHeightProvider);
    if (current != h) ref.read(bottomNavHeightProvider.notifier).state = h;
  }

  @override
  Widget build(BuildContext context) {
    final isLandscape = context.orientation == Orientation.landscape;
    final mq = MediaQuery.of(context);
    final keyboardUp = mq.viewInsets.bottom > _keyboardThreshold;
    final isReadonly = ref.watch(readonlyModeProvider);

    if (isLandscape) {
      WidgetsBinding.instance.addPostFrameCallback((_) => _writeHeight(0));
      return _landscapeRail(isReadonly);
    }

    // Hide the pill while the FilterSheet is visible — it would otherwise
    // overlap the sheet's bottom content (e.g. the Done button at Deep snap).
    final sheetVisible = ref.watch(photosFilterSheetProvider) != FilterSheetSnap.hidden;
    final hiding = _hiddenForMultiSelect || keyboardUp || sheetVisible;
    final bottomInset = mq.padding.bottom > _bottomFloat ? mq.padding.bottom : _bottomFloat;
    final pillVisibleHeight = bottomInset + _pillHeight;

    if (!hiding) {
      WidgetsBinding.instance.addPostFrameCallback((_) => _writeHeight(pillVisibleHeight));
    }

    return TweenAnimationBuilder<double>(
      key: const Key('gallery-bottom-nav-slide'),
      tween: Tween<double>(end: hiding ? 12.0 : 0.0),
      duration: _hideAnimation,
      curve: Curves.easeOutCubic,
      onEnd: () {
        if (hiding) _writeHeight(0);
      },
      builder: (_, slide, child) => Transform.translate(offset: Offset(0, slide), child: child),
      child: AnimatedOpacity(
        key: const Key('gallery-bottom-nav-opacity'),
        duration: _hideAnimation,
        opacity: hiding ? 0 : 1,
        child: IgnorePointer(
          ignoring: hiding,
          child: Padding(
            padding: EdgeInsets.only(left: 14, right: 14, bottom: bottomInset),
            child: Row(
              children: [
                Expanded(
                  child: GalleryNavPill(
                    activeTab: GalleryTabEnum.values[widget.tabsRouter.activeIndex],
                    disabledTabs: isReadonly ? const {GalleryTabEnum.albums, GalleryTabEnum.library} : const {},
                    onTabTap: _onTabTap,
                  ),
                ),
                const SizedBox(width: 10),
                GallerySearchBlob(enabled: !isReadonly, onTap: () => openGallerySearch(widget.tabsRouter, ref.read)),
              ],
            ),
          ),
        ),
      ),
    );
  }

  /// Single entry point for all tab-tap side effects. Mirrors upstream
  /// `_onNavigationSelected` in `tab_shell.page.dart`: side effects fire on
  /// EVERY tap (including re-taps of the same tab) — the shell-level
  /// `tabsRouter.addListener` only fires on index CHANGES.
  void _onTabTap(GalleryTabEnum tab) {
    final currentIndex = widget.tabsRouter.activeIndex;

    if (tab == GalleryTabEnum.photos && currentIndex == tab.index) {
      EventStream.shared.emit(const ScrollToTopEvent());
    }

    switch (tab) {
      case GalleryTabEnum.photos:
        ref.invalidate(driftMemoryFutureProvider);
        break;
      case GalleryTabEnum.albums:
        unawaited(ref.read(remoteAlbumProvider.notifier).refresh());
        break;
      case GalleryTabEnum.library:
        ref.invalidate(localAlbumProvider);
        ref.invalidate(driftGetAllPeopleProvider);
        break;
    }

    ref.read(hapticFeedbackProvider.notifier).selectionClick();
    widget.tabsRouter.setActiveIndex(tab.index);
  }

  Widget _landscapeRail(bool isReadonly) {
    return NavigationRail(
      key: const Key('gallery-bottom-nav-rail'),
      selectedIndex: widget.tabsRouter.activeIndex,
      onDestinationSelected: (i) {
        final tab = GalleryTabEnum.values[i];
        if (isReadonly && tab != GalleryTabEnum.photos) return;
        _onTabTap(tab);
      },
      labelType: NavigationRailLabelType.all,
      destinations: [
        for (final tab in GalleryTabEnum.values)
          NavigationRailDestination(
            icon: Icon(GalleryNavDestination.forTab(tab).idleIcon),
            selectedIcon: Icon(GalleryNavDestination.forTab(tab).activeIcon),
            label: Text(GalleryNavDestination.forTab(tab).labelKey.tr()),
            disabled: isReadonly && tab != GalleryTabEnum.photos,
          ),
      ],
      trailing: IconButton(
        key: const Key('gallery-bottom-nav-rail-search'),
        icon: const Icon(Icons.search),
        onPressed: isReadonly ? null : () => openGallerySearch(widget.tabsRouter, ref.read),
      ),
    );
  }
}
