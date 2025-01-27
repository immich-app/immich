@Tags(['widget'])
library;

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/models/map/map_state.model.dart';
import 'package:immich_mobile/providers/locale_provider.dart';
import 'package:immich_mobile/providers/map/map_state.provider.dart';
import 'package:immich_mobile/widgets/map/map_theme_override.dart';

import '../../test_utils.dart';
import '../../widget_tester_extensions.dart';
import 'map_mocks.dart';

void main() {
  late MockMapStateNotifier mapStateNotifier;
  late List<Override> overrides;
  late MapState mapState;

  setUpAll(() async {
    TestUtils.init();
  });

  setUp(() {
    mapState = MapState(themeMode: ThemeMode.dark);
    mapStateNotifier = MockMapStateNotifier(mapState);
    overrides = [
      mapStateNotifierProvider.overrideWith(() => mapStateNotifier),
      localeProvider.overrideWithValue(const Locale("en")),
    ];
  });

  testWidgets("Return dark theme style when theme mode is dark",
      (tester) async {
    AsyncValue<String>? mapStyle;
    await tester.pumpConsumerWidget(
      MapThemeOverride(
        mapBuilder: (AsyncValue<String> style) {
          mapStyle = style;
          return const Text("Mock");
        },
      ),
      overrides: overrides,
    );

    mapStateNotifier.state =
        mapState.copyWith(darkStyleFetched: const AsyncData("dark"));
    await tester.pumpAndSettle();
    expect(mapStyle?.valueOrNull, "dark");
  });

  testWidgets("Return error when style is not fetched", (tester) async {
    AsyncValue<String>? mapStyle;
    await tester.pumpConsumerWidget(
      MapThemeOverride(
        mapBuilder: (AsyncValue<String> style) {
          mapStyle = style;
          return const Text("Mock");
        },
      ),
      overrides: overrides,
    );

    mapStateNotifier.state = mapState.copyWith(
      darkStyleFetched: const AsyncError("Error", StackTrace.empty),
    );
    await tester.pumpAndSettle();
    expect(mapStyle?.hasError, isTrue);
  });

  testWidgets("Return light theme style when theme mode is light",
      (tester) async {
    AsyncValue<String>? mapStyle;
    await tester.pumpConsumerWidget(
      MapThemeOverride(
        mapBuilder: (AsyncValue<String> style) {
          mapStyle = style;
          return const Text("Mock");
        },
      ),
      overrides: overrides,
    );

    mapStateNotifier.state = mapState.copyWith(
      themeMode: ThemeMode.light,
      lightStyleFetched: const AsyncData("light"),
    );
    await tester.pumpAndSettle();
    expect(mapStyle?.valueOrNull, "light");
  });

  group("System mode", () {
    testWidgets("Return dark theme style when system is dark", (tester) async {
      AsyncValue<String>? mapStyle;
      await tester.pumpConsumerWidget(
        MapThemeOverride(
          mapBuilder: (AsyncValue<String> style) {
            mapStyle = style;
            return const Text("Mock");
          },
        ),
        overrides: overrides,
      );

      tester.binding.platformDispatcher.platformBrightnessTestValue =
          Brightness.dark;
      mapStateNotifier.state = mapState.copyWith(
        themeMode: ThemeMode.system,
        darkStyleFetched: const AsyncData("dark"),
      );
      await tester.pumpAndSettle();

      expect(mapStyle?.valueOrNull, "dark");
    });

    testWidgets("Return light theme style when system is light",
        (tester) async {
      AsyncValue<String>? mapStyle;
      await tester.pumpConsumerWidget(
        MapThemeOverride(
          mapBuilder: (AsyncValue<String> style) {
            mapStyle = style;
            return const Text("Mock");
          },
        ),
        overrides: overrides,
      );

      tester.binding.platformDispatcher.platformBrightnessTestValue =
          Brightness.light;
      mapStateNotifier.state = mapState.copyWith(
        themeMode: ThemeMode.system,
        lightStyleFetched: const AsyncData("light"),
      );
      await tester.pumpAndSettle();

      expect(mapStyle?.valueOrNull, "light");
    });

    testWidgets("Switches style when system brightness changes",
        (tester) async {
      AsyncValue<String>? mapStyle;
      await tester.pumpConsumerWidget(
        MapThemeOverride(
          mapBuilder: (AsyncValue<String> style) {
            mapStyle = style;
            return const Text("Mock");
          },
        ),
        overrides: overrides,
      );

      tester.binding.platformDispatcher.platformBrightnessTestValue =
          Brightness.light;
      mapStateNotifier.state = mapState.copyWith(
        themeMode: ThemeMode.system,
        lightStyleFetched: const AsyncData("light"),
        darkStyleFetched: const AsyncData("dark"),
      );
      await tester.pumpAndSettle();
      expect(mapStyle?.valueOrNull, "light");

      tester.binding.platformDispatcher.platformBrightnessTestValue =
          Brightness.dark;
      await tester.pumpAndSettle();
      expect(mapStyle?.valueOrNull, "dark");
    });
  });
}
