import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/events.model.dart';
import 'package:immich_mobile/domain/utils/event_stream.dart';
import 'package:immich_mobile/presentation/widgets/gallery_nav/gallery_bottom_nav.widget.dart';
import 'package:immich_mobile/presentation/widgets/gallery_nav/gallery_nav_pill.widget.dart';
import 'package:immich_mobile/presentation/widgets/gallery_nav/gallery_search_blob.widget.dart';
import 'package:immich_mobile/providers/gallery_nav/bottom_nav_height.provider.dart';
import 'package:immich_mobile/providers/gallery_nav/gallery_tab_enum.dart';
import 'package:immich_mobile/providers/haptic_feedback.provider.dart';
import 'package:immich_mobile/providers/infrastructure/readonly_mode.provider.dart';

import '../../../test_helpers/fake_tabs_router.dart';

/// ReadOnlyModeNotifier replacement that short-circuits the build-time read of
/// appSettingsServiceProvider.
class _FakeReadonly extends ReadOnlyModeNotifier {
  final bool v;
  _FakeReadonly(this.v);
  @override
  bool build() => v;
  @override
  void setMode(bool value) {}
  @override
  void setReadonlyMode(bool isEnabled) {}
  @override
  void toggleReadonlyMode() {}
}

/// HapticNotifier stub that doesn't read appSettingsServiceProvider.
class _NoOpHaptic extends HapticNotifier {
  _NoOpHaptic(super.ref);
  @override
  dynamic selectionClick() => null;
  @override
  dynamic lightImpact() => null;
  @override
  dynamic mediumImpact() => null;
  @override
  dynamic heavyImpact() => null;
  @override
  dynamic vibrate() => null;
}

/// Default portrait MediaQueryData (400x900) so tests exercise the pill branch.
/// Tests that need landscape or other viewInsets pass their own `mq`.
const _portraitMq = MediaQueryData(size: Size(400, 900));

Widget _wrap(Widget child, {List<Override> overrides = const [], MediaQueryData? mq}) {
  return ProviderScope(
    overrides: [
      readonlyModeProvider.overrideWith(() => _FakeReadonly(false)),
      hapticFeedbackProvider.overrideWith((ref) => _NoOpHaptic(ref)),
      ...overrides,
    ],
    child: MaterialApp(
      home: MediaQuery(
        data: mq ?? _portraitMq,
        child: Material(child: child),
      ),
    ),
  );
}

