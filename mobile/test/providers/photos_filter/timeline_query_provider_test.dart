import 'package:flutter_test/flutter_test.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/models/search_result.model.dart';
import 'package:immich_mobile/domain/models/user.model.dart';
import 'package:immich_mobile/domain/services/search.service.dart';
import 'package:immich_mobile/domain/services/timeline.service.dart';
import 'package:immich_mobile/domain/services/user.service.dart';
import 'package:immich_mobile/models/search/search_filter.model.dart';
import 'package:immich_mobile/providers/infrastructure/search.provider.dart';
import 'package:immich_mobile/providers/infrastructure/timeline.provider.dart';
import 'package:immich_mobile/providers/infrastructure/user.provider.dart' as infra;
import 'package:immich_mobile/providers/photos_filter/photos_filter.provider.dart';
import 'package:immich_mobile/providers/photos_filter/timeline_query.provider.dart';
import 'package:immich_mobile/providers/sync_status.provider.dart';
import 'package:immich_mobile/providers/user.provider.dart';
import 'package:mocktail/mocktail.dart';

class _MockFactory extends Mock implements TimelineFactory {}

class _MockSearch extends Mock implements SearchService {}

class _FakeService extends Fake implements TimelineService {
  bool disposed = false;
  @override
  Future<void> dispose() async {
    disposed = true;
  }
}

class _FakeFilter extends Fake implements SearchFilter {}

class _MockUserService extends Mock implements UserService {}

UserDto _user(String id) => UserDto(id: id, email: '$id@example.com', name: id, profileChangedAt: DateTime(2024, 1, 1));

class _StubCurrentUserNotifier extends CurrentUserProvider {
  _StubCurrentUserNotifier(super.service, UserDto? initial) {
    state = initial;
  }
}

ProviderContainer _container({required TimelineFactory factory, required SearchService search, UserDto? user}) {
  final mockUserSvc = _MockUserService();
  when(() => mockUserSvc.tryGetMyUser()).thenReturn(user);
  when(() => mockUserSvc.watchMyUser()).thenAnswer((_) => const Stream<UserDto?>.empty());

  return ProviderContainer(
    overrides: [
      timelineFactoryProvider.overrideWithValue(factory),
      searchServiceProvider.overrideWithValue(search),
      infra.userServiceProvider.overrideWithValue(mockUserSvc),
      currentUserProvider.overrideWith((ref) => _StubCurrentUserNotifier(mockUserSvc, user)),
      timelineUsersProvider.overrideWith((_) => Stream<List<String>>.value(user == null ? <String>[] : [user.id])),
    ],
  );
}

void main() {
  setUpAll(() {
    registerFallbackValue(_FakeFilter());
    registerFallbackValue(TimelineOrigin.main);
    registerFallbackValue(() => const <BaseAsset>[]);
    registerFallbackValue(const Stream<int>.empty());
  });

  group('photosTimelineQueryProvider', () {
    test('empty filter → delegates to main-library service', () async {
      final factory = _MockFactory();
      final search = _MockSearch();
      final fake = _FakeService();
      when(() => factory.main(any(), any())).thenReturn(fake);

      final container = _container(factory: factory, search: search, user: _user('u1'));
      addTearDown(container.dispose);

      final svc = container.read(photosTimelineQueryProvider);
      expect(svc, same(fake));
      verify(() => factory.main(any(), 'u1')).called(1);
      verifyNever(() => search.search(any(), any()));
    });

    test('pre-login (no user) + non-empty filter → delegates to main-library service (no search)', () async {
      final factory = _MockFactory();
      final search = _MockSearch();
      final fake = _FakeService();
      when(() => factory.main(any(), any())).thenReturn(fake);

      final container = _container(factory: factory, search: search, user: null);
      container.read(photosFilterProvider.notifier).setText('paris');
      addTearDown(container.dispose);

      final svc = container.read(photosTimelineQueryProvider);
      expect(svc, same(fake));
      verifyNever(() => search.search(any(), any()));
    });

    test('non-empty filter + logged-in → builds search-backed service via fromAssetStream', () async {
      final factory = _MockFactory();
      final search = _MockSearch();
      final fake = _FakeService();
      when(() => search.search(any(), 1)).thenAnswer((_) async => const SearchResult(assets: []));
      when(() => factory.fromAssetStream(any(), any(), TimelineOrigin.search)).thenReturn(fake);

      final container = _container(factory: factory, search: search, user: _user('u1'));
      container.read(photosFilterProvider.notifier).setText('paris');
      addTearDown(container.dispose);

      final svc = container.read(photosTimelineQueryProvider);
      expect(svc, same(fake));
      await Future<void>.delayed(const Duration(milliseconds: 5));
      verify(() => search.search(any(), 1)).called(1);
      verify(() => factory.fromAssetStream(any(), any(), TimelineOrigin.search)).called(1);
    });

    test('remote content changes refresh the active search-backed timeline', () async {
      final factory = _MockFactory();
      final search = _MockSearch();
      final fake = _FakeService();
      when(() => search.search(any(), 1)).thenAnswer((_) async => const SearchResult(assets: []));
      when(() => factory.fromAssetStream(any(), any(), TimelineOrigin.search)).thenReturn(fake);

      final container = _container(factory: factory, search: search, user: _user('u1'));
      await container.read(timelineUsersProvider.future);
      container.read(photosFilterProvider.notifier).setNotInAlbum(true);
      addTearDown(container.dispose);

      container.read(photosTimelineQueryProvider);
      await Future<void>.delayed(const Duration(milliseconds: 5));
      verify(() => search.search(any(), 1)).called(1);

      container.read(syncStatusProvider.notifier).markRemoteContentChanged();
      container.read(photosTimelineQueryProvider);
      await Future<void>.delayed(const Duration(milliseconds: 5));

      verify(() => search.search(any(), 1)).called(1);
    });

    test('disposes the created service when the container disposes', () async {
      final factory = _MockFactory();
      final search = _MockSearch();
      final fake = _FakeService();
      when(() => factory.main(any(), any())).thenReturn(fake);

      final container = _container(factory: factory, search: search, user: _user('u1'));
      container.read(photosTimelineQueryProvider);
      container.dispose();

      // Dispose is async; allow microtask drain.
      await Future<void>.delayed(const Duration(milliseconds: 5));
      expect(fake.disposed, isTrue);
    });
  });
}
