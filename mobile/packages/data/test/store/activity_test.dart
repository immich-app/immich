import 'package:flutter_test/flutter_test.dart';
import 'package:immich_data/model/activity.dart';
import 'package:immich_data/model/user/user.dart';
import 'package:immich_data/server/activity.dart';
import 'package:immich_data/server/errors.dart';
import 'package:immich_data/store/activity.dart';
import 'package:immich_data/store/store.dart';
import 'package:mocktail/mocktail.dart';
import 'package:riverpod/riverpod.dart';

class MockActivityApiRepository extends Mock implements ActivityApiRepository {}

void main() {
  late ProviderContainer container;
  late MockActivityApiRepository api;

  const albumId = 'album-1';
  const assetId = 'asset-1';

  final user = UserDto(id: 'user-1', email: 'user@test.com', name: 'User', profileChangedAt: DateTime.utc(2025));

  Activity activity(String id, {String? assetId, ActivityType type = ActivityType.comment, String? comment}) =>
      Activity(id: id, assetId: assetId, comment: comment, createdAt: DateTime.utc(2025), type: type, user: user);

  final albumScoped = Store.activity.list(albumId);
  final assetScoped = Store.activity.list(albumId, assetId: assetId);

  Future<void> pumpBothScopes() async {
    container.listen(albumScoped, (_, _) {});
    container.listen(assetScoped, (_, _) {});
    await container.read(albumScoped.future);
    await container.read(assetScoped.future);
  }

  List<String> idsIn(ProviderListenable<AsyncValue<List<Activity>>> scope) =>
      container.read(scope).requireValue.map((a) => a.id).toList();

  void stubFetch({required List<Activity> albumScoped, required List<Activity> assetScoped}) {
    when(() => api.getAll(albumId, assetId: null)).thenAnswer((_) async => albumScoped);
    when(() => api.getAll(albumId, assetId: assetId)).thenAnswer((_) async => assetScoped);
  }

  setUp(() {
    api = MockActivityApiRepository();
    container = ProviderContainer(overrides: [activityApiProvider.overrideWithValue(api)]);
    addTearDown(container.dispose);
  });

  group('list', () {
    test('album/asset scopes fetch and expose independent views', () async {
      stubFetch(
        albumScoped: [
          activity('c1'),
          activity('c2', assetId: assetId),
        ],
        assetScoped: [activity('c2', assetId: assetId)],
      );

      await pumpBothScopes();

      expect(idsIn(albumScoped), ['c1', 'c2']);
      expect(idsIn(assetScoped), ['c2']);
    });

    test('fetch failures become an empty list', () async {
      when(() => api.getAll(albumId, assetId: null)).thenAnswer((_) => Future.error(Exception('network down')));

      container.listen(albumScoped, (_, _) {});

      expect(await container.read(albumScoped.future), isEmpty);
    });

    test('an unwatched scope is disposed and refetches on the next watch', () async {
      stubFetch(albumScoped: [], assetScoped: []);

      final subscription = container.listen(albumScoped, (_, _) {});
      await container.read(albumScoped.future);

      subscription.close();
      await pumpEventQueue();

      container.listen(albumScoped, (_, _) {});
      await container.read(albumScoped.future);

      verify(() => api.getAll(albumId, assetId: null)).called(2);
    });
  });

  group('mutations', () {
    test('addLike on an asset patches both the asset and album scopes', () async {
      stubFetch(albumScoped: [], assetScoped: []);
      final like = activity('l1', assetId: assetId, type: ActivityType.like);
      when(() => api.create(albumId, ActivityType.like, assetId: assetId)).thenAnswer((_) async => like);
      await pumpBothScopes();

      await container.read(Store.activity).addLike(albumId, assetId: assetId);
      await pumpEventQueue();

      expect(idsIn(albumScoped), ['l1']);
      expect(idsIn(assetScoped), ['l1']);
    });

    test('addComment on the album alone does not touch the asset scope', () async {
      stubFetch(albumScoped: [], assetScoped: []);
      final comment = activity('c1', comment: 'nice');
      when(
        () => api.create(albumId, ActivityType.comment, assetId: null, comment: 'nice'),
      ).thenAnswer((_) async => comment);
      await pumpBothScopes();

      await container.read(Store.activity).addComment(albumId, 'nice');
      await pumpEventQueue();

      expect(idsIn(albumScoped), ['c1']);
      expect(idsIn(assetScoped), isEmpty);
    });

    test('remove drops the activity from every scope, treating NoResponseDtoError as success', () async {
      final doomed = activity('c1', assetId: assetId);
      stubFetch(albumScoped: [doomed, activity('c2')], assetScoped: [doomed]);
      // `checkNull` throws on every successful delete because the API returns no body
      when(() => api.delete('c1')).thenAnswer((_) => Future.error(const NoResponseDtoError()));
      await pumpBothScopes();

      await container.read(Store.activity).remove(albumId, 'c1');
      await pumpEventQueue();

      expect(idsIn(albumScoped), ['c2']);
      expect(idsIn(assetScoped), isEmpty);
    });

    test('mutations in other albums do not touch this scope', () async {
      stubFetch(albumScoped: [], assetScoped: []);
      final other = activity('x1');
      when(
        () => api.create('album-2', ActivityType.comment, assetId: null, comment: 'hi'),
      ).thenAnswer((_) async => other);
      await pumpBothScopes();

      await container.read(Store.activity).addComment('album-2', 'hi');
      await pumpEventQueue();

      expect(idsIn(albumScoped), isEmpty);
      expect(idsIn(assetScoped), isEmpty);
    });
  });

  group('failed mutations', () {
    test('failed addLike rethrows and changes nothing', () async {
      stubFetch(albumScoped: [], assetScoped: []);
      when(
        () => api.create(albumId, ActivityType.like, assetId: assetId),
      ).thenAnswer((_) => Future.error(Exception('rejected')));
      await pumpBothScopes();

      await expectLater(container.read(Store.activity).addLike(albumId, assetId: assetId), throwsException);
      await pumpEventQueue();

      expect(idsIn(albumScoped), isEmpty);
      expect(idsIn(assetScoped), isEmpty);
    });

    test('failed remove rethrows and keeps the activity', () async {
      final kept = activity('c1', assetId: assetId);
      stubFetch(albumScoped: [kept], assetScoped: [kept]);
      when(() => api.delete('c1')).thenAnswer((_) => Future.error(Exception('rejected')));
      await pumpBothScopes();

      await expectLater(container.read(Store.activity).remove(albumId, 'c1'), throwsException);
      await pumpEventQueue();

      expect(idsIn(albumScoped), ['c1']);
      expect(idsIn(assetScoped), ['c1']);
    });
  });
}
