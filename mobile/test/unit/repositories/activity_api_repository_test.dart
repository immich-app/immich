import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/models/activities/activity.model.dart';
import 'package:immich_mobile/repositories/activity_api.repository.dart';
import 'package:mocktail/mocktail.dart';
import 'package:openapi/api.dart';

import '../../api.mocks.dart';
import '../factories/activity_factory.dart';

void main() {
  late ActivityApiRepository sut;
  late MockActivitiesApi mockActivitiesApi;

  setUp(() {
    mockActivitiesApi = MockActivitiesApi();
    sut = ActivityApiRepository(mockActivitiesApi);
  });

  group('getAll', () {
    test('requests activities with additions', () async {
      when(
        () => mockActivitiesApi.getActivities('album-1', assetId: null, withAdditions: true),
      ).thenAnswer((_) async => []);

      await sut.getAll('album-1');

      verify(() => mockActivitiesApi.getActivities('album-1', assetId: null, withAdditions: true)).called(1);
    });

    test('maps each reaction type to the matching activity type', () async {
      when(() => mockActivitiesApi.getActivities('album-1', assetId: null, withAdditions: true)).thenAnswer(
        (_) async => [
          ActivityFactory.createDto(type: ReactionType.comment),
          ActivityFactory.createDto(type: ReactionType.assetAdded),
          ActivityFactory.createDto(type: ReactionType.like),
        ],
      );

      final activities = await sut.getAll('album-1');

      expect(activities.map((activity) => activity.type), [
        ActivityType.comment,
        ActivityType.assetAdded,
        ActivityType.like,
      ]);
    });

    test('maps present assetType and groupId onto the activity', () async {
      final dto = ActivityFactory.createDto(
        type: ReactionType.assetAdded,
        assetType: AssetTypeEnum.VIDEO,
        groupId: 'group-1',
      );
      when(
        () => mockActivitiesApi.getActivities('album-1', assetId: null, withAdditions: true),
      ).thenAnswer((_) async => [dto]);

      final activity = (await sut.getAll('album-1')).single;

      expect(activity.assetType, AssetTypeEnum.VIDEO);
      expect(activity.groupId, 'group-1');
    });

    test('maps absent assetType and groupId to null', () async {
      final dto = ActivityFactory.createDto(type: ReactionType.like);
      when(
        () => mockActivitiesApi.getActivities('album-1', assetId: null, withAdditions: true),
      ).thenAnswer((_) async => [dto]);

      final activity = (await sut.getAll('album-1')).single;

      expect(activity.assetType, isNull);
      expect(activity.groupId, isNull);
    });
  });
}
