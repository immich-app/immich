import 'package:flutter_test/flutter_test.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/data/server/activity.dart';
import 'package:immich_mobile/data/server/errors.dart';
import 'package:immich_mobile/data/store.dart';
import 'package:immich_mobile/domain/models/user.model.dart';
import 'package:immich_mobile/models/activities/activity.model.dart';
import 'package:mocktail/mocktail.dart';

class _MockActivityApi extends Mock implements ActivityApiRepository {}

final _user = UserDto(id: 'u1', email: 'u1@test.com', name: 'User', profileChangedAt: DateTime.utc(2025));

Activity _activity(String id, {String? assetId, ActivityType type = ActivityType.comment}) =>
    Activity(id: id, albumId: 'album', assetId: assetId, createdAt: DateTime.utc(2026), type: type, user: _user);

void main() {
  late _MockActivityApi api;
  late ProviderContainer container;

  setUp(() {
    api = _MockActivityApi();
    container = ProviderContainer(overrides: [activityApiRepositoryProvider.overrideWithValue(api)]);
    addTearDown(container.dispose);

    // Fetches for any ID default to empty
    when(() => api.getAll(any(), assetId: any(named: 'assetId'))).thenAnswer((_) async => []);
  });

  Future<void> load(String albumId, {String? assetId}) async {
    // Create a lock on the provider scope so it doesn't get disposed
    container.listen(Store.activity.list(albumId, assetId: assetId), (_, _) {});
    await container.read(Store.activity.list(albumId, assetId: assetId).future);
  }

  List<Activity>? current(String albumId, {String? assetId}) =>
      container.read(Store.activity.list(albumId, assetId: assetId)).value;

  test('list serves fetched activities', () async {
    when(() => api.getAll('album', assetId: null)).thenAnswer((_) async => [_activity('1')]);
    when(() => api.getAll('broken', assetId: null)).thenThrow(Exception('offline'));

    await load('album');
    await load('broken');

    expect(current('album'), [_activity('1')]);
    expect(current('broken'), isEmpty);
  });

  test('addComment appends the created activity to the live album and asset lists', () async {
    await load('album');
    await load('album', assetId: 'asset');

    final created = _activity('c1', assetId: 'asset');
    when(
      () => api.create('album', ActivityType.comment, assetId: 'asset', comment: 'hi'),
    ).thenAnswer((_) async => created);

    await container.read(Store.activity).addComment('album', 'hi', assetId: 'asset');

    expect(current('album'), [created]);
    expect(current('album', assetId: 'asset'), [created]);
  });

  test('addLike appends the created like to the live album list', () async {
    await load('album');
    final created = _activity('l1', type: ActivityType.like);
    when(() => api.create('album', ActivityType.like, assetId: null)).thenAnswer((_) async => created);

    await container.read(Store.activity).addLike('album');

    expect(current('album'), [created]);
  });

  test('remove deletes the activity', () async {
    when(() => api.getAll('album', assetId: null)).thenAnswer((_) async => [_activity('1')]);
    await load('album');

    // The delete endpoint sends no response body, producing an error on our side
    when(() => api.delete('1')).thenThrow(const NoResponseDtoError());

    await container.read(Store.activity).remove(_activity('1'));

    expect(current('album'), isEmpty);
  });
}
