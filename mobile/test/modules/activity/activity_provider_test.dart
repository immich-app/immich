import 'package:flutter_test/flutter_test.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/models/activities/activity.model.dart';
import 'package:immich_mobile/modules/activities/providers/activity.provider.dart';
import 'package:immich_mobile/modules/activities/providers/activity_service.provider.dart';
import 'package:immich_mobile/modules/activities/providers/activity_statistics.provider.dart';
import 'package:mocktail/mocktail.dart';

import '../../fixtures/user.stub.dart';
import '../../test_utils.dart';
import 'activity_mocks.dart';

final _activities = [
  Activity(
    id: '1',
    createdAt: DateTime(100),
    type: ActivityType.comment,
    comment: 'First Activity',
    assetId: 'asset-2',
    user: UserStub.admin,
  ),
  Activity(
    id: '2',
    createdAt: DateTime(200),
    type: ActivityType.comment,
    comment: 'Second Activity',
    user: UserStub.user1,
  ),
  Activity(
    id: '3',
    createdAt: DateTime(300),
    type: ActivityType.like,
    assetId: 'asset-1',
    user: UserStub.admin,
  ),
  Activity(
    id: '4',
    createdAt: DateTime(400),
    type: ActivityType.like,
    user: UserStub.user1,
  ),
];

