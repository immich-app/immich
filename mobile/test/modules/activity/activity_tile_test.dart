@Skip('currently failing due to mock HTTP client to download ISAR binaries')
@Tags(['widget'])
library;

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/models/activities/activity.model.dart';
import 'package:immich_mobile/widgets/activities/activity_tile.dart';
import 'package:immich_mobile/providers/asset_viewer/current_asset.provider.dart';
import 'package:immich_mobile/entities/store.entity.dart';
import 'package:immich_mobile/widgets/common/user_circle_avatar.dart';
import 'package:isar/isar.dart';

import '../../fixtures/asset.stub.dart';
import '../../fixtures/user.stub.dart';
import '../../test_utils.dart';
import '../../widget_tester_extensions.dart';
import '../asset_viewer/asset_viewer_mocks.dart';

void main() {
  late MockCurrentAssetProvider assetProvider;
  late List<Override> overrides;
  late Isar db;

  setUpAll(() async {
    TestUtils.init();
    db = await TestUtils.initIsar();
    // For UserCircleAvatar
    Store.init(db);
    Store.put(StoreKey.currentUser, UserStub.admin);
    Store.put(StoreKey.serverEndpoint, '');
    Store.put(StoreKey.accessToken, '');
  });

  setUp(() {
    assetProvider = MockCurrentAssetProvider();
    overrides = [currentAssetProvider.overrideWith(() => assetProvider)];
  });

  testWidgets('Returns a ListTile', (tester) async {
    await tester.pumpConsumerWidget(
      ActivityTile(
        Activity(
          id: '1',
          createdAt: DateTime(100),
          type: ActivityType.like,
          user: UserStub.admin,
        ),
      ),
      overrides: overrides,
    );

    expect(find.byType(ListTile), findsOneWidget);
  });

  testWidgets('No trailing widget when activity assetId == null',
      (tester) async {
    await tester.pumpConsumerWidget(
      ActivityTile(
        Activity(
          id: '1',
          createdAt: DateTime(100),
          type: ActivityType.like,
          user: UserStub.admin,
        ),
      ),
      overrides: overrides,
    );

    final listTile = tester.widget<ListTile>(find.byType(ListTile));
    expect(listTile.trailing, isNull);
  });

  testWidgets(
      'Asset Thumbanil as trailing widget when activity assetId != null',
      (tester) async {
    await tester.pumpConsumerWidget(
      ActivityTile(
        Activity(
          id: '1',
          createdAt: DateTime(100),
          type: ActivityType.like,
          user: UserStub.admin,
          assetId: '1',
        ),
      ),
      overrides: overrides,
    );

    final listTile = tester.widget<ListTile>(find.byType(ListTile));
    expect(listTile.trailing, isNotNull);
    // TODO: Validate this to be the common class after migrating ActivityTile#_ActivityAssetThumbnail to a common class
  });

  testWidgets('No trailing widget when current asset != null', (tester) async {
    await tester.pumpConsumerWidget(
      ActivityTile(
        Activity(
          id: '1',
          createdAt: DateTime(100),
          type: ActivityType.like,
          user: UserStub.admin,
          assetId: '1',
        ),
      ),
      overrides: overrides,
    );

    assetProvider.state = AssetStub.image1;
    await tester.pumpAndSettle();

    final listTile = tester.widget<ListTile>(find.byType(ListTile));
    expect(listTile.trailing, isNull);
  });

  group('Like Activity', () {
    final activity = Activity(
      id: '1',
      createdAt: DateTime(100),
      type: ActivityType.like,
      user: UserStub.admin,
    );

    testWidgets('Like contains filled heart as leading', (tester) async {
      await tester.pumpConsumerWidget(
        ActivityTile(activity),
        overrides: overrides,
      );

      // Leading widget should not be null
      final listTile = tester.widget<ListTile>(find.byType(ListTile));
      expect(listTile.leading, isNotNull);

      // And should have a favorite icon
      final favoIconFinder = find.widgetWithIcon(
        listTile.leading!.runtimeType,
        Icons.favorite_rounded,
      );

      expect(favoIconFinder, findsOneWidget);
    });

    testWidgets('Like title is center aligned', (tester) async {
      await tester.pumpConsumerWidget(
        ActivityTile(activity),
        overrides: overrides,
      );

      final listTile = tester.widget<ListTile>(find.byType(ListTile));

      expect(listTile.titleAlignment, ListTileTitleAlignment.center);
    });

    testWidgets('No subtitle for likes', (tester) async {
      await tester.pumpConsumerWidget(
        ActivityTile(activity),
        overrides: overrides,
      );

      final listTile = tester.widget<ListTile>(find.byType(ListTile));

      expect(listTile.subtitle, isNull);
    });
  });

  group('Comment Activity', () {
    final activity = Activity(
      id: '1',
      createdAt: DateTime(100),
      type: ActivityType.comment,
      comment: 'This is a test comment',
      user: UserStub.admin,
    );

    testWidgets('Comment contains User Circle Avatar as leading',
        (tester) async {
      await tester.pumpConsumerWidget(
        ActivityTile(activity),
        overrides: overrides,
      );

      final userAvatarFinder = find.byType(UserCircleAvatar);
      expect(userAvatarFinder, findsOneWidget);

      // Leading widget should not be null
      final listTile = tester.widget<ListTile>(find.byType(ListTile));
      expect(listTile.leading, isNotNull);

      // Make sure that the leading widget is the UserCircleAvatar
      final userAvatar = tester.widget<UserCircleAvatar>(userAvatarFinder);
      expect(listTile.leading, userAvatar);
    });

    testWidgets('Comment title is top aligned', (tester) async {
      await tester.pumpConsumerWidget(
        ActivityTile(activity),
        overrides: overrides,
      );

      final listTile = tester.widget<ListTile>(find.byType(ListTile));

      expect(listTile.titleAlignment, ListTileTitleAlignment.top);
    });

    testWidgets('Contains comment text as subtitle', (tester) async {
      await tester.pumpConsumerWidget(
        ActivityTile(activity),
        overrides: overrides,
      );

      final listTile = tester.widget<ListTile>(find.byType(ListTile));

      expect(listTile.subtitle, isNotNull);
      expect(
        find.descendant(
          of: find.byType(ListTile),
          matching: find.text(activity.comment!),
        ),
        findsOneWidget,
      );
    });
  });
}
