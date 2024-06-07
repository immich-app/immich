@Skip('currently failing due to mock HTTP client to download ISAR binaries')
@Tags(['widget'])
library;

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/models/activities/activity.model.dart';
import 'package:immich_mobile/providers/activity.provider.dart';
import 'package:immich_mobile/pages/common/activities.page.dart';
import 'package:immich_mobile/widgets/activities/activity_text_field.dart';
import 'package:immich_mobile/widgets/activities/dismissible_activity.dart';
import 'package:immich_mobile/providers/album/current_album.provider.dart';
import 'package:immich_mobile/providers/asset_viewer/current_asset.provider.dart';
import 'package:immich_mobile/entities/album.entity.dart';
import 'package:immich_mobile/entities/asset.entity.dart';
import 'package:immich_mobile/entities/store.entity.dart';
import 'package:immich_mobile/entities/user.entity.dart';
import 'package:immich_mobile/providers/user.provider.dart';
import 'package:isar/isar.dart';
import 'package:mocktail/mocktail.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

import '../../fixtures/album.stub.dart';
import '../../fixtures/asset.stub.dart';
import '../../fixtures/user.stub.dart';
import '../../test_utils.dart';
import '../../widget_tester_extensions.dart';
import '../asset_viewer/asset_viewer_mocks.dart';
import '../album/album_mocks.dart';
import '../shared/shared_mocks.dart';
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
    user: UserStub.user2,
  ),
  Activity(
    id: '4',
    createdAt: DateTime(400),
    type: ActivityType.like,
    user: UserStub.user1,
  ),
];

void main() {
  late MockAlbumActivity activityMock;
  late MockCurrentAlbumProvider mockCurrentAlbumProvider;
  late MockCurrentAssetProvider mockCurrentAssetProvider;
  late List<Override> overrides;
  late Isar db;

  setUpAll(() async {
    TestUtils.init();
    db = await TestUtils.initIsar();
    Store.init(db);
    Store.put(StoreKey.currentUser, UserStub.admin);
    Store.put(StoreKey.serverEndpoint, '');
    Store.put(StoreKey.accessToken, '');
  });

  setUp(() async {
    mockCurrentAlbumProvider = MockCurrentAlbumProvider(AlbumStub.twoAsset);
    mockCurrentAssetProvider = MockCurrentAssetProvider(AssetStub.image1);
    activityMock = MockAlbumActivity(_activities);
    overrides = [
      albumActivityProvider(
        AlbumStub.twoAsset.remoteId!,
        AssetStub.image1.remoteId!,
      ).overrideWith(() => activityMock),
      currentAlbumProvider.overrideWith(() => mockCurrentAlbumProvider),
      currentAssetProvider.overrideWith(() => mockCurrentAssetProvider),
    ];

    await db.writeTxn(() async {
      await db.clear();
      // Save all assets
      await db.users.put(UserStub.admin);
      await db.assets.putAll([AssetStub.image1, AssetStub.image2]);
      await db.albums.put(AlbumStub.twoAsset);
      await AlbumStub.twoAsset.owner.save();
      await AlbumStub.twoAsset.assets.save();
    });
    expect(db.albums.countSync(), 1);
    expect(db.assets.countSync(), 2);
    expect(db.users.countSync(), 1);
  });

  group("App bar", () {
    testWidgets(
      "No title when currentAsset != null",
      (tester) async {
        await tester.pumpConsumerWidget(
          const ActivitiesPage(),
          overrides: overrides,
        );

        final listTile = tester.widget<AppBar>(find.byType(AppBar));
        expect(listTile.title, isNull);
      },
    );

    testWidgets(
      "Album name as title when currentAsset == null",
      (tester) async {
        await tester.pumpConsumerWidget(
          const ActivitiesPage(),
          overrides: overrides,
        );
        await tester.pumpAndSettle();

        mockCurrentAssetProvider.state = null;
        await tester.pumpAndSettle();

        expect(find.text(AlbumStub.twoAsset.name), findsOneWidget);
        final listTile = tester.widget<AppBar>(find.byType(AppBar));
        expect(listTile.title, isNotNull);
      },
    );
  });

  group("Body", () {
    testWidgets(
      "Contains a stack with Activity List and Activity Input",
      (tester) async {
        await tester.pumpConsumerWidget(
          const ActivitiesPage(),
          overrides: overrides,
        );
        await tester.pumpAndSettle();

        expect(
          find.descendant(
            of: find.byType(Stack),
            matching: find.byType(ActivityTextField),
          ),
          findsOneWidget,
        );

        expect(
          find.descendant(
            of: find.byType(Stack),
            matching: find.byType(ListView),
          ),
          findsOneWidget,
        );
      },
    );

    testWidgets(
      "List Contains all dismissible activities",
      (tester) async {
        await tester.pumpConsumerWidget(
          const ActivitiesPage(),
          overrides: overrides,
        );
        await tester.pumpAndSettle();

        final listFinder = find.descendant(
          of: find.byType(Stack),
          matching: find.byType(ListView),
        );
        final listChildren = find.descendant(
          of: listFinder,
          matching: find.byType(DismissibleActivity),
        );
        expect(listChildren, findsNWidgets(_activities.length));
      },
    );

    testWidgets(
      "Submitting text input adds a comment with the text",
      (tester) async {
        await tester.pumpConsumerWidget(
          const ActivitiesPage(),
          overrides: overrides,
        );
        await tester.pumpAndSettle();

        when(() => activityMock.addComment(any()))
            .thenAnswer((_) => Future.value());

        final textField = find.byType(TextField);
        await tester.enterText(textField, 'Test comment');
        await tester.testTextInput.receiveAction(TextInputAction.done);

        verify(() => activityMock.addComment('Test comment'));
      },
    );

    testWidgets(
      "Owner can remove all activities",
      (tester) async {
        await tester.pumpConsumerWidget(
          const ActivitiesPage(),
          overrides: overrides,
        );
        await tester.pumpAndSettle();

        final deletableActivityFinder = find.byWidgetPredicate(
          (widget) => widget is DismissibleActivity && widget.onDismiss != null,
        );
        expect(deletableActivityFinder, findsNWidgets(_activities.length));
      },
    );

    testWidgets(
      "Non-Owner can remove only their activities",
      (tester) async {
        final mockCurrentUser = MockCurrentUserProvider();

        await tester.pumpConsumerWidget(
          const ActivitiesPage(),
          overrides: [
            ...overrides,
            currentUserProvider.overrideWith((ref) => mockCurrentUser),
          ],
        );
        mockCurrentUser.state = UserStub.user1;
        await tester.pumpAndSettle();

        final deletableActivityFinder = find.byWidgetPredicate(
          (widget) => widget is DismissibleActivity && widget.onDismiss != null,
        );
        expect(
          deletableActivityFinder,
          findsNWidgets(
            _activities.where((a) => a.user == UserStub.user1).length,
          ),
        );
      },
    );
  });
}
