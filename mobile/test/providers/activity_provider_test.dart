import 'dart:async';

import 'package:flutter_test/flutter_test.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_data/data_controller.dart';
import 'package:immich_data/model/activity.dart';
import 'package:immich_data/model/user/user.dart';
import 'package:immich_data/store/activity.dart';
import 'package:immich_mobile/providers/infrastructure/data_store.dart';
import 'package:immich_mobile/store/activity.dart';
import 'package:mocktail/mocktail.dart';

class MockDataController extends Mock implements DataController {}

class MockActivityService extends Mock implements ActivityService {}

void main() {
  late ProviderContainer container;
  late MockActivityService service;
  late StreamController<List<Activity>> albumScopedStream;
  late StreamController<List<Activity>> assetScopedStream;

  const albumId = 'album-1';
  const assetId = 'asset-1';
  const albumScoped = (albumId, null);
  const assetScoped = (albumId, assetId);

  final user = UserDto(id: 'user-1', email: 'user@test.com', name: 'User', profileChangedAt: DateTime.utc(2025));

  Activity activity(String id, {String? assetId, ActivityType type = ActivityType.comment, String? comment}) =>
      Activity(id: id, assetId: assetId, comment: comment, createdAt: DateTime.utc(2025), type: type, user: user);

  Future<void> pumpBothScopes() async {
    container.listen(albumActivityProvider(assetScoped), (_, _) {});
    container.listen(albumActivityProvider(albumScoped), (_, _) {});
    albumScopedStream.add([]);
    assetScopedStream.add([]);
    await container.read(albumActivityProvider(assetScoped).future);
    await container.read(albumActivityProvider(albumScoped).future);
  }

  List<String> idsIn((String, String?) scope) =>
      container.read(albumActivityProvider(scope)).requireValue.map((a) => a.id).toList();

  setUp(() {
    service = MockActivityService();
    albumScopedStream = StreamController<List<Activity>>.broadcast();
    assetScopedStream = StreamController<List<Activity>>.broadcast();
    addTearDown(albumScopedStream.close);
    addTearDown(assetScopedStream.close);
    when(() => service.getAll(albumId, assetId: null, force: true)).thenAnswer((_) => albumScopedStream.stream);
    when(() => service.getAll(albumId, assetId: assetId, force: true)).thenAnswer((_) => assetScopedStream.stream);

    final controller = MockDataController();
    when(() => controller.activities).thenReturn(service);

    container = ProviderContainer(overrides: [Store.overrideWithValue(controller)]);
    addTearDown(container.dispose);
  });

  group('build', () {
    test('album/asset scopes get their own views', () async {
      container.listen(albumActivityProvider(assetScoped), (_, _) {});
      container.listen(albumActivityProvider(albumScoped), (_, _) {});
      albumScopedStream.add([activity('c1'), activity('c2', assetId: assetId)]);
      assetScopedStream.add([activity('c2', assetId: assetId)]);

      expect(await container.read(albumActivityProvider(albumScoped).future), hasLength(2));
      expect(await container.read(albumActivityProvider(assetScoped).future), hasLength(1));
    });

    test('errors become an empty list', () async {
      container.listen(albumActivityProvider(albumScoped), (_, _) {});
      albumScopedStream.addError(Exception('network down'));

      expect(await container.read(albumActivityProvider(albumScoped).future), isEmpty);
    });
  });

  test('new events get pushed to Riverpod', () async {
    await pumpBothScopes();

    final like = activity('l1', assetId: assetId, type: ActivityType.like);
    albumScopedStream.add([like]);
    assetScopedStream.add([like]);
    await pumpEventQueue();

    expect(idsIn(albumScoped), ['l1']);
    expect(idsIn(assetScoped), ['l1']);
  });

  group('mutations', () {
    test('addLike calls API', () async {
      final like = activity('l1', assetId: assetId, type: ActivityType.like);
      when(() => service.addLike(albumId, assetId: assetId)).thenAnswer((_) async => like);
      await pumpBothScopes();

      await container.read(albumActivityProvider(assetScoped).notifier).addLike();

      verify(() => service.addLike(albumId, assetId: assetId)).called(1);
    });

    test('addComment calls API', () async {
      final comment = activity('c1', assetId: assetId, comment: 'nice');
      when(() => service.addComment(albumId, 'nice', assetId: assetId)).thenAnswer((_) async => comment);
      await pumpBothScopes();

      await container.read(albumActivityProvider(assetScoped).notifier).addComment('nice');

      verify(() => service.addComment(albumId, 'nice', assetId: assetId)).called(1);
    });

    test('removeActivity calls API', () async {
      when(() => service.remove(albumId, 'c1')).thenAnswer((_) async {});
      await pumpBothScopes();

      await container.read(albumActivityProvider(assetScoped).notifier).removeActivity('c1');

      verify(() => service.remove(albumId, 'c1')).called(1);
    });
  });

  group('failed mutations', () {
    test('addLike logs error', () async {
      when(() => service.addLike(albumId, assetId: assetId)).thenAnswer((_) => Future.error(Exception('rejected')));
      await pumpBothScopes();

      await container.read(albumActivityProvider(assetScoped).notifier).addLike();

      expect(idsIn(assetScoped), isEmpty);
      expect(idsIn(albumScoped), isEmpty);
    });

    test('removeActivity logs error', () async {
      when(() => service.remove(albumId, 'c1')).thenAnswer((_) => Future.error(Exception('rejected')));
      await pumpBothScopes();

      await container.read(albumActivityProvider(assetScoped).notifier).removeActivity('c1');

      expect(idsIn(assetScoped), isEmpty);
      expect(idsIn(albumScoped), isEmpty);
    });
  });
}