void main() {
  late ActivityServiceMock activityMock;
  late ActivityStatisticsMock activityStatisticsMock;
  late ProviderContainer container;
  late AlbumActivityProvider provider;
  late ListenerMock<AsyncValue<List<Activity>>> listener;

  setUpAll(() {
    registerFallbackValue(AsyncData<List<Activity>>([..._activities]));
  });

  setUp(() async {
    activityMock = ActivityServiceMock();
    activityStatisticsMock = ActivityStatisticsMock();
    container = TestUtils.createContainer(
      overrides: [
        activityServiceProvider.overrideWith((ref) => activityMock),
        activityStatisticsProvider('test-album', 'test-asset')
            .overrideWith(() => activityStatisticsMock),
      ],
    );

    // Mock values
    when(
      () => activityMock.getAllActivities('test-album', assetId: 'test-asset'),
    ).thenAnswer((_) async => [..._activities]);

    // Init and wait for providers future to complete
    provider = albumActivityProvider('test-album', 'test-asset');
    listener = ListenerMock();
    container.listen(
      provider,
      listener.call,
      fireImmediately: true,
    );

    await container.read(provider.future);
  });

  test('Returns a list of activity', () async {
    verifyInOrder([
      () => listener.call(null, const AsyncLoading()),
      () => listener.call(
            const AsyncLoading(),
            any(
              that: allOf(
                [
                  isA<AsyncData<List<Activity>>>(),
                  predicate(
                    (AsyncData<List<Activity>> ad) =>
                        ad.requireValue.every((e) => _activities.contains(e)),
                  ),
                ],
              ),
            ),
          ),
    ]);

    verifyNoMoreInteractions(listener);
  });

  group('addLike()', () {
    test('Like successfully added', () async {
      final like = Activity(
        id: '5',
        createdAt: DateTime(2023),
        type: ActivityType.like,
        user: UserStub.admin,
      );

      when(
        () => activityMock.addActivity(
          'test-album',
          ActivityType.like,
          assetId: 'test-asset',
        ),
      ).thenAnswer((_) async => AsyncData(like));

      await container.read(provider.notifier).addLike();

      verify(
        () => activityMock.addActivity(
          'test-album',
          ActivityType.like,
          assetId: 'test-asset',
        ),
      );

      final activities = await container.read(provider.future);
      expect(activities, hasLength(5));
      expect(activities, contains(like));

      // Never bump activity count for new likes
      verifyNever(() => activityStatisticsMock.addActivity());
    });

    test('Like failed', () async {
      final like = Activity(
        id: '5',
        createdAt: DateTime(2023),
        type: ActivityType.like,
        user: UserStub.admin,
      );
      when(
        () => activityMock.addActivity(
          'test-album',
          ActivityType.like,
          assetId: 'test-asset',
        ),
      ).thenAnswer(
        (_) async => AsyncError(Exception('Mock'), StackTrace.current),
      );

      await container.read(provider.notifier).addLike();

      verify(
        () => activityMock.addActivity(
          'test-album',
          ActivityType.like,
          assetId: 'test-asset',
        ),
      );

      final activities = await container.read(provider.future);
      expect(activities, hasLength(4));
      expect(activities, isNot(contains(like)));
    });
  });

  group('removeActivity()', () {
    test('Like successfully removed', () async {
      when(() => activityMock.removeActivity('3'))
          .thenAnswer((_) async => true);

      await container.read(provider.notifier).removeActivity('3');

      verify(
        () => activityMock.removeActivity('3'),
      );

      final activities = await container.read(provider.future);
      expect(activities, hasLength(3));
      expect(
        activities,
        isNot(anyElement(predicate((Activity a) => a.id == '3'))),
      );

      verifyNever(() => activityStatisticsMock.removeActivity());
    });

    test('Remove Like failed', () async {
      when(() => activityMock.removeActivity('3'))
          .thenAnswer((_) async => false);

      await container.read(provider.notifier).removeActivity('3');

      final activities = await container.read(provider.future);
      expect(activities, hasLength(4));
      expect(
        activities,
        anyElement(predicate((Activity a) => a.id == '3')),
      );
    });

    test('Comment successfully removed', () async {
      when(() => activityMock.removeActivity('1'))
          .thenAnswer((_) async => true);

      await container.read(provider.notifier).removeActivity('1');

      final activities = await container.read(provider.future);
      expect(
        activities,
        isNot(anyElement(predicate((Activity a) => a.id == '1'))),
      );

      verify(() => activityStatisticsMock.removeActivity());
    });
  });

  group('addComment()', () {
    late ActivityStatisticsMock albumActivityStatisticsMock;

    setUp(() {
      albumActivityStatisticsMock = ActivityStatisticsMock();
      container = TestUtils.createContainer(
        overrides: [
          activityServiceProvider.overrideWith((ref) => activityMock),
          activityStatisticsProvider('test-album', 'test-asset')
              .overrideWith(() => activityStatisticsMock),
          activityStatisticsProvider('test-album')
              .overrideWith(() => albumActivityStatisticsMock),
        ],
      );
    });

    test('Comment successfully added', () async {
      final comment = Activity(
        id: '5',
        createdAt: DateTime(2023),
        type: ActivityType.comment,
        user: UserStub.admin,
        comment: 'Test-Comment',
        assetId: 'test-asset',
      );

      when(
        () => activityMock.addActivity(
          'test-album',
          ActivityType.comment,
          assetId: 'test-asset',
          comment: 'Test-Comment',
        ),
      ).thenAnswer((_) async => AsyncData(comment));
      when(() => activityStatisticsMock.build('test-album', 'test-asset'))
          .thenReturn(4);
      when(() => albumActivityStatisticsMock.build('test-album')).thenReturn(2);

      await container.read(provider.notifier).addComment('Test-Comment');

      verify(
        () => activityMock.addActivity(
          'test-album',
          ActivityType.comment,
          assetId: 'test-asset',
          comment: 'Test-Comment',
        ),
      );

      final activities = await container.read(provider.future);
      expect(activities, hasLength(5));
      expect(activities, contains(comment));

      verify(() => activityStatisticsMock.addActivity());
      verify(() => albumActivityStatisticsMock.addActivity());
    });

    test('Comment successfully added without assetId', () async {
      final comment = Activity(
        id: '5',
        createdAt: DateTime(2023),
        type: ActivityType.comment,
        user: UserStub.admin,
        assetId: 'test-asset',
        comment: 'Test-Comment',
      );

      when(
        () => activityMock.addActivity(
          'test-album',
          ActivityType.comment,
          comment: 'Test-Comment',
        ),
      ).thenAnswer((_) async => AsyncData(comment));
      when(() => albumActivityStatisticsMock.build('test-album')).thenReturn(2);
      when(() => activityMock.getAllActivities('test-album'))
          .thenAnswer((_) async => [..._activities]);

      final albumProvider = albumActivityProvider('test-album');
      await container.read(albumProvider.notifier).addComment('Test-Comment');

      verify(
        () => activityMock.addActivity(
          'test-album',
          ActivityType.comment,
          assetId: null,
          comment: 'Test-Comment',
        ),
      );

      final activities = await container.read(albumProvider.future);
      expect(activities, hasLength(5));
      expect(activities, contains(comment));

      verifyNever(() => activityStatisticsMock.addActivity());
      verify(() => albumActivityStatisticsMock.addActivity());
    });

    test('Comment failed', () async {
      final comment = Activity(
        id: '5',
        createdAt: DateTime(2023),
        type: ActivityType.comment,
        user: UserStub.admin,
        comment: 'Test-Comment',
        assetId: 'test-asset',
      );

      when(
        () => activityMock.addActivity(
          'test-album',
          ActivityType.comment,
          assetId: 'test-asset',
          comment: 'Test-Comment',
        ),
      ).thenAnswer(
        (_) async => AsyncError(Exception('Error'), StackTrace.current),
      );

      await container.read(provider.notifier).addComment('Test-Comment');

      final activities = await container.read(provider.future);
      expect(activities, hasLength(4));
      expect(activities, isNot(contains(comment)));

      verifyNever(() => activityStatisticsMock.addActivity());
      verifyNever(() => albumActivityStatisticsMock.addActivity());
    });
  });
}
