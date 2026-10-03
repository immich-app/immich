import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/presentation/pages/search/search.page.dart';
import 'package:immich_mobile/providers/server_info.provider.dart';

import '../../unit/presentation/presentation_context.dart';

/// Server info whose features arrive after the page is built, like on a slow or late connection
class DelayedServerInfoNotifier extends ServerInfoNotifier {
  DelayedServerInfoNotifier(super.serverInfoService);

  void enableSmartSearch() => state = state.copyWith(serverFeatures: state.serverFeatures.copyWith(smartSearch: true));
}

void main() {
  late PresentationContext context;

  setUp(() async => context = await PresentationContext.create());

  tearDown(() async => context.dispose());

  final contextSearchIcon = find.byIcon(Icons.image_search_rounded);
  final filenameSearchIcon = find.byIcon(Icons.abc_rounded);

  Future<DelayedServerInfoNotifier> pumpSearchPage(WidgetTester tester) async {
    final serverInfo = DelayedServerInfoNotifier(context.service.serverInfo);
    await tester.pumpTestWidget(
      context,
      const SearchPage(),
      overrides: [serverInfoProvider.overrideWith((ref) => serverInfo)],
    );
    return serverInfo;
  }

  testWidgets('uses context search once smart search is reported by the server', (tester) async {
    final serverInfo = await pumpSearchPage(tester);
    expect(filenameSearchIcon, findsOneWidget);

    serverInfo.enableSmartSearch();
    await tester.pumpAndSettle();

    expect(contextSearchIcon, findsOneWidget);
    expect(filenameSearchIcon, findsNothing);
  });

  testWidgets('keeps the search type selected by the user', (tester) async {
    final serverInfo = await pumpSearchPage(tester);

    await tester.tap(find.byIcon(Icons.more_vert_rounded));
    await tester.pumpAndSettle();
    await tester.tap(find.byIcon(Icons.text_snippet_outlined));
    await tester.pumpAndSettle();

    serverInfo.enableSmartSearch();
    await tester.pumpAndSettle();

    expect(find.byIcon(Icons.text_snippet_outlined), findsOneWidget);
    expect(contextSearchIcon, findsNothing);
  });
}
