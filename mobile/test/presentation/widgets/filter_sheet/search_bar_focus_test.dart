import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/presentation/widgets/filter_sheet/search_bar.widget.dart';
import 'package:immich_mobile/providers/photos_filter/filter_sheet.provider.dart';
import 'package:immich_mobile/providers/photos_filter/photos_filter.provider.dart';
import 'package:immich_mobile/providers/photos_filter/search_focus.provider.dart';

import '../../../widget_tester_extensions.dart';

void main() {
  testWidgets('keyboard search submits text immediately and hides the filter sheet', (tester) async {
    final container = ProviderContainer();
    addTearDown(container.dispose);
    container.read(photosFilterSheetProvider.notifier).state = FilterSheetSnap.browse;

    await tester.pumpWidget(
      UncontrolledProviderScope(
        container: container,
        child: const MaterialApp(home: Material(child: FilterSheetSearchBar())),
      ),
    );
    await tester.pumpAndSettle();

    await tester.enterText(find.byType(TextField), 'beach');
    await tester.testTextInput.receiveAction(TextInputAction.search);
    await tester.pump();

    expect(container.read(photosFilterProvider).context, 'beach');
    expect(container.read(photosFilterSheetProvider), FilterSheetSnap.hidden);
  });

  testWidgets('mounted-before-increment: focus requested on counter rise', (tester) async {
    await tester.pumpConsumerWidget(const FilterSheetSearchBar());
    await tester.pumpAndSettle();

    final container = ProviderScope.containerOf(tester.element(find.byType(FilterSheetSearchBar)));
    final textField = tester.widget<TextField>(find.byType(TextField));
    expect(textField.focusNode!.hasFocus, isFalse, reason: 'not focused initially');

    container.read(photosFilterSearchFocusRequestProvider.notifier).state++;
    await tester.pumpAndSettle();

    final updatedField = tester.widget<TextField>(find.byType(TextField));
    expect(updatedField.focusNode!.hasFocus, isTrue, reason: 'focus requested after counter++');
  });

  testWidgets('mounted-after-increment: first build catches the request', (tester) async {
    final container = ProviderContainer();
    addTearDown(container.dispose);
    container.read(photosFilterSearchFocusRequestProvider.notifier).state = 1;

    await tester.pumpWidget(
      UncontrolledProviderScope(
        container: container,
        child: const MaterialApp(home: Material(child: FilterSheetSearchBar())),
      ),
    );
    await tester.pumpAndSettle();

    final textField = tester.widget<TextField>(find.byType(TextField));
    expect(textField.focusNode!.hasFocus, isTrue, reason: 'race: mount-after-increment still focuses');
  });

  testWidgets('duplicate increments in one frame coalesce', (tester) async {
    await tester.pumpConsumerWidget(const FilterSheetSearchBar());
    await tester.pumpAndSettle();
    final container = ProviderScope.containerOf(tester.element(find.byType(FilterSheetSearchBar)));

    container.read(photosFilterSearchFocusRequestProvider.notifier).state++;
    container.read(photosFilterSearchFocusRequestProvider.notifier).state++;
    await tester.pumpAndSettle();

    final textField = tester.widget<TextField>(find.byType(TextField));
    expect(textField.focusNode!.hasFocus, isTrue);
  });

  testWidgets('unmount then increment: no crash', (tester) async {
    final container = ProviderContainer();
    addTearDown(container.dispose);

    await tester.pumpWidget(
      UncontrolledProviderScope(
        container: container,
        child: const MaterialApp(home: Material(child: FilterSheetSearchBar())),
      ),
    );
    await tester.pumpAndSettle();

    // Unmount the widget while keeping the container alive.
    await tester.pumpWidget(const SizedBox.shrink());
    await tester.pumpAndSettle();

    // Should not throw.
    container.read(photosFilterSearchFocusRequestProvider.notifier).state++;
    await tester.pump();
  });

  testWidgets('remount with unchanged counter does not re-focus (snap-transition regression)', (tester) async {
    // User opens sheet via search blob → counter bumped, search bar mounts and
    // focuses. User dismisses keyboard. User taps More filters → browse snap
    // unmounts, deep snap mounts a FRESH search bar. Because the counter
    // hasn't changed (same request), the new mount must NOT auto-focus.
    final container = ProviderContainer();
    addTearDown(container.dispose);
    container.read(photosFilterSearchFocusRequestProvider.notifier).state = 1;

    await tester.pumpWidget(
      UncontrolledProviderScope(
        container: container,
        child: const MaterialApp(home: Material(child: FilterSheetSearchBar())),
      ),
    );
    await tester.pumpAndSettle();
    expect(tester.widget<TextField>(find.byType(TextField)).focusNode!.hasFocus, isTrue);

    // Simulate user dismissing keyboard.
    tester.widget<TextField>(find.byType(TextField)).focusNode!.unfocus();
    await tester.pumpAndSettle();
    expect(tester.widget<TextField>(find.byType(TextField)).focusNode!.hasFocus, isFalse);

    // Remount a fresh instance (same container = same providers), counter unchanged.
    await tester.pumpWidget(const SizedBox.shrink());
    await tester.pumpWidget(
      UncontrolledProviderScope(
        container: container,
        child: const MaterialApp(home: Material(child: FilterSheetSearchBar())),
      ),
    );
    await tester.pumpAndSettle();

    expect(
      tester.widget<TextField>(find.byType(TextField)).focusNode!.hasFocus,
      isFalse,
      reason: 'remount without a new request must not re-focus — the original request was already consumed',
    );
  });
}
