import 'package:flutter_test/flutter_test.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/search_result.model.dart';
import 'package:immich_mobile/domain/services/search.service.dart';
import 'package:immich_mobile/models/search/search_filter.model.dart';
import 'package:immich_mobile/presentation/pages/search/paginated_search.provider.dart';
import 'package:immich_mobile/providers/infrastructure/search.provider.dart';
import 'package:immich_mobile/providers/sync_status.provider.dart';
import 'package:mocktail/mocktail.dart';

class _MockSearch extends Mock implements SearchService {}

class _FakeFilter extends Fake implements SearchFilter {}

void main() {
  setUpAll(() {
    registerFallbackValue(_FakeFilter());
  });

  group('paginatedSearchProvider', () {
    test('remote content changes rerun the active search from page 1', () async {
      final search = _MockSearch();
      final filter = SearchFilter.empty()..context = 'paris';
      when(() => search.search(any(), any())).thenAnswer((_) async => const SearchResult(assets: []));

      final container = ProviderContainer(overrides: [searchServiceProvider.overrideWithValue(search)]);
      addTearDown(container.dispose);

      await container.read(paginatedSearchProvider.notifier).search(filter);
      verify(() => search.search(filter, 1)).called(1);

      container.read(syncStatusProvider.notifier).markRemoteContentChanged();
      await Future<void>.delayed(const Duration(milliseconds: 5));

      verify(() => search.search(filter, 1)).called(1);
    });
  });
}