void main() {
  testWidgets('portrait: pill + blob both rendered', (tester) async {
    final router = FakeTabsRouter();
    await tester.pumpWidget(_wrap(GalleryBottomNav(tabsRouter: router)));
    await tester.pumpAndSettle();
    expect(find.byType(GalleryNavPill), findsOneWidget);
    expect(find.byType(GallerySearchBlob), findsOneWidget);
  });

  testWidgets('multi-select event hides nav (opacity→0)', (tester) async {
    final router = FakeTabsRouter();
    await tester.pumpWidget(_wrap(GalleryBottomNav(tabsRouter: router)));
    await tester.pumpAndSettle();

    EventStream.shared.emit(const MultiSelectToggleEvent(true));
    await tester.pumpAndSettle();

    final opacity = tester.widget<AnimatedOpacity>(find.byKey(const Key('gallery-bottom-nav-opacity')));
    expect(opacity.opacity, 0);

    // Restore for clean teardown.
    EventStream.shared.emit(const MultiSelectToggleEvent(false));
    await tester.pumpAndSettle();
  });

  testWidgets('hide animation completion writes bottomNavHeightProvider=0', (tester) async {
    final router = FakeTabsRouter();
    final container = ProviderContainer(
      overrides: [
        readonlyModeProvider.overrideWith(() => _FakeReadonly(false)),
        hapticFeedbackProvider.overrideWith((ref) => _NoOpHaptic(ref)),
      ],
    );
    addTearDown(container.dispose);

    await tester.pumpWidget(
      UncontrolledProviderScope(
        container: container,
        child: MaterialApp(
          home: MediaQuery(
            data: _portraitMq,
            child: Material(child: GalleryBottomNav(tabsRouter: router)),
          ),
        ),
      ),
    );
    await tester.pumpAndSettle();
    final shownHeight = container.read(bottomNavHeightProvider);
    expect(shownHeight, greaterThan(0));

    EventStream.shared.emit(const MultiSelectToggleEvent(true));
    await tester.pumpAndSettle();
    expect(container.read(bottomNavHeightProvider), 0, reason: 'onEnd writes 0 after hide completes');

    // Restore.
    EventStream.shared.emit(const MultiSelectToggleEvent(false));
    await tester.pumpAndSettle();
  });

  testWidgets('keyboard-up: hides above 80pt threshold, shows at 79pt', (tester) async {
    final router = FakeTabsRouter();

    await tester.pumpWidget(
      _wrap(
        GalleryBottomNav(tabsRouter: router),
        mq: const MediaQueryData(size: Size(400, 900), viewInsets: EdgeInsets.only(bottom: 79)),
      ),
    );
    await tester.pumpAndSettle();
    var opacity = tester.widget<AnimatedOpacity>(find.byKey(const Key('gallery-bottom-nav-opacity')));
    expect(opacity.opacity, 1, reason: 'at 79pt, still shown');

    await tester.pumpWidget(
      _wrap(
        GalleryBottomNav(tabsRouter: router),
        mq: const MediaQueryData(size: Size(400, 900), viewInsets: EdgeInsets.only(bottom: 81)),
      ),
    );
    await tester.pumpAndSettle();
    opacity = tester.widget<AnimatedOpacity>(find.byKey(const Key('gallery-bottom-nav-opacity')));
    expect(opacity.opacity, 0, reason: 'at 81pt, hidden');
  });

  testWidgets('landscape: NavigationRail with 3 destinations + trailing search', (tester) async {
    final router = FakeTabsRouter();
    await tester.pumpWidget(
      _wrap(
        GalleryBottomNav(tabsRouter: router),
        mq: const MediaQueryData(size: Size(900, 400)),
      ),
    );
    await tester.pumpAndSettle();
    expect(find.byType(GalleryNavPill), findsNothing);
    expect(find.byKey(const Key('gallery-bottom-nav-rail')), findsOneWidget);
    final rail = tester.widget<NavigationRail>(find.byKey(const Key('gallery-bottom-nav-rail')));
    expect(rail.destinations, hasLength(3));
    expect(find.byKey(const Key('gallery-bottom-nav-rail-search')), findsOneWidget);
  });

  testWidgets('readonly: blob disabled, pill dims Albums+Library, Photos enabled', (tester) async {
    final router = FakeTabsRouter();
    await tester.pumpWidget(
      _wrap(
        GalleryBottomNav(tabsRouter: router),
        overrides: [readonlyModeProvider.overrideWith(() => _FakeReadonly(true))],
      ),
    );
    await tester.pumpAndSettle();

    final pill = tester.widget<GalleryNavPill>(find.byType(GalleryNavPill));
    expect(pill.disabledTabs, containsAll({GalleryTabEnum.albums, GalleryTabEnum.library}));
    expect(pill.disabledTabs.contains(GalleryTabEnum.photos), isFalse);

    final blob = tester.widget<GallerySearchBlob>(find.byType(GallerySearchBlob));
    expect(blob.enabled, isFalse);
  });

  testWidgets('publishes height to bottomNavHeightProvider when shown', (tester) async {
    final router = FakeTabsRouter();
    final container = ProviderContainer(
      overrides: [
        readonlyModeProvider.overrideWith(() => _FakeReadonly(false)),
        hapticFeedbackProvider.overrideWith((ref) => _NoOpHaptic(ref)),
      ],
    );
    addTearDown(container.dispose);

    await tester.pumpWidget(
      UncontrolledProviderScope(
        container: container,
        child: MaterialApp(
          home: MediaQuery(
            data: _portraitMq,
            child: Material(child: GalleryBottomNav(tabsRouter: router)),
          ),
        ),
      ),
    );
    await tester.pumpAndSettle();
    expect(container.read(bottomNavHeightProvider), greaterThan(0));
  });

  testWidgets('iPhone safe area uses one bottom inset instead of stacking float and safe area', (tester) async {
    tester.view.devicePixelRatio = 1;
    tester.view.physicalSize = const Size(430, 932);
    addTearDown(() {
      tester.view.resetDevicePixelRatio();
      tester.view.resetPhysicalSize();
    });

    final router = FakeTabsRouter();
    final container = ProviderContainer(
      overrides: [
        readonlyModeProvider.overrideWith(() => _FakeReadonly(false)),
        hapticFeedbackProvider.overrideWith((ref) => _NoOpHaptic(ref)),
      ],
    );
    addTearDown(container.dispose);

    await tester.pumpWidget(
      UncontrolledProviderScope(
        container: container,
        child: MaterialApp(
          home: MediaQuery(
            data: const MediaQueryData(
              size: Size(430, 932),
              padding: EdgeInsets.only(bottom: 34),
              textScaler: TextScaler.linear(0.45),
            ),
            child: Scaffold(bottomNavigationBar: GalleryBottomNav(tabsRouter: router)),
          ),
        ),
      ),
    );
    await tester.pumpAndSettle();

    expect(container.read(bottomNavHeightProvider), 92);
    expect(tester.getRect(find.byType(GalleryNavPill)).bottom, 932 - 34);
  });

  testWidgets('re-tap Photos (already active): emits ScrollToTopEvent', (tester) async {
    final router = FakeTabsRouter(initialIndex: GalleryTabEnum.photos.index);
    int scrollEvents = 0;
    final sub = EventStream.shared.listen<ScrollToTopEvent>((_) => scrollEvents++);
    addTearDown(sub.cancel);

    await tester.pumpWidget(_wrap(GalleryBottomNav(tabsRouter: router)));
    await tester.pumpAndSettle();

    await tester.tap(find.text('nav_photos'.tr()));
    await tester.pumpAndSettle();

    expect(scrollEvents, 1);
  });

  testWidgets('tapping a different tab calls tabsRouter.setActiveIndex', (tester) async {
    final router = FakeTabsRouter(initialIndex: GalleryTabEnum.photos.index);
    await tester.pumpWidget(_wrap(GalleryBottomNav(tabsRouter: router)));
    await tester.pumpAndSettle();

    await tester.tap(find.text('nav_albums'.tr()));
    await tester.pumpAndSettle();

    expect(router.setCalls, contains(GalleryTabEnum.albums.index));
  });

  testWidgets('readonly landscape rail: Photos destination enabled, others disabled', (tester) async {
    final router = FakeTabsRouter();
    await tester.pumpWidget(
      _wrap(
        GalleryBottomNav(tabsRouter: router),
        overrides: [readonlyModeProvider.overrideWith(() => _FakeReadonly(true))],
        mq: const MediaQueryData(size: Size(900, 400)),
      ),
    );
    await tester.pumpAndSettle();

    final rail = tester.widget<NavigationRail>(find.byKey(const Key('gallery-bottom-nav-rail')));
    expect(rail.destinations[GalleryTabEnum.photos.index].disabled, isFalse);
    expect(rail.destinations[GalleryTabEnum.albums.index].disabled, isTrue);
    expect(rail.destinations[GalleryTabEnum.library.index].disabled, isTrue);
  });
}
