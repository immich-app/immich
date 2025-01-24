@Skip('currently failing due to mock HTTP client to download ISAR binaries')
@Tags(['pages'])
library;

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/entities/store.entity.dart';
import 'package:immich_mobile/pages/search/search.page.dart';
import 'package:immich_mobile/providers/api.provider.dart';
import 'package:immich_mobile/providers/db.provider.dart';
import 'package:immich_mobile/providers/search/paginated_search.provider.dart';
import 'package:immich_mobile/widgets/asset_grid/asset_grid_data_structure.dart';
import 'package:isar/isar.dart';
import 'package:mocktail/mocktail.dart';
import 'package:openapi/api.dart';

import '../../dto.mocks.dart';
import '../../service.mocks.dart';
import '../../test_utils.dart';
import '../../widget_tester_extensions.dart';

void main() {
  late List<Override> overrides;
  late Isar db;
  late MockApiService mockApiService;
  late MockSearchApi mockSearchApi;

  setUpAll(() async {
    TestUtils.init();
    db = await TestUtils.initIsar();
    Store.init(db);
    mockApiService = MockApiService();
    mockSearchApi = MockSearchApi();
    when(() => mockApiService.searchApi).thenReturn(mockSearchApi);
    registerFallbackValue(MockSmartSearchDto());
    registerFallbackValue(MockMetadataSearchDto());
    overrides = [
      paginatedSearchRenderListProvider
          .overrideWithValue(AsyncValue.data(RenderList.empty())),
      dbProvider.overrideWithValue(db),
      apiServiceProvider.overrideWithValue(mockApiService),
    ];
  });

  final emptyTextSearch = isA<MetadataSearchDto>()
      .having((s) => s.originalFileName, 'originalFileName', null);

  testWidgets('contextual search with/without text', (tester) async {
    await tester.pumpConsumerWidget(
      const SearchPage(),
      overrides: overrides,
    );

    await tester.pumpAndSettle();

    expect(
      find.byIcon(Icons.abc_rounded),
      findsOneWidget,
      reason: 'Should have contextual search icon',
    );

    final searchField = find.byKey(const Key('search_text_field'));
    expect(searchField, findsOneWidget);

    await tester.enterText(searchField, 'test');
    await tester.testTextInput.receiveAction(TextInputAction.search);

    var captured = verify(
      () => mockSearchApi.searchSmart(captureAny()),
    ).captured;

    expect(
      captured.first,
      isA<SmartSearchDto>().having((s) => s.query, 'query', 'test'),
    );

    await tester.enterText(searchField, '');
    await tester.testTextInput.receiveAction(TextInputAction.search);

    captured = verify(() => mockSearchApi.searchAssets(captureAny())).captured;
    expect(captured.first, emptyTextSearch);
  });

  testWidgets('not contextual search with/without text', (tester) async {
    await tester.pumpConsumerWidget(
      const SearchPage(),
      overrides: overrides,
    );

    await tester.pumpAndSettle();

    await tester.tap(find.byKey(const Key('contextual_search_button')));

    await tester.pumpAndSettle();

    expect(
      find.byIcon(Icons.image_search_rounded),
      findsOneWidget,
      reason: 'Should not have contextual search icon',
    );

    final searchField = find.byKey(const Key('search_text_field'));
    expect(searchField, findsOneWidget);

    await tester.enterText(searchField, 'test');
    await tester.testTextInput.receiveAction(TextInputAction.search);

    var captured = verify(
      () => mockSearchApi.searchAssets(captureAny()),
    ).captured;

    expect(
      captured.first,
      isA<MetadataSearchDto>()
          .having((s) => s.originalFileName, 'originalFileName', 'test'),
    );

    await tester.enterText(searchField, '');
    await tester.testTextInput.receiveAction(TextInputAction.search);

    captured = verify(() => mockSearchApi.searchAssets(captureAny())).captured;
    expect(captured.first, emptyTextSearch);
  });
}
